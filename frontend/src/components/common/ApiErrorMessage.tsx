import React, { useState } from 'react';
import type { APIError } from '@/types';
import { NoInternetBanner } from './NoInternetBanner';

// ============================================================
// ApiErrorMessage
// Customer-friendly, professional error handling component.
// Replaces technical server/infrastructure errors with reassuring,
// actionable messages and an interactive retry button.
// ============================================================

export interface ApiErrorMessageProps {
  error: APIError | string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  onRetry?: () => void | Promise<any>;
  title?: string;
  inline?: boolean;
}

export function ApiErrorMessage({
  error,
  className = '',
  style,
  onRetry,
  title,
  inline = false,
}: ApiErrorMessageProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!error) return null;

  // Normalize error into an object
  const normalizedError: APIError =
    typeof error === 'string'
      ? { error: true, message: error, code: 'UNKNOWN_ERROR' }
      : error;

  const rawMessage = (normalizedError.message || '').trim();
  const rawCode = (normalizedError.code || '').toUpperCase();

  // Detect error category
  const isNetwork =
    rawCode === 'NETWORK_ERROR' ||
    rawCode === 'OFFLINE' ||
    rawMessage.toLowerCase().includes('internet signal') ||
    rawMessage.toLowerCase().includes('check your connection') ||
    rawMessage.toLowerCase().includes('network error') ||
    (typeof navigator !== 'undefined' && !navigator.onLine);

  const isServer =
    rawCode === 'SERVER_UNAVAILABLE' ||
    rawCode === 'SERVER_ERROR' ||
    rawCode === 'TIMEOUT' ||
    rawMessage.toLowerCase().includes('waking up') ||
    rawMessage.toLowerCase().includes('server error') ||
    rawMessage.toLowerCase().includes('could not connect') ||
    rawMessage.toLowerCase().includes('failed to fetch');

  // Customer-friendly display message
  let displayTitle = title;
  let displayMessage = rawMessage;

  if (isNetwork) {
    displayTitle = displayTitle || 'No Internet Signal';
    displayMessage = 'Please check your connection and try again.';
  } else if (isServer) {
    displayTitle = displayTitle || 'Unable to Load';
    displayMessage =
      "We're having trouble loading this page right now. Please check your internet connection or try again in a moment.";
  } else if (!rawMessage || rawMessage === 'Network Error' || rawMessage === 'AxiosError') {
    displayTitle = displayTitle || 'Unable to Load';
    displayMessage =
      "We're having trouble loading this page right now. Please check your internet connection or try again in a moment.";
  }

  // Handle retry click with visual loading feedback
  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      if (onRetry) {
        await Promise.resolve(onRetry());
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      // Caller handles re-triggering error state
    } finally {
      // Keep loading indicator visible briefly for smooth visual feedback
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  // If network offline and not inline, use full NoInternetBanner
  if (isNetwork && !inline) {
    return <NoInternetBanner onRetry={handleRetry} className={className} style={style} />;
  }

  // Inline mode: banner for compact forms or table headers
  if (inline) {
    return (
      <div
        className={`dovi-error-inline ${className}`}
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '8px',
          color: '#c53030',
          fontSize: '13px',
          margin: '8px 0',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{displayMessage}</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            background: 'none',
            border: 'none',
            color: '#c53030',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            padding: 0,
            fontSize: '12px',
            opacity: isRetrying ? 0.6 : 1,
          }}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  // Full Card Mode: professional, comforting error card
  return (
    <div
      className={`dovi-error-card ${className}`}
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '36px 24px',
        margin: '20px auto',
        maxWidth: '520px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fff7ed',
          border: '2px solid #ffedd5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff7a00',
          marginBottom: '16px',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 8px 0',
        }}
      >
        {displayTitle || "We're having trouble loading this page"}
      </h3>

      {/* Message */}
      <p
        style={{
          fontSize: '0.9rem',
          color: '#64748b',
          margin: '0 0 20px 0',
          lineHeight: 1.55,
          maxWidth: '420px',
        }}
      >
        {displayMessage}
      </p>

      {/* Field-level validation details */}
      {normalizedError.details && Object.keys(normalizedError.details).length > 0 && (
        <ul
          style={{
            margin: '0 0 20px 0',
            padding: '12px 18px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '12px',
            color: '#475569',
            listStyleType: 'disc',
            maxWidth: '100%',
          }}
        >
          {Object.entries(normalizedError.details).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`} style={{ marginBottom: '4px' }}>
                <strong style={{ textTransform: 'capitalize' }}>{field}:</strong> {msg}
              </li>
            ))
          )}
        </ul>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ff7a00',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '10px',
            border: 'none',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
            opacity: isRetrying ? 0.75 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {/* Animated Spinner Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: isRetrying ? 'dovi-spin 1s linear infinite' : 'none',
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>

      {/* Inline Keyframe for Spinner */}
      <style>{`
        @keyframes dovi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// FieldError — inline error beneath a form field
// ============================================================
export interface FieldErrorProps {
  errors?: string[];
  fieldName: string;
}

export function FieldError({ errors, fieldName }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="field-error" role="alert" id={`${fieldName}-error`} style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
      {errors.map((msg, i) => (
        <span key={i} className="field-error__msg" style={{ display: 'block' }}>
          {msg}
        </span>
      ))}
    </div>
  );
}
