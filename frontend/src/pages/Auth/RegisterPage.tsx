import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { ApiErrorMessage, FieldError } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

// ============================================================
// RegisterPage
// POST /api/v1/auth/register/
// ============================================================
export default function RegisterPage() {
  const navigate = useNavigate();

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
          <img src="/logo.jpg?v=2" alt="Dovi Logo" style={{ height: '48px', objectFit: 'contain' }} />
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

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
