import type { APIError } from '@/types';

interface ApiErrorMessageProps {
  error: APIError | null;
  className?: string;
  style?: React.CSSProperties;
}

export function ApiErrorMessage({ error, className, style }: ApiErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      className={`api-error ${className ?? ''}`}
      role="alert"
      aria-live="assertive"
      style={{
        padding: '12px 16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fee2e2',
        borderRadius: '8px',
        color: '#b91c1c',
        fontSize: '13px',
        lineHeight: 1.5,
        ...style,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{error.message}</p>
      {error.details && Object.keys(error.details).length > 0 && (
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          {Object.entries(error.details).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`}>
                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{field}:</span> {msg}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

interface FieldErrorProps {
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
