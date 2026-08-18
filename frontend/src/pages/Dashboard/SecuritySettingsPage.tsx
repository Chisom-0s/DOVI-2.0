import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';

export default function SecuritySettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password. Please verify your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Security Settings</h2>
      <p style={subtitleStyles}>Update your password to keep your account secure.</p>

      <div style={cardStyles}>
        <form onSubmit={handleSubmit} style={formStyles}>
          <div style={fieldStyles}>
            <label style={labelStyles}>Current Password *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={fieldStyles}>
            <label style={labelStyles}>New Password *</label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={fieldStyles}>
            <label style={labelStyles}>Confirm New Password *</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyles}
              required
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
            {isSaving ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
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
  gap: 'var(--space-3)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
};

const cardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  marginTop: 'var(--space-2)',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  maxWidth: '400px',
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
