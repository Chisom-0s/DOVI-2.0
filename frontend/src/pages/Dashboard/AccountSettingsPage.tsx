import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';

export default function AccountSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authApi.updateMe({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      });
      await refreshUser();
      toast.success('Account settings updated.');
    } catch {
      toast.error('Failed to update account settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('WARNING: Are you sure you want to deactivate your account? This action cannot be undone.')) return;
    setIsDeactivating(true);
    try {
      await authApi.deleteMe();
      toast.success('Account deactivated successfully.');
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to deactivate account.');
      setIsDeactivating(false);
    }
  };

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Account Settings</h2>

      <div style={cardStyles}>
        <form onSubmit={handleUpdate} style={formStyles}>
          <div style={fieldStyles}>
            <label style={labelStyles}>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={fieldStyles}>
            <label style={labelStyles}>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={fieldStyles}>
            <label style={labelStyles}>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. +234..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={inputStyles}
            />
          </div>

          <div style={fieldStyles}>
            <label style={labelStyles}>Email Address (Read-only)</label>
            <input
              type="email"
              value={user?.email ?? ''}
              style={readOnlyInputStyles}
              readOnly
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              ...primaryBtnStyles,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Deactivate Option */}
      <div style={dangerCardStyles}>
        <h3 style={dangerTitleStyles}>Deactivate Account</h3>
        <p style={dangerDescStyles}>
          Deactivating your account will disable your profile and remove your access. This action is permanent.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={isDeactivating}
          style={deactivateBtnStyles}
        >
          {isDeactivating ? 'Deactivating...' : 'Deactivate My Account'}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const cardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  maxWidth: '500px',
};

const fieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 'var(--text-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const readOnlyInputStyles: React.CSSProperties = {
  ...inputStyles,
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};

const primaryBtnStyles: React.CSSProperties = {
  width: 'fit-content',
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  marginTop: 'var(--space-2)',
};

const dangerCardStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'rgba(239, 68, 68, 0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  maxWidth: '500px',
};

const dangerTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-danger)',
  margin: 0,
};

const dangerDescStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
};

const deactivateBtnStyles: React.CSSProperties = {
  width: 'fit-content',
  padding: '10px 20px',
  backgroundColor: 'var(--color-danger)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  marginTop: 'var(--space-2)',
};
