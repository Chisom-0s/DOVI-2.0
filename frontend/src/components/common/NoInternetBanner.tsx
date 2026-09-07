import React from 'react';

interface NoInternetBannerProps {
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function NoInternetBanner({ onRetry, className = '', style }: NoInternetBannerProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`no-internet-banner ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-8, 32px) var(--space-6, 24px)',
        margin: 'var(--space-4, 16px) 0',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-xl, 16px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        width: '100%',
        maxWidth: '520px',
        marginLeft: 'auto',
        marginRight: 'auto',
        transition: 'all 0.3s ease',
        ...style,
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Network / Offline Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4, 16px)',
          color: '#ef4444',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>

      {/* Main Heading */}
      <h3
        style={{
          fontSize: 'var(--text-xl, 1.25rem)',
          fontWeight: '700',
          color: 'var(--color-text, #0f172a)',
          margin: '0 0 var(--space-2, 8px) 0',
          letterSpacing: '-0.01em',
        }}
      >
        No Internet Signal
      </h3>

      {/* Write-up */}
      <p
        style={{
          fontSize: 'var(--text-sm, 0.875rem)',
          color: 'var(--color-text-muted, #64748b)',
          margin: '0 0 var(--space-6, 24px) 0',
          lineHeight: '1.5',
        }}
      >
        Check your connection
      </p>

      {/* Retry Button */}
      <button
        onClick={handleRetry}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 24px',
          backgroundColor: 'var(--color-primary, #2563eb)',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: 'var(--text-sm, 0.875rem)',
          borderRadius: 'var(--radius-md, 8px)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Retry
      </button>
    </div>
  );
}

export default NoInternetBanner;
