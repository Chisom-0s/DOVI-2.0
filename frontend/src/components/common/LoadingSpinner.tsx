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
  const spinnerSizes = {
    sm: '24px',
    md: '40px',
    lg: '56px',
  };

  const spinnerSize = spinnerSizes[size] || '40px';

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
      {/* Sleek Circular Ring Spinner */}
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(255, 122, 0, 0.15)',
          borderTop: '3px solid var(--color-primary, #ff7a00)',
          borderRadius: '50%',
          animation: 'doviSpin 0.8s linear infinite',
        }}
      />

      {/* Subtle Dot Pulse Animation */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ff7a00',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0s',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ff7a00',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0.2s',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ff7a00',
            animation: 'doviPulse 1.2s infinite ease-in-out',
            animationDelay: '0.4s',
          }}
        />
      </div>

      {label && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{label}</span>}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes doviSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
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
