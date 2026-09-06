import type { APIError } from '@/types';
import { NoInternetBanner } from './NoInternetBanner';

// ============================================================
// ApiErrorMessage
// Displays general errors, field-level validation errors, and
// renders NoInternetBanner when network/connection errors occur.
// ============================================================
interface ApiErrorMessageProps {
  error: APIError | null;
  className?: string;
  onRetry?: () => void;
}

export function ApiErrorMessage({ error, className, onRetry }: ApiErrorMessageProps) {
  if (!error) return null;

  // Render No Internet Signal banner when a network error is detected
  if (
    error.code === 'NETWORK_ERROR' ||
    error.message.toLowerCase().includes('internet signal') ||
    error.message.toLowerCase().includes('check your connection') ||
    error.message.toLowerCase().includes('network error')
  ) {
    return <NoInternetBanner onRetry={onRetry} className={className} />;
  }

  return (
    <div className={`api-error ${className ?? ''}`} role="alert" aria-live="assertive">
      {/* General error message */}
      <p className="api-error__message">{error.message}</p>

      {/* Field-level validation errors */}
      {error.details && Object.keys(error.details).length > 0 && (
        <ul className="api-error__details">
          {Object.entries(error.details).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`} className="api-error__detail-item">
                <span className="api-error__field">{field}:</span> {msg}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// FieldError — inline error beneath a form field
// ============================================================
interface FieldErrorProps {
  errors?: string[];
  fieldName: string;
}

export function FieldError({ errors, fieldName }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="field-error" role="alert" id={`${fieldName}-error`}>
      {errors.map((msg, i) => (
        <span key={i} className="field-error__msg">
          {msg}
        </span>
      ))}
    </div>
  );
}
