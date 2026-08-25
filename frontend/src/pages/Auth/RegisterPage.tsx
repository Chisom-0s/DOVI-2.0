import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { ApiErrorMessage, FieldError } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

// ============================================================
// RegisterPage
// POST /api/v1/auth/register/
// ============================================================
export default function RegisterPage() {
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    toast.error('Google registration is not configured on the backend yet.');
  };

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side password match check before hitting the API
    if (form.password !== form.confirm_password) {
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
      await authApi.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
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
              We&apos;ve sent a verification link to <strong>{form.email}</strong>.
              Please verify your email to continue.
            </p>
          </div>
          <div className="auth-card__footer">
            Already verified?{' '}
            <button className="auth-card__link" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img src="/logo.jpg?v=2" alt="Dovi Logo" style={{ height: '160px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="auth-card__header">
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Join Dovi and start shopping.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <ApiErrorMessage error={error} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="reg-first-name" className="form-label">First name</label>
              <input
                id="reg-first-name"
                name="first_name"
                type="text"
                className={`form-input ${error?.details?.first_name ? 'form-input--error' : ''}`}
                value={form.first_name}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
              <FieldError errors={error?.details?.first_name} fieldName="reg-first-name" />
            </div>

            <div className="form-group">
              <label htmlFor="reg-last-name" className="form-label">Last name</label>
              <input
                id="reg-last-name"
                name="last_name"
                type="text"
                className={`form-input ${error?.details?.last_name ? 'form-input--error' : ''}`}
                value={form.last_name}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
              <FieldError errors={error?.details?.last_name} fieldName="reg-last-name" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className={`form-input ${error?.details?.email ? 'form-input--error' : ''}`}
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <FieldError errors={error?.details?.email} fieldName="reg-email" />
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone" className="form-label">
              Phone number <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(optional)</span>
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              className={`form-input ${error?.details?.phone ? 'form-input--error' : ''}`}
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <FieldError errors={error?.details?.phone} fieldName="reg-phone" />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className={`form-input ${error?.details?.password ? 'form-input--error' : ''}`}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <FieldError errors={error?.details?.password} fieldName="reg-password" />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password" className="form-label">Confirm password</label>
            <input
              id="reg-confirm-password"
              name="confirm_password"
              type="password"
              className={`form-input ${error?.details?.confirm_password ? 'form-input--error' : ''}`}
              value={form.confirm_password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <FieldError errors={error?.details?.confirm_password} fieldName="reg-confirm-password" />
          </div>

          <button
            id="register-submit"
            type="submit"
            className="auth-card__submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-card__divider">
          <span>or</span>
        </div>

        <button
          id="google-signup"
          type="button"
          className="auth-card__google-btn"
          onClick={handleGoogleSignUp}
        >
          <svg className="auth-card__google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
