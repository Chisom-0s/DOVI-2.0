import { useEffect, useState } from 'react';

/**
 * ServerStatusIndicator
 * Displays a subtle, beautiful glassmorphism indicator when an API request
 * is waiting on a Render cold start (>2.8s response time).
 */
export function ServerStatusIndicator() {
  const [status, setStatus] = useState<'idle' | 'waking' | 'ready'>('idle');

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleColdStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ isWakingUp: boolean }>;
      if (customEvent.detail.isWakingUp) {
        if (hideTimer) clearTimeout(hideTimer);
        setStatus('waking');
      } else {
        setStatus('ready');
        hideTimer = setTimeout(() => {
          setStatus('idle');
        }, 2200);
      }
    };

    window.addEventListener('api:cold_start', handleColdStart);
    return () => {
      window.removeEventListener('api:cold_start', handleColdStart);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          borderRadius: '9999px',
          background: status === 'waking' 
            ? 'rgba(15, 23, 42, 0.92)' 
            : 'rgba(6, 78, 59, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: status === 'waking' 
            ? '1px solid rgba(255, 122, 0, 0.35)' 
            : '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(255, 122, 0, 0.15)',
          color: '#ffffff',
          fontSize: '0.85rem',
          fontWeight: 500,
          letterSpacing: '0.01em',
          transition: 'all 0.3s ease',
        }}
      >
        {status === 'waking' ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ff7a00',
                boxShadow: '0 0 10px #ff7a00',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
            <span style={{ color: '#fed7aa', fontWeight: 600 }}>Connecting to server...</span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(waking up free instance)</span>
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ color: '#a7f3d0', fontWeight: 600 }}>Server connected & ready!</span>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 15px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
          }
        }
      `}</style>
    </div>
  );
};

export default ServerStatusIndicator;
