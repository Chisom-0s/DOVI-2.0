import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/api/payments';
import { Skeleton } from '@/components/common/Skeleton';

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  provider: string;
  masked_details: string;
  expiry_date?: string;
  is_default: boolean;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentsApi.getSavedMethods();
      setMethods(data);
    } catch {
      toast.error('Failed to load saved payment methods.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Saved Payment Methods</h2>
      <p style={subtitleStyles}>
        Manage your credit cards, debit cards, or bank accounts connected for direct checkouts.
      </p>

      {isLoading && (
        <div style={gridStyles}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {!isLoading && methods.length === 0 && (
        <div style={emptyStyles}>
          <span style={{ fontSize: '2rem' }}>💳</span>
          <p style={emptyTextStyles}>No saved payment methods found.</p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Payment tokens are securely stored upon successful checkout authorization.
          </p>
        </div>
      )}

      {!isLoading && methods.length > 0 && (
        <div style={gridStyles}>
          {methods.map((method) => (
            <div
              key={method.id}
              style={{
                ...cardStyles,
                borderColor: method.is_default ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <div style={methodInfoStyles}>
                <span style={providerStyles}>{method.provider}</span>
                <strong style={detailsStyles}>{method.masked_details}</strong>
                {method.expiry_date && (
                  <span style={expiryStyles}>Expires: {method.expiry_date}</span>
                )}
              </div>
              <div style={badgeRowStyles}>
                <span style={typeTagStyles}>{method.type.replace(/_/g, ' ')}</span>
                {method.is_default && <span style={defaultBadgeStyles}>Default</span>}
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

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-2)',
};

const cardStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const methodInfoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const providerStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

const detailsStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
};

const expiryStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const badgeRowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 'var(--space-1)',
};

const typeTagStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  backgroundColor: 'var(--color-bg-subtle)',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-muted)',
};

const defaultBadgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary)',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-12) var(--space-4)',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  textAlign: 'center',
};

const emptyTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-bold)',
};
