import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { ApiErrorMessage, FieldError } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

// ============================================================
// ResetPasswordPage
// POST /api/v1/auth/password/reset/confirm/
// Reads uid and token from URL query params
// ============================================================
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [success, setSuccess] = useState(false);

  // Invalid link — missing uid or token
  if (!uid || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Invalid reset link</h1>
            <p className="auth-card__subtitle">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <p className="auth-card__footer">
            <Link to="/forgot-password" className="auth-card__link">Request a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError({
        error: true,
        message: 'Passwords do not match.',
        code: 'PASSWORD_MISMATCH',
        details: { confirm_password: ['Passwords do not match.'] },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
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
            <h1 className="auth-card__title">Password updated</h1>
            <p className="auth-card__subtitle">
              Your password has been reset. Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Set new password</h1>
          <p className="auth-card__subtitle">Choose a strong password for your account.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <ApiErrorMessage error={error} />

          <div className="form-group">
            <label htmlFor="reset-new-password" className="form-label">New password</label>
            <input
              id="reset-new-password"
              type="password"
              className={`form-input ${error?.details?.new_password ? 'form-input--error' : ''}`}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <FieldError errors={error?.details?.new_password} fieldName="reset-new-password" />
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm-password" className="form-label">Confirm new password</label>
            <input
              id="reset-confirm-password"
              type="password"
              className={`form-input ${error?.details?.confirm_password ? 'form-input--error' : ''}`}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <FieldError errors={error?.details?.confirm_password} fieldName="reset-confirm-password" />
          </div>

          <button
            id="reset-password-submit"
            type="submit"
            className="auth-card__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
