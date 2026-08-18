import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.updateMe({
        first_name: firstName,
        last_name: lastName,
      });
      await refreshUser();
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);

      setIsUploading(true);
      try {
        await authApi.updateMe(formData);
        await refreshUser();
        toast.success('Avatar uploaded successfully!');
      } catch {
        toast.error('Failed to upload avatar image.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>My Profile</h2>

      <div style={cardStyles}>
        {/* Avatar Section */}
        <div style={avatarSectionStyles}>
          <div style={avatarWrapperStyles}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" style={avatarImgStyles} />
            ) : (
              <div style={avatarFallbackStyles}>
                {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <label htmlFor="avatar-upload" style={uploadBtnStyles}>
              {isUploading ? 'Uploading...' : 'Change Avatar'}
            </label>
            <p style={avatarHintStyles}>Allowed JPG or PNG. Max size of 2MB.</p>
          </div>
        </div>

        <hr style={dividerStyles} />

        {/* Profile Info Form */}
        <form onSubmit={handleProfileUpdate} style={formStyles}>
          <div style={formRowStyles}>
            <div style={inputGroupStyles}>
              <label style={labelStyles}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={inputStyles}
                required
              />
            </div>
            <div style={inputGroupStyles}>
              <label style={labelStyles}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={inputStyles}
                required
              />
            </div>
          </div>

          <div style={inputGroupStyles}>
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
            disabled={isSubmitting}
            style={{
              ...submitBtnStyles,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
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
  gap: 'var(--space-4)',
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
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const avatarSectionStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const avatarWrapperStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  overflow: 'hidden',
  border: '2px solid var(--color-border)',
  flexShrink: 0,
};

const avatarImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const avatarFallbackStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--text-3xl)',
  fontWeight: 'var(--font-bold)',
};

const uploadBtnStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 16px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  backgroundColor: 'var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const avatarHintStyles: React.CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 0,
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const formRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'var(--space-4)',
};

const inputGroupStyles: React.CSSProperties = {
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

const submitBtnStyles: React.CSSProperties = {
  width: 'fit-content',
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};
