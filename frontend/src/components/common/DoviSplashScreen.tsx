import { useState, useEffect } from 'react';

interface DoviSplashScreenProps {
  onComplete: () => void;
}

export default function DoviSplashScreen({ onComplete }: DoviSplashScreenProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Logo animations trigger shortly after mounting
    const animTimer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);

    // 2. Splash screen duration set to a minimum of 5000ms (5 seconds)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5000);

    // 3. Complete callback triggers after fade-out transition concludes (500ms transition)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Centered single-column layout keeping elements grouped and visible on all mobile viewports
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100vh',
    backgroundColor: 'var(--color-bg, #ffffff)',
    background: 'radial-gradient(circle, #ffffff 0%, #f9fafb 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Center group vertically
    zIndex: 999999, // Ensure it covers everything
    overflow: 'hidden',
    transition: 'opacity 500ms ease-in-out',
    opacity: isFadingOut ? 0 : 1,
    padding: '24px',
    boxSizing: 'border-box',
  };

  const centerSectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '400px',
  };

  const logoStyles: React.CSSProperties = {
    height: '240px',
    width: 'auto',
    objectFit: 'contain',
    transition: 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1000ms ease-out',
    transform: isAnimated ? 'scale(1)' : 'scale(0.85)',
    opacity: isAnimated ? 1 : 0,
  };

  // Embed CSS keyframes dynamically in JSX for self-contained Sequential Dot Bounce
  const inlineStyles = `
    @keyframes doviDotBounce {
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
    .dovi-dot-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 36px;
      height: 20px;
    }
    .dovi-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--color-primary, #ff7a00);
      animation: doviDotBounce 1.4s infinite ease-in-out both;
    }
    .dovi-dot:nth-child(1) { animation-delay: -0.32s; }
    .dovi-dot:nth-child(2) { animation-delay: -0.16s; background-color: var(--color-success, #27ae60); }
    .dovi-dot:nth-child(3) { animation-delay: 0s; }
  `;

  return (
    <div style={containerStyles}>
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      <div style={centerSectionStyles}>
        {/* Middle Area: Dovi Logo */}
        <img
          src="/logo.jpg?v=2"
          alt="Dovi Logo"
          style={logoStyles}
        />

        {/* Lower Area: Circular Dot Pulsing Loader */}
        <div className="dovi-dot-loader">
          <div className="dovi-dot" />
          <div className="dovi-dot" />
          <div className="dovi-dot" />
        </div>
      </div>
    </div>
  );
}
