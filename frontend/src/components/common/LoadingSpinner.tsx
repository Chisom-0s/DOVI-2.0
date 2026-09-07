import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  label?: string;
  style?: React.CSSProperties;
}

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  label = 'Loading...',
  style,
}: LoadingSpinnerProps) {
  const logoHeights = {
    sm: '40px',
    md: '64px',
    lg: '96px',
  };

  const cartIconSizes = {
    sm: '16px',
    md: '22px',
    lg: '30px',
  };

  const logoHeight = logoHeights[size] || '64px';
  const cartSize = cartIconSizes[size] || '22px';

  const loaderContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: fullScreen ? '32px' : '16px',
        ...style,
      }}
      role="status"
      aria-label={label}
    >
      {/* Container with Logo & Cart Icon overlay */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Grayed-out Dovi Logo */}
        <img
          src="/logo.jpg?v=2"
          alt="Dovi Logo Loading"
          style={{
            height: logoHeight,
            width: 'auto',
            objectFit: 'contain',
            filter: 'grayscale(100%) opacity(0.45)',
            transition: 'opacity 0.3s ease',
          }}
          onError={e => {
            // Fallback text if logo fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Shopping Cart Icon Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-8px',
            backgroundColor: 'rgba(30, 41, 59, 0.75)',
            color: '#f8fafc',
            borderRadius: '50%',
            padding: size === 'sm' ? '4px' : '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg
            width={cartSize}
            height={cartSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
      </div>

      {/* Subtle Dot Pulse Animation */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#94a3b8',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0s',
          }}
        />
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#94a3b8',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0.2s',
          }}
        />
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#94a3b8',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0.4s',
          }}
        />
      </div>

      {label && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{label}</span>}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes doviPulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40% { transform: scale(1.1); opacity: 0.9; }
          }
        `,
        }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
