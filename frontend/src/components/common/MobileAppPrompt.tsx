import React, { useEffect, useState } from 'react';
import { usePromptEngine } from '@/contexts/PromptEngineContext';

export default function MobileAppPrompt() {
  const { activePrompt, acceptPrompt, dismissPrompt, registerEligibility } = usePromptEngine();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const isVisible = activePrompt === 'mobileApp';

  // For demonstration, mobile app prompt is always eligible
  // In a real scenario, you'd check if the user is on a mobile device and not already in the app
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    registerEligibility('mobileApp', isMobile);
  }, [registerEligibility]);

  // Synchronize animations
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const handleInstall = () => {
    // Mock navigating to app store
    console.log("Navigating to App Store / Google Play...");
    acceptPrompt('mobileApp');
    // window.location.href = 'https://play.google.com/store/apps/details?id=com.malcnexus.dovi';
  };

  return (
    <>
      <div 
        style={{ ...backdropStyles, opacity: isAnimating ? 1 : 0 }}
        onClick={() => dismissPrompt('mobileApp')}
        className="dovi-mobileapp-backdrop"
      />
      <div 
        style={{
          ...drawerStyles,
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          opacity: isAnimating ? 1 : 0,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div style={dragHandleStyles} />
        
        <div style={headerStyles}>
          <img src="/logo.jpg?v=2" alt="Dovi App" style={appIconStyles} />
          <div style={headerTextStyles}>
            <h2 style={titleStyles}>DOVI - Save & Shop</h2>
            <p style={subtitleStyles}>Malc Nexus Technologies LTD</p>
            <div style={ratingStyles}>
              <span>★★★★★</span>
              <span style={ratingCountStyles}>(4.9)</span>
            </div>
          </div>
        </div>

        <p style={descriptionStyles}>
          Get the ultimate DOVI experience with our native mobile app. Faster browsing, instant notifications, and better security.
        </p>

        <div style={actionWrapperStyles}>
          <button 
            type="button" 
            onClick={handleInstall} 
            style={primaryBtnStyles}
          >
            Download the App
          </button>
          <button 
            type="button" 
            onClick={() => dismissPrompt('mobileApp')} 
            style={secondaryBtnStyles}
          >
            Continue in Browser
          </button>
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------
// Styling Tokens & Responsive Sheet Design
// ----------------------------------------------------------
const backdropStyles: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  zIndex: 400,
  transition: 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)',
};

const drawerStyles: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  backgroundColor: '#ffffff',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  padding: '24px 20px calc(24px + window.safeAreaInsetsBottom || 16px) 20px',
  zIndex: 401,
  boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.15)',
  display: 'flex', flexDirection: 'column',
  transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease',
  maxWidth: '400px',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const dragHandleStyles: React.CSSProperties = {
  width: '40px', height: '4px', borderRadius: '2px',
  backgroundColor: '#e5e7eb', margin: '0 auto 16px auto', flexShrink: 0,
};

const headerStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px',
};

const appIconStyles: React.CSSProperties = {
  width: '64px', height: '64px', borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', objectFit: 'contain',
  border: '1px solid var(--color-border)',
};

const headerTextStyles: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
};

const titleStyles: React.CSSProperties = {
  fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text)',
  margin: '0 0 4px 0', lineHeight: 1.2,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 4px 0',
  textTransform: 'uppercase', letterSpacing: '0.5px',
};

const ratingStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '4px',
  color: '#f59e0b', fontSize: '14px',
};

const ratingCountStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)', fontSize: '11px',
};

const descriptionStyles: React.CSSProperties = {
  fontSize: '13px', color: 'var(--color-text)',
  lineHeight: 1.5, margin: '0 0 24px 0',
};

const actionWrapperStyles: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '14px 24px', borderRadius: '999px', border: 'none',
  backgroundColor: '#000000', color: '#ffffff', // App store vibes
  fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  transition: 'background-color 0.2s', textAlign: 'center',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '12px 24px', borderRadius: '999px', border: 'none',
  backgroundColor: 'transparent', color: 'var(--color-primary)',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  transition: 'all 0.2s', textAlign: 'center',
};
