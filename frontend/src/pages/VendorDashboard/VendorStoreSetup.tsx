import { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/client';

export default function VendorStoreSetup() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bizReg, setBizReg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Store Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/vendors/', {
        name,
        description,
        business_registration_number: bizReg,
      });
      toast.success('Store setup successfully submitted!');
      window.location.reload();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to setup store';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <div style={headerStyles}>
          <span style={pillStyles}>MERCHANT HUB</span>
          <h1 style={titleStyles}>Register Your Store</h1>
          <p style={subtitleStyles}>
            Configure your merchant profile details to start selling products on DOVI.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formStyles}>
          <div style={inputGroupStyles}>
            <label style={labelStyles}>STORE NAME *</label>
            <input
              type="text"
              placeholder="e.g., Galaxy Electronics Store"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={inputGroupStyles}>
            <label style={labelStyles}>STORE DESCRIPTION</label>
            <textarea
              rows={4}
              placeholder="Describe your products, warranty policies, and shipping terms..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyles, ...textareaStyles }}
            />
          </div>

          <div style={inputGroupStyles}>
            <label style={labelStyles}>BUSINESS REGISTRATION NUMBER (OPTIONAL)</label>
            <input
              type="text"
              placeholder="e.g., RC-12345678"
              value={bizReg}
              onChange={e => setBizReg(e.target.value)}
              style={inputStyles}
            />
          </div>

          <button type="submit" disabled={isSubmitting} style={btnStyles}>
            {isSubmitting ? 'Registering Store...' : 'Launch Merchant Store'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling (DOVI Standard Light Theme)
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  padding: '2rem 1rem',
  backgroundColor: 'var(--color-bg-subtle)',
};

const cardStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: '540px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  padding: '2.5rem 2rem',
};

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const pillStyles: React.CSSProperties = {
  background: 'rgba(255, 122, 0, 0.08)',
  color: 'var(--color-primary)',
  fontSize: '0.75rem',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  display: 'inline-block',
  marginBottom: '0.75rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  marginBottom: '0.5rem',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  lineHeight: '1.5',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const textareaStyles: React.CSSProperties = {
  resize: 'none',
};

const btnStyles: React.CSSProperties = {
  marginTop: '0.75rem',
  background: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '12px',
  fontWeight: '700',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};
