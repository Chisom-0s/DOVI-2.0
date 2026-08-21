import React, { useEffect, useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export default function CookieConsentBanner() {
  const { cookieState, acceptCookies, declineCookies } = useCookieConsent();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (cookieState === 'UNKNOWN') {
      // Small delay to make it feel polished
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [cookieState]);

  if (!isVisible) return null;

  return (
    <div style={bannerContainerStyles} className="dovi-cookie-backdrop">
      <div style={contentWrapperStyles}>
        <div style={textContainerStyles}>
          <span style={emojiStyles}>🍪</span>
          <p style={paragraphStyles}>
            We use cookies to personalize your shopping experience, analyze site traffic, and deliver tailored deals. 
            By accepting, you agree to our privacy policy.
          </p>
        </div>
        <div style={actionWrapperStyles}>
          <button 
            type="button" 
            onClick={declineCookies} 
            style={declineBtnStyles}
            className="cookie-btn-decline"
          >
            Decline
          </button>
          <button 
            type="button" 
            onClick={acceptCookies} 
            style={acceptBtnStyles}
            className="cookie-btn-accept"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const bannerContainerStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: '80px', // Raised to sit cleanly above the mobile nav bar (64px)
  left: '16px',
  right: '16px',
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.04)',
  padding: 'var(--space-4)',
  zIndex: 350, // Floating above navigation but below full overlay modals
  animation: 'slideUp 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
  maxWidth: '480px',
  margin: '0 auto', // Center on tablet/desktop if it fits
};

// Responsive styles on desktop handled via media queries or layout properties:
// Since we are writing inline React styles, we can let margin: '0 auto' handle horizontal centering.
// For standard desktops, it will be centered at the bottom of the screen.

const contentWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const textContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
};

const emojiStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  lineHeight: '1.2',
};

const paragraphStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
  lineHeight: '1.45',
  margin: 0,
  fontWeight: 'var(--font-normal)',
};

const actionWrapperStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  justifyContent: 'flex-end',
};

const declineBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  flex: 1,
  textAlign: 'center',
};

const acceptBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-full)',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  flex: 1,
  textAlign: 'center',
  boxShadow: '0 2px 4px rgba(255, 122, 0, 0.2)',
};
