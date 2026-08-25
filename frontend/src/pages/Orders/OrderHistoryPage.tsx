import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders';
import type { OrderSummary, PaginatedResponse } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// OrderHistoryPage — /dashboard/orders
// Fetches paginated orders from API.
// ----------------------------------------------------------
export default function OrderHistoryPage() {
  const [data, setData] = useState<PaginatedResponse<OrderSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.list(page);
      setData(res);
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  return (
    <div className="container" style={pageStyles}>
      <h1 style={titleStyles}>My Orders</h1>

      {/* Loading State */}
      {isLoading && (
        <div style={listStyles}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="72px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data && data.results.length === 0 && (
        <div style={emptyStyles}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <h3 style={emptyTitleStyles}>No orders yet</h3>
          <p style={emptySubStyles}>When you place your first order, it will appear here.</p>
          <Link to="/products" style={primaryBtnStyles}>Start Shopping</Link>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && data && data.results.length > 0 && (
        <>
          <div style={listStyles}>
            {data.results.map((order) => (
              <Link
                key={order.id}
                to={`/dashboard/orders/${order.reference}`}
                style={orderCardStyles}
              >
                <div style={orderLeftStyles}>
                  <span style={refStyles}>#{order.reference}</span>
                  <span style={dateStyles}>
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                <div style={orderCenterStyles}>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: statusColor(order.status).bg,
                      color: statusColor(order.status).text,
                    }}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span style={itemCountStyles}>
                    {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div style={orderRightStyles}>
                  <span style={totalStyles}>{formatCurrency(order.total)}</span>
                  <span style={chevronStyles}>›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {(data.next || data.previous) && (
            <div style={paginationStyles}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.previous}
                style={{
                  ...pageBtnStyles,
                  opacity: data.previous ? 1 : 0.4,
                }}
              >
                ← Previous
              </button>
              <span style={pageInfoStyles}>Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.next}
                style={{
                  ...pageBtnStyles,
                  opacity: data.next ? 1 : 0.4,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helpers
function statusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
    case 'COMPLETED':
    case 'RECEIVED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUND_REQUESTED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
    case 'REFUND_REVIEW':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return { bg: 'rgba(103, 58, 183, 0.08)', text: 'var(--color-primary)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

// Styling
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const orderCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: '#ffffff',
  textDecoration: 'none',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  flexWrap: 'wrap',
};

const orderLeftStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const refStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const dateStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const orderCenterStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
};

const itemCountStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const orderRightStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

const totalStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const chevronStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  color: 'var(--color-text-muted)',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-4)',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  backgroundColor: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
};

const pageInfoStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-12) var(--space-4)',
  textAlign: 'center',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const emptySubStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};
