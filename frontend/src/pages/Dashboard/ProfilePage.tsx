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
      {/* Personalized Greeting Card with Integrated WhatsApp Support */}
      <div style={welcomeBannerStyles} className="dashboard-welcome-banner">
        <div style={{ flex: '1 1 auto', minWidth: '220px' }}>
          <h2 style={welcomeTitleStyles}>Hello, {user?.first_name || 'Buyer'}!</h2>
          <p style={welcomeSubStyles}>Manage your profile details and personal account settings.</p>
        </div>
        <a
          href="https://wa.me/2347014109517?text=Hello%20Dovi%20Support%2C%20I%20need%20assistance%20with%20my%20account."
          target="_blank"
          rel="noopener noreferrer"
          className="dashboard-greeting-whatsapp-btn"
          aria-label="Chat with Dovi Support on WhatsApp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.811.922 3.145.922 3.18 0 5.767-2.587 5.767-5.766 0-3.181-2.587-5.764-5.763-5.764zM16.1 14.153c-.157.447-.905.867-1.285.932-.38.065-.898.114-2.868-.696-2.359-.968-3.874-3.376-3.99-3.532-.116-.156-.954-1.272-.954-2.428 0-1.156.602-1.725.815-1.947.213-.222.463-.278.618-.278.155 0 .31.002.449.009.146.007.342-.058.524.382.182.44.622 1.52.678 1.636.056.116.094.252.016.408-.078.156-.118.252-.234.389-.116.136-.245.292-.35.402-.116.116-.238.243-.105.474.133.23.593.979 1.277 1.594.88.793 1.611 1.042 1.838 1.157.227.116.36.097.494-.056.134-.153.58-675.722-.82.143-.146.338-.119.531-.016l3.35 1.593c.22.106.367.159.421.248.054.089.054.517-.103.964z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.761.455 3.424 1.267 4.908L2 22l5.228-1.185A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zM12 20.301c-1.42 0-2.812-.358-4.053-1.03l-.291-.157-3.003.681.693-2.905-.175-.29A8.324 8.324 0 013.699 12C3.699 7.424 7.424 3.699 12 3.699S20.301 7.424 20.301 12 16.576 20.301 12 20.301z" />
          </svg>
          <span>WhatsApp Support</span>
        </a>
      </div>

      <h2 style={titleStyles}>Personal Information</h2>

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

const welcomeBannerStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.05) 0%, rgba(255, 122, 0, 0.12) 100%)',
  border: '1px solid rgba(255, 122, 0, 0.1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-6)',
};

const welcomeTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
  margin: 0,
};

const welcomeSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
  lineHeight: 1.5,
};
