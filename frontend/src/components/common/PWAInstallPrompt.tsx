import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { isIOS, showInstallPrompt, triggerInstall, dismissInstall } = usePWAInstall();
  const [showiOSInstructions, setShowiOSInstructions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Synchronize animations on mounting/unmounting
  useEffect(() => {
    if (showInstallPrompt) {
      setShouldRender(true);
      // Small tick to ensure display block is active before animating opacity/translate
      const frame = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setShowiOSInstructions(false);
      }, 350); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt]);

  if (!shouldRender) return null;

  const handlePrimaryAction = () => {
    if (isIOS) {
      setShowiOSInstructions(true);
    } else {
      triggerInstall();
    }
  };

  const benefits = [
    { emoji: '⚡', title: 'Faster', desc: 'performance' },
    { emoji: '📱', title: 'Home Screen', desc: 'access' },
    { emoji: '🖥️', title: 'Full-screen', desc: 'experience' },
    { emoji: '🔎', title: 'Better', desc: 'browsing' },
    { emoji: '🔔', title: 'Push', desc: 'notifications' },
    { emoji: '✨', title: 'Works like', desc: 'a native app' },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        style={{
          ...backdropStyles,
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={dismissInstall}
        className="dovi-pwa-backdrop"
      />

      {/* Bottom Sheet Drawer */}
      <div 
        style={{
          ...drawerStyles,
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          opacity: isAnimating ? 1 : 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-title"
      >
        {/* Gray Drag Handle */}
        <div style={dragHandleStyles} />

        {/* Brand Logo */}
        <div style={logoWrapperStyles}>
          <img 
            src="/logo.jpg?v=2" 
            alt="Dovi logo" 
            style={logoImageStyles} 
          />
        </div>

        {/* Typography */}
        <h2 id="pwa-title" style={titleStyles}>Install DOVI</h2>
        <h3 style={subtitleStyles}>Get the full app experience</h3>
        <p style={descriptionStyles}>
          Install DOVI for a faster, smoother, and app-like marketplace experience.
        </p>

        {/* Benefits Cards Grid */}
        <div style={gridStyles}>
          {benefits.map((b, idx) => (
            <div key={idx} style={cardStyles}>
              <span style={cardEmojiStyles}>{b.emoji}</span>
              <div style={cardTextWrapperStyles}>
                <span style={cardTitleStyles}>{b.title}</span>
                <span style={cardDescStyles}>{b.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Conditional iOS Steps */}
        {showiOSInstructions && isIOS && (
          <div style={iosStepsWrapperStyles}>
            <h4 style={iosTitleStyles}>iOS Safari Instructions</h4>
            <ol style={iosListStyles}>
              <li style={iosItemStyles}>
                Tap the **Share** button <span style={iosIconStyles}>📤</span> in Safari's bottom toolbar.
              </li>
              <li style={iosItemStyles}>
                Scroll down the menu list and select **Add to Home Screen** <span style={iosIconStyles}>➕</span>.
              </li>
              <li style={iosItemStyles}>
                Tap **Add** in the top-right corner to complete the installation.
              </li>
            </ol>
          </div>
        )}

        {/* Actions Button Group */}
        <div style={actionWrapperStyles}>
          {(!showiOSInstructions || !isIOS) ? (
            <button 
              type="button" 
              onClick={handlePrimaryAction} 
              style={primaryBtnStyles}
              className="pwa-btn-install"
            >
              {isIOS ? '📱 How to Install' : '📱 Install Now'}
            </button>
          ) : (
            <p style={iosHelperTextStyles}>
              Simply follow the steps above using your Safari browser controls!
            </p>
          )}
          <button 
            type="button" 
            onClick={dismissInstall} 
            style={secondaryBtnStyles}
            className="pwa-btn-later"
          >
            Maybe Later
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
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  zIndex: 400,
  transition: 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)',
};

const drawerStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  padding: '24px 20px calc(24px + window.safeAreaInsetsBottom || 16px) 20px',
  zIndex: 401,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease',
  maxWidth: '480px',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const dragHandleStyles: React.CSSProperties = {
  width: '40px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: '#e5e7eb',
  margin: '0 auto 16px auto',
  flexShrink: 0,
};

const logoWrapperStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 'var(--space-3)',
  flexShrink: 0,
};

const logoImageStyles: React.CSSProperties = {
  height: '42px',
  width: 'auto',
  objectFit: 'contain',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  textAlign: 'center',
  margin: '0 0 var(--space-1) 0',
  lineHeight: 1.2,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'center',
  margin: '0 0 var(--space-3) 0',
};

const descriptionStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  lineHeight: 1.5,
  margin: '0 0 var(--space-5) 0',
  padding: '0 var(--space-2)',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '10px',
  marginBottom: 'var(--space-6)',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '12px var(--space-2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  textAlign: 'center',
  boxSizing: 'border-box',
  transition: 'transform var(--transition-fast)',
};

const cardEmojiStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  lineHeight: 1,
};

const cardTextWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const cardDescStyles: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--color-text-muted)',
};

const actionWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  marginTop: 'auto',
  flexShrink: 0,
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '14px 24px',
  borderRadius: 'var(--radius-full)',
  border: 'none',
  backgroundColor: 'var(--color-success)', // Brand Green
  color: '#ffffff',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  textAlign: 'center',
  boxShadow: '0 4px 10px rgba(39, 174, 96, 0.2)',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#f3f4f6',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  textAlign: 'center',
};

// iOS visual steps panel
const iosStepsWrapperStyles: React.CSSProperties = {
  backgroundColor: 'rgba(255, 122, 0, 0.03)',
  border: '1px dashed var(--color-primary)',
  borderRadius: 'var(--radius-lg)',
  padding: '14px',
  marginBottom: 'var(--space-5)',
  animation: 'fadeIn 300ms ease-out forwards',
};

const iosTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
  marginBottom: 'var(--space-2)',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const iosListStyles: React.CSSProperties = {
  paddingLeft: '18px',
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const iosItemStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
  lineHeight: '1.4',
};

const iosIconStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  width: '20px',
  height: '20px',
  fontSize: '11px',
  verticalAlign: 'middle',
  marginLeft: '2px',
};

const iosHelperTextStyles: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  margin: 'var(--space-1) 0',
  fontStyle: 'italic',
};
