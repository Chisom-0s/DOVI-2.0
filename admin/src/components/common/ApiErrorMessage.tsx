import React, { useState } from 'react';
import type { APIError } from '@/types';

// ============================================================
// ApiErrorMessage (Admin)
// Professional, reassuring error handling for the Admin Dashboard.
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

  const normalizedError: APIError =
    typeof error === 'string'
      ? { error: true, message: error, code: 'UNKNOWN_ERROR' }
      : error;

  const rawMessage = (normalizedError.message || '').trim();
  const rawCode = (normalizedError.code || '').toUpperCase();

  const isNetwork =
    rawCode === 'NETWORK_ERROR' ||
    rawCode === 'OFFLINE' ||
    rawMessage.toLowerCase().includes('internet signal') ||
    rawMessage.toLowerCase().includes('check your connection') ||
    rawMessage.toLowerCase().includes('network error') ||
    (typeof navigator !== 'undefined' && !navigator.onLine);

  let displayTitle = title;
  let displayMessage = rawMessage;

  if (isNetwork) {
    displayTitle = displayTitle || 'Connection Problem';
    displayMessage = 'Please check your internet connection or try again in a moment.';
  } else if (!rawMessage || rawMessage.toLowerCase().includes('waking up') || rawMessage.toLowerCase().includes('failed to fetch')) {
    displayTitle = displayTitle || 'Unable to Load Data';
    displayMessage = "We're having trouble connecting to the server. Please check your internet connection or try again in a moment.";
  }

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
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  if (inline) {
    return (
      <div
        className={`api-error ${className}`}
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          color: '#b91c1c',
          fontSize: '13px',
          margin: '8px 0',
          ...style,
        }}
      >
        <span style={{ fontWeight: 500 }}>{displayMessage}</span>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              padding: 0,
            }}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`api-error-card ${className}`}
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        margin: '16px auto',
        maxWidth: '520px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fff7ed',
          border: '1px solid #ffedd5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff7a00',
          marginBottom: '14px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
        {displayTitle || "We're having trouble loading this page"}
      </h3>

      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.5 }}>
        {displayMessage}
      </p>

      {normalizedError.details && Object.keys(normalizedError.details).length > 0 && (
        <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', textAlign: 'left', fontSize: '12px', color: '#b91c1c' }}>
          {Object.entries(normalizedError.details).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`}>
                <strong>{field}:</strong> {msg}
              </li>
            ))
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={handleRetry}
        disabled={isRetrying}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 20px',
          backgroundColor: '#ff7a00',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          borderRadius: '8px',
          border: 'none',
          cursor: isRetrying ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(255, 122, 0, 0.2)',
          opacity: isRetrying ? 0.75 : 1,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: isRetrying ? 'dovi-spin 1s linear infinite' : 'none' }}
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>

      <style>{`
        @keyframes dovi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export interface FieldErrorProps {
  errors?: string[];
  fieldName: string;
}

export function FieldError({ errors, fieldName }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div role="alert" id={`${fieldName}-error`} style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
      {errors.map((msg, i) => (
        <span key={i} style={{ display: 'block' }}>
          {msg}
        </span>
      ))}
    </div>
  );
}
