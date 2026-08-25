import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type { APIError } from '@/types';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password });
      toast.success('Welcome back, Admin!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err);
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <div style={headerStyles}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img src="/logo.jpg" alt="Dovi Logo" style={{ height: '160px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={titleStyles}>DOVI Admin</h1>
          <p style={subtitleStyles}>Administrative Control Panel</p>
        </div>

        {error && (
          <div style={{ marginBottom: '16px' }}>
            <ApiErrorMessage error={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyles}>
          <div style={inputGroupStyles}>
            <label style={labelStyles}>Admin Email</label>
            <input
              type="email"
              required
              placeholder="admin@dovi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyles}
            />
          </div>

          <div style={inputGroupStyles}>
            <label style={labelStyles}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyles}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...submitBtnStyles,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6',
  padding: '16px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '40px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
};
const titleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 150ms ease',
};

const submitBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '9999px',
  fontWeight: 700,
  fontSize: '14px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  border: 'none',
  marginTop: '8px',
};
