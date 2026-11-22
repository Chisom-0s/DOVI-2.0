import { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import '@/utils/toastDedupe';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PromptEngineProvider } from '@/contexts/PromptEngineContext';
import AppRouter from '@/router';
import DoviSplashScreen from '@/components/common/DoviSplashScreen';
import SmartsuppChat from '@/components/common/SmartsuppChat';

// ============================================================
// App
// Root component — wraps everything in:
//   ErrorBoundary → AuthProvider → CartProvider → Router
// Toaster is outside router so toasts work on any page.
// ============================================================
export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return !sessionStorage.getItem('dovi_splash_shown');
    }
    return false;
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('dovi_splash_shown', 'true');
    } catch {
      // ignore storage errors
    }
    setShowSplash(false);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PromptEngineProvider>
          <CartProvider>
            {showSplash && (
              <DoviSplashScreen onComplete={handleSplashComplete} />
            )}
            <AppRouter />
            <SmartsuppChat />
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 3500,
                style: {
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)',
                  maxWidth: '380px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                },
                error: {
                  duration: 3500,
                },
              }}
            />
          </CartProvider>
        </PromptEngineProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

