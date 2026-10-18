import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { refundsApi } from '@/api/refunds';
import { ordersApi } from '@/api/orders';
import type { OrderSummary } from '@/types';

// ----------------------------------------------------------
// RefundRequestPage — Submit refund request via API
// ----------------------------------------------------------
export default function RefundRequestPage() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('order') || '';
  const navigate = useNavigate();

  const [selectedOrderRef, setSelectedOrderRef] = useState(orderRef);
  const [customOrderRef, setCustomOrderRef] = useState(orderRef);
  const [isManualInput, setIsManualInput] = useState(!orderRef);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (orderRef) {
      setSelectedOrderRef(orderRef);
      setCustomOrderRef(orderRef);
      setIsManualInput(false);
    }
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const resp = await ordersApi.list();
        const list = resp?.results || [];
        setUserOrders(list);
        if (!orderRef && list.length > 0) {
          setSelectedOrderRef(list[0].order_reference);
          setCustomOrderRef(list[0].order_reference);
          setIsManualInput(false);
        } else if (!orderRef) {
          setIsManualInput(true);
        }
      } catch {
        setIsManualInput(true);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    loadOrders();
  }, [orderRef]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidence(Array.from<File>(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOrderRef = (isManualInput ? customOrderRef : selectedOrderRef).trim();
    if (!finalOrderRef) {
      toast.error('Please enter or select an order reference.');
      return;
    }
    if (!reason || !description) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Submit refund request
      const refund = await refundsApi.submit({
        order_reference: finalOrderRef,
        reason,
        description,
        amount: amount || '0',
      });

      // Upload evidence files if any
      if (evidence.length > 0) {
        for (const file of evidence) {
          const formData = new FormData();
          formData.append('file', file);
          await refundsApi.uploadEvidence(refund.id, formData);
        }
      }

      toast.success('Refund request submitted successfully.');
      navigate(`/dashboard/refunds/${refund.id}`);
    } catch {
      toast.error('Failed to submit refund request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refundReasons = [
    'Item not as described',
    'Item damaged on arrival',
    'Wrong item received',
    'Item not received',
    'Quality not satisfactory',
    'Changed my mind',
    'Other',
  ];

  const currentRef = isManualInput ? customOrderRef : selectedOrderRef;

  return (
    <div className="container" style={pageStyles}>
      <Link to={currentRef ? `/dashboard/orders/${currentRef}` : '/dashboard/orders'} style={backLinkStyles}>
        ← Back to Orders
      </Link>

      <h1 style={titleStyles}>Request Refund</h1>

      <form onSubmit={handleSubmit} style={formStyles}>
        {/* Order Reference Input / Selection */}
        <div style={fieldStyles}>
          <label style={labelStyles}>Order Reference *</label>
          {userOrders.length > 0 && !orderRef ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={isManualInput ? '__manual__' : selectedOrderRef}
                onChange={e => {
                  if (e.target.value === '__manual__') {
                    setIsManualInput(true);
                  } else {
                    setIsManualInput(false);
                    setSelectedOrderRef(e.target.value);
                  }
                }}
                style={selectStyles}
              >
                {userOrders.map(o => (
                  <option key={o.id || o.order_reference} value={o.order_reference}>
                    #{o.order_reference} ({o.status}) - {new Date(o.created_at).toLocaleDateString()}
                  </option>
                ))}
                <option value="__manual__">-- Enter a different order reference --</option>
              </select>
              {isManualInput && (
                <input
                  type="text"
                  placeholder="e.g. ORD-ABC12345"
                  value={customOrderRef}
                  onChange={e => setCustomOrderRef(e.target.value)}
                  style={inputStyles}
                  required
                />
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="e.g. ORD-ABC12345"
                value={isManualInput ? customOrderRef : (selectedOrderRef || customOrderRef)}
                onChange={e => {
                  setCustomOrderRef(e.target.value);
                  setSelectedOrderRef(e.target.value);
                }}
                style={inputStyles}
                required
              />
              <span style={hintStyles}>
                {orderRef ? `Pre-filled from order #${orderRef}` : 'Enter the Order Reference from your order receipt.'}
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        <div style={fieldStyles}>
          <label style={labelStyles}>Reason *</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={selectStyles}
            required
          >
            <option value="">Select a reason</option>
            {refundReasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div style={fieldStyles}>
          <label style={labelStyles}>Description *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={textareaStyles}
            placeholder="Describe the issue in detail..."
            rows={5}
            required
          />
        </div>

        {/* Amount */}
        <div style={fieldStyles}>
          <label style={labelStyles}>Refund Amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={inputStyles}
            placeholder="Leave blank for full refund"
            min="0"
            step="0.01"
          />
          <span style={hintStyles}>Leave blank to request a full refund.</span>
        </div>

        {/* Evidence Upload */}
        <div style={fieldStyles}>
          <label style={labelStyles}>Evidence (photos/screenshots)</label>
          <div style={uploadZoneStyles}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="evidence-upload"
            />
            <label htmlFor="evidence-upload" style={uploadLabelStyles}>
              📎 Click to upload files (max 5)
            </label>
            {evidence.length > 0 && (
              <div style={fileListStyles}>
                {evidence.map((f, i) => (
                  <span key={i} style={fileTagStyles}>{f.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...submitBtnStyles,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
        </button>
      </form>
    </div>
  );
}

// Styling
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  maxWidth: '600px',
  margin: '0 auto',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontWeight: 'var(--font-medium)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const orderRefStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
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

const selectStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  backgroundColor: '#ffffff',
};

const textareaStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  resize: 'vertical',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
};

const hintStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const uploadZoneStyles: React.CSSProperties = {
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const uploadLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontWeight: 'var(--font-medium)',
  textAlign: 'center',
};

const fileListStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
};

const fileTagStyles: React.CSSProperties = {
  fontSize: '10px',
  padding: '2px 8px',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--color-text-muted)',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};
