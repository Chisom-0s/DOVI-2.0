import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

// ============================================================
// ForgotPasswordPage
// POST /api/v1/auth/password/reset/
// ============================================================
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Check your email</h1>
            <p className="auth-card__subtitle">
              If an account with <strong>{email}</strong> exists, you&apos;ll receive
              a password reset link shortly.
            </p>
          </div>
          <p className="auth-card__footer">
            <Link to="/login" className="auth-card__link">Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Forgot your password?</h1>
          <p className="auth-card__subtitle">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <ApiErrorMessage error={error} />

          <div className="form-group">
            <label htmlFor="forgot-email" className="form-label">Email address</label>
            <input
              id="forgot-email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            id="forgot-password-submit"
            type="submit"
            className="auth-card__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login" className="auth-card__link">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
