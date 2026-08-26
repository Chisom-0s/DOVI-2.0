import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import type { Address } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: false,
  });

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await authApi.getAddresses();
      setAddresses(data);
    } catch {
      toast.error('Failed to load saved addresses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEditClick = (addr: Address) => {
    setEditId(addr.id);
    setFormData({
      label: addr.label,
      full_name: addr.full_name,
      phone: addr.phone,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 ?? '',
      city: addr.city,
      state: addr.state,
      country: addr.country,
      postal_code: addr.postal_code ?? '',
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setFormData({
      label: '',
      full_name: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postal_code: '',
      is_default: false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await authApi.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted.');
    } catch {
      toast.error('Failed to delete address.');
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      await authApi.updateAddress(addr.id, { is_default: true });
      fetchAddresses();
      toast.success('Default address updated.');
    } catch {
      toast.error('Failed to set default address.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        label: formData.label,
        full_name: formData.full_name,
        phone: formData.phone,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2 || undefined,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code || undefined,
        is_default: formData.is_default,
      };

      if (editId) {
        await authApi.updateAddress(editId, payload);
        toast.success('Address updated.');
      } else {
        await authApi.addAddress(payload);
        toast.success('Address added.');
      }
      setShowForm(false);
      fetchAddresses();
    } catch {
      toast.error('Failed to save address.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerRowStyles}>
        <h2 style={titleStyles}>Saved Addresses</h2>
        {!showForm && (
          <button onClick={handleAddNewClick} style={addBtnStyles}>
            + Add New Address
          </button>
        )}
      </div>

      {isLoading && (
        <div style={gridStyles}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="120px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {/* Address Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={formCardStyles}>
          <h3 style={formTitleStyles}>{editId ? 'Edit Address' : 'New Address'}</h3>
          <div style={formGridStyles}>
            <div style={fieldStyles}>
              <label style={labelStyles}>Label (e.g. Home, Office) *</label>
              <input
                type="text"
                placeholder="e.g. Home"
                value={formData.label}
                onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Full Name *</label>
              <input
                type="text"
                placeholder="Recipient name"
                value={formData.full_name}
                onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Phone Number *</label>
              <input
                type="text"
                placeholder="Active number"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Address Line 1 *</label>
              <input
                type="text"
                placeholder="Street address"
                value={formData.address_line_1}
                onChange={e => setFormData(p => ({ ...p, address_line_1: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="Apartment, suite, unit etc."
                value={formData.address_line_2}
                onChange={e => setFormData(p => ({ ...p, address_line_2: e.target.value }))}
                style={inputStyles}
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>City *</label>
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>State *</label>
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Country *</label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                style={inputStyles}
                required
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Postal Code (Optional)</label>
              <input
                type="text"
                placeholder="Postal code"
                value={formData.postal_code}
                onChange={e => setFormData(p => ({ ...p, postal_code: e.target.value }))}
                style={inputStyles}
              />
            </div>
          </div>

          <label style={checkboxLabelStyles}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={e => setFormData(p => ({ ...p, is_default: e.target.checked }))}
            />
            Set as default delivery address
          </label>

          <div style={actionRowStyles}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...primaryBtnStyles,
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={secondaryBtnStyles}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {!isLoading && !showForm && addresses.length === 0 && (
        <div style={emptyStyles}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p style={emptyTextStyles}>You don't have any saved addresses.</p>
        </div>
      )}

      {!isLoading && !showForm && addresses.length > 0 && (
        <div style={gridStyles}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                ...addressCardStyles,
                borderColor: addr.is_default ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <div style={cardHeaderStyles}>
                <span style={labelTagStyles}>{addr.label}</span>
                {addr.is_default && <span style={defaultBadgeStyles}>Default</span>}
              </div>
              <p style={addrNameStyles}>{addr.full_name}</p>
              <p style={addrTextStyles}>
                {addr.address_line_1}
                {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}<br />
                {addr.city}, {addr.state}, {addr.country}
              </p>
              <p style={addrPhoneStyles}>📞 {addr.phone}</p>

              <div style={cardActionsStyles}>
                <button onClick={() => handleEditClick(addr)} style={editBtnStyles}>
                  Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} style={deleteBtnStyles}>
                  Delete
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr)} style={setDefaultBtnStyles}>
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const addBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'var(--space-4)',
};

const addressCardStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  position: 'relative',
};

const cardHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelTagStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  backgroundColor: 'var(--color-bg-subtle)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-muted)',
};

const defaultBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-sm)',
};

const addrNameStyles: React.CSSProperties = {
  margin: 'var(--space-2) 0 0 0',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const addrTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
};

const addrPhoneStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const cardActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-3)',
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-2)',
};

const editBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const deleteBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const setDefaultBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  marginLeft: 'auto',
};

const formCardStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const formTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 'var(--space-4)',
};

const fieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const checkboxLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  width: 'fit-content',
};

const actionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-2)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  cursor: 'pointer',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-12) 0',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const emptyTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};
