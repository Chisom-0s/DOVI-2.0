import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { warmupBackend } from '@/api/client';
import type { User } from '@/types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  role?: 'BUYER' | 'VENDOR';
  disabled?: boolean;
  onSuccess?: (user: User) => void;
  onError?: (err: any) => void;
}

export default function GoogleAuthButton({
  mode,
  role = 'BUYER',
  disabled = false,
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  // Handle credential response from Google Identity Services
  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response?.credential) {
      toast.error('No credential received from Google.');
      return;
    }

    setIsLoading(true);
    const maxAttempts = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const user = await loginWithGoogle(response.credential, role);
        toast.success(
          mode === 'signup'
            ? `Welcome to Dovi, ${user.first_name || 'User'}!`
            : `Signed in as ${user.email}`
        );
        if (onSuccess) {
          onSuccess(user);
        } else {
          navigate(from, { replace: true });
        }
        setIsLoading(false);
        return;
      } catch (err: any) {
        lastError = err;
        const isNetwork = err?.code === 'NETWORK_ERROR' || !err?.response;
        if (isNetwork && attempt < maxAttempts) {
          // If server was cold starting, wait with backoff and retry seamlessly
          await new Promise(res => setTimeout(res, 1200 * attempt));
          continue;
        }
        break;
      }
    }

    setIsLoading(false);
    console.error('Google auth error:', lastError);
    const message = lastError?.message || 'Google authentication failed. Please try again.';
    toast.error(message);
    onError?.(lastError);
  };

  // Pre-warm backend immediately when auth button appears on screen
  useEffect(() => {
    warmupBackend();
  }, []);

  // Load GIS script dynamically if Client ID is configured
  useEffect(() => {
    if (!clientId) return;

    // Check if script is already present
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setGisLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services SDK');
    };
    document.head.appendChild(script);
  }, [clientId]);

  // Initialize and render Google button once GIS is loaded
  useEffect(() => {
    if (!gisLoaded || !clientId || !googleBtnContainerRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior children
      googleBtnContainerRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 360,
      });
    } catch (err) {
      console.error('Error rendering Google button:', err);
    }
  }, [gisLoaded, clientId, mode]);

  // Click handler when GIS is not configured or for custom button fallback
  const handleCustomButtonClick = () => {
    if (!clientId) {
      toast.error(
        'Google OAuth Client ID is not configured yet. Please add VITE_GOOGLE_CLIENT_ID to your frontend .env file.'
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Sign-In is initializing. Please try again in a moment.');
    }
  };

  const buttonText = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* If Client ID is set and GIS is loaded, container hosts the official Google button */}
      {clientId && (
        <div
          ref={googleBtnContainerRef}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '44px',
            marginBottom: gisLoaded ? '0' : '-44px',
            opacity: gisLoaded ? 1 : 0,
            pointerEvents: gisLoaded && !disabled && !isLoading ? 'auto' : 'none',
          }}
        />
      )}

      {/* Fallback button when GIS is not yet loaded or client ID is not yet provided */}
      {(!clientId || !gisLoaded) && (
        <button
          type="button"
          className="auth-card__google-btn"
          onClick={handleCustomButtonClick}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          style={{ width: '100%', opacity: disabled || isLoading ? 0.7 : 1 }}
        >
          <svg className="auth-card__google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Connecting to Google...' : buttonText}
        </button>
      )}
    </div>
  );
}
