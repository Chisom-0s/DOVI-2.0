import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/client';

interface OrderItem {
  id: string;
  product_name?: string;
  variant_name?: string;
  variant_sku?: string;
  quantity: number;
  unit_price?: number | string;
  price?: number | string;
}

interface Order {
  id: string;
  reference_code: string;
  buyer_email: string;
  buyer_name?: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function VendorOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/orders/');
      setOrders(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTransition = async (orderId: string, nextStatus: string) => {
    try {
      await apiClient.post(`/api/v1/orders/${orderId}/transition/`, {
        status: nextStatus,
      });
      toast.success(`Order successfully transitioned to ${nextStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      const details = err?.response?.data?.error || 'Failed to update order status';
      toast.error(details);
    }
  };

  return (
    <div style={wrapperStyles}>
      <div>
        <h2 style={titleStyles}>Order Settlements</h2>
        <p style={subtitleStyles}>Monitor purchase orders, dispatch shipments, and track incoming escrow balances.</p>
      </div>

      <div style={tableWrapperStyles}>
        {isLoading ? (
          <div style={loadingStyles}>Syncing ledger transactions...</div>
        ) : orders.length === 0 ? (
          <div style={emptyStyles}>No active orders found.</div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr style={tableHeaderRowStyles}>
                <th style={thStyles}>ORDER REF</th>
                <th style={thStyles}>CUSTOMER</th>
                <th style={thStyles}>AMOUNT</th>
                <th style={thStyles}>STATUS</th>
                <th style={thStyles}>PLACED DATE</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={tableRowStyles}>
                  <td style={tdRefStyles}>{o.reference_code}</td>
                  <td style={tdBuyerStyles}>
                    {o.buyer_name || 'Customer'}
                    <span style={buyerEmailStyles}>{o.buyer_email}</span>
                  </td>
                  <td style={tdAmountStyles}>₦{parseFloat(o.total_amount.toString()).toLocaleString()}</td>
                  <td style={tdStyles}>
                    <span
                      style={{
                        ...statusBadgeStyles,
                        color:
                          o.status === 'COMPLETED' || o.status === 'RECEIVED'
                            ? 'var(--color-success)'
                            : o.status === 'PAID' || o.status === 'PROCESSING'
                            ? 'var(--color-primary)'
                            : o.status === 'SHIPPED'
                            ? '#3b82f6'
                            : 'var(--color-danger)',
                        backgroundColor:
                          o.status === 'COMPLETED' || o.status === 'RECEIVED'
                            ? 'rgba(39, 174, 96, 0.08)'
                            : o.status === 'PAID' || o.status === 'PROCESSING'
                            ? 'rgba(255, 122, 0, 0.08)'
                            : o.status === 'SHIPPED'
                            ? 'rgba(59, 130, 246, 0.08)'
                            : 'rgba(239, 68, 68, 0.08)',
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={tdStyles}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={tdActionsStyles}>
                    <button onClick={() => setSelectedOrder(o)} style={actionBtnViewStyles}>
                      Details
                    </button>
                    {o.status === 'PAID' && (
                      <button onClick={() => handleTransition(o.id, 'PROCESSING')} style={actionBtnProcessStyles}>
                        Process
                      </button>
                    )}
                    {o.status === 'PROCESSING' && (
                      <button onClick={() => handleTransition(o.id, 'SHIPPED')} style={actionBtnShipStyles}>
                        Ship
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div style={modalBackdropStyles}>
          <div style={modalCardStyles}>
            <div style={modalHeaderStyles}>
              <h3 style={{ ...titleStyles, margin: 0 }}>Order Specification</h3>
              <button onClick={() => setSelectedOrder(null)} style={closeBtnStyles}>
                ✕
              </button>
            </div>

            <div style={modalContentStyles}>
              <div style={detailsGridStyles}>
                <div style={detailFieldStyles}>
                  <span style={detailLabelStyles}>REFERENCE CODE</span>
                  <span style={detailValueRefStyles}>{selectedOrder.reference_code}</span>
                </div>
                <div style={detailFieldStyles}>
                  <span style={detailLabelStyles}>ORDER STATUS</span>
                  <span style={detailValueStyles}>{selectedOrder.status}</span>
                </div>
                <div style={detailFieldStyles}>
                  <span style={detailLabelStyles}>CUSTOMER DETAILS</span>
                  <span style={detailValueStyles}>
                    {selectedOrder.buyer_name || 'Buyer'} ({selectedOrder.buyer_email})
                  </span>
                </div>
                <div style={detailFieldStyles}>
                  <span style={detailLabelStyles}>ESCROW VALUE</span>
                  <span style={detailValueStyles}>
                    ₦{parseFloat(selectedOrder.total_amount.toString()).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <span style={detailLabelStyles}>ORDER ITEMS</span>
                <div style={itemsListStyles}>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} style={itemRowStyles}>
                      <div>
                        <strong style={itemNameStyles}>{item.product_name}</strong>
                        {item.variant_name && <span style={itemVariantStyles}>({item.variant_name})</span>}
                      </div>
                      <div style={itemMetaStyles}>
                        <span>Qty: {item.quantity}</span>
                        <span>₦{parseFloat((item.unit_price || item.price || '0').toString()).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={modalFooterStyles}>
                <button onClick={() => setSelectedOrder(null)} style={closeFooterBtnStyles}>
                  Close
                </button>
                {selectedOrder.status === 'PAID' && (
                  <button onClick={() => handleTransition(selectedOrder.id, 'PROCESSING')} style={actionBtnProcessStyles}>
                    Accept & Process
                  </button>
                )}
                {selectedOrder.status === 'PROCESSING' && (
                  <button onClick={() => handleTransition(selectedOrder.id, 'SHIPPED')} style={actionBtnShipStyles}>
                    Dispatch Shipment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  paddingTop: '1rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.775rem',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
};

const tableWrapperStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflowX: 'auto',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-bg-subtle)',
};

const thStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

const tdStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
};

const tdRefStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-primary)',
  fontWeight: '700',
};

const tdBuyerStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.85rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const buyerEmailStyles: React.CSSProperties = {
  fontSize: '0.725rem',
  color: 'var(--color-text-muted)',
  fontWeight: '500',
};

const tdAmountStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.85rem',
  fontWeight: '700',
  color: 'var(--color-text)',
};

const statusBadgeStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
};

const tdActionsStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

const actionBtnViewStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const actionBtnProcessStyles: React.CSSProperties = {
  background: 'rgba(255, 122, 0, 0.05)',
  border: '1px solid rgba(255, 122, 0, 0.2)',
  color: 'var(--color-primary)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const actionBtnShipStyles: React.CSSProperties = {
  background: 'rgba(59, 130, 246, 0.05)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  color: '#3b82f6',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const loadingStyles: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
};

const emptyStyles: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
};

// Modal
const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)',
};

const modalCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '500px',
  padding: '2rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: '1rem',
  cursor: 'pointer',
};

const modalContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const detailsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.25rem',
};

const detailFieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const detailLabelStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const detailValueRefStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-primary)',
  fontWeight: '700',
};

const detailValueStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  fontWeight: '600',
};

const itemsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '6px',
  maxHeight: '180px',
  overflowY: 'auto',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const itemNameStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--color-text)',
};

const itemVariantStyles: React.CSSProperties = {
  fontSize: '0.725rem',
  color: 'var(--color-text-muted)',
  marginLeft: '6px',
};

const itemMetaStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--color-text)',
};

const modalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '1.5rem',
  borderTop: '1px solid var(--color-border)',
  paddingTop: '1rem',
};

const closeFooterBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 16px',
  fontWeight: '600',
  fontSize: '0.825rem',
  cursor: 'pointer',
};
