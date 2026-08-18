import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ApiErrorMessage, FieldError } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

// ============================================================
// LoginPage
// POST /api/v1/auth/login/
// ============================================================
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err as APIError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Sign in to Dovi</h1>
          <p className="auth-card__subtitle">Welcome back. Enter your details below.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          {/* General API error */}
          <ApiErrorMessage error={error} />

          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${error?.details?.email ? 'form-input--error' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={error?.details?.email ? 'login-email-error' : undefined}
            />
            <FieldError errors={error?.details?.email} fieldName="login-email" />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className={`form-input ${error?.details?.password ? 'form-input--error' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-describedby={error?.details?.password ? 'login-password-error' : undefined}
            />
            <FieldError errors={error?.details?.password} fieldName="login-password" />
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" className="auth-card__link" style={{ fontSize: 'var(--text-sm)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="auth-card__submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-card__link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
