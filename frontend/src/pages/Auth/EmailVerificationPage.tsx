import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { APIError } from '@/types';

// ============================================================
// EmailVerificationPage
// POST /api/v1/auth/email/verify/
// Reads 'key' from URL query params (from email link)
// ============================================================
type VerificationState = 'loading' | 'success' | 'error';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') ?? '';

  const [state, setState] = useState<VerificationState>('loading');
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    if (!key) {
      setState('error');
      setError({
        error: true,
        message: 'Invalid verification link. The key is missing.',
        code: 'MISSING_KEY',
      });
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail({ key });
        setState('success');
      } catch (err) {
        setError(err as APIError);
        setState('error');
      }
    };

    verify();
  }, [key]);

  if (state === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ alignItems: 'center' }}>
          <LoadingSpinner size="lg" />
          <p className="auth-card__subtitle">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Email verified</h1>
            <p className="auth-card__subtitle">
              Your email has been verified. You can now sign in to your account.
            </p>
          </div>
          <Link to="/login" className="auth-card__submit" style={{ textAlign: 'center' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Verification failed</h1>
          <p className="auth-card__subtitle">
            {error?.message ?? 'Your verification link is invalid or has expired.'}
          </p>
        </div>
        <p className="auth-card__footer">
          <Link to="/register" className="auth-card__link">Create a new account</Link>
          {' or '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
