import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnGoal, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Save2OwnGoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Save2OwnGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  
  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGoals = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listSave2OwnGoals({
        page,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });
      setGoals(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own goals list.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGoals(true);
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Save2Own Goals Management</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Save2Own Goals Management</h2>

      <ApiErrorMessage error={error} />

      {/* Filters & Search */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by target product or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Goal Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All States</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PRODUCT_UNAVAILABLE">Product Unavailable</option>
            <option value="PRICE_CHANGED">Price Shifted</option>
            <option value="PAYMENT_REVIEW">Payment Review</option>
            <option value="REFUND_PENDING">Refund Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* S2O Table */}
      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No Goals Found"
          subtitle="Try adjusting your status filter or search parameters."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Target Product Details</th>
                  <th style={tableHeaderCellStyles}>Target Balance</th>
                  <th style={tableHeaderCellStyles}>Total Contributed</th>
                  <th style={tableHeaderCellStyles}>Goal Progress</th>
                  <th style={tableHeaderCellStyles}>Target Date</th>
                  <th style={tableHeaderCellStyles}>Current Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.id} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      <div style={productRowStyles}>
                        <img
                          src={g.product.primary_image_url || '/logo.jpg?v=2'}
                          alt={g.product.name}
                          style={productImgStyles}
                          onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                        />
                        <div>
                          <strong style={productNameStyles}>{g.product.name}</strong>
                          {g.variant && <span style={productSKUStyles}>Variant: {g.variant.name}</span>}
                          <span style={productQtyStyles}>Quantity: {g.quantity}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                      {formatCurrency(g.target_amount)}
                    </td>
                    <td style={{ ...tableCellStyles, fontWeight: 700, color: '#10b981' }}>
                      {formatCurrency(g.total_contributed)}
                    </td>
                    <td style={tableCellStyles}>
                      <div style={progressWrapperStyles}>
                        <div style={progressBarContainerStyles}>
                          <div
                            style={{
                              ...progressBarFillStyles,
                              width: `${Math.min(g.progress_percentage || 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span style={progressLabelStyles}>
                          {(g.progress_percentage || 0).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      {g.target_date ? new Date(g.target_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(g.status)}>{g.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/save2own/${g.id}`)}
                        style={inspectBtnStyles}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 10 States Badge Status Helpers
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  switch (status) {
    case 'ACTIVE':
      backgroundColor = '#d1fae5'; // light green
      color = '#065f46';
      break;
    case 'COMPLETED':
      backgroundColor = '#d1fae5';
      color = '#047857';
      break;
    case 'PAUSED':
      backgroundColor = '#fef3c7'; // light yellow
      color = '#92400e';
      break;
    case 'PRICE_CHANGED':
      backgroundColor = '#ffe4e6'; // pinkish red
      color = '#be123c';
      break;
    case 'PRODUCT_UNAVAILABLE':
      backgroundColor = '#ffedd5'; // light orange
      color = '#c2410c';
      break;
    case 'PAYMENT_REVIEW':
      backgroundColor = '#e0f2fe'; // light blue
      color = '#0369a1';
      break;
    case 'REFUND_PENDING':
      backgroundColor = '#f3e8ff'; // purple
      color = '#6b21a8';
      break;
    case 'CANCELLED':
    case 'SUSPENDED':
      backgroundColor = '#fee2e2'; // red
      color = '#991b1b';
      break;
    case 'DRAFT':
    default:
      backgroundColor = '#f3f4f6'; // grey
      color = '#374151';
      break;
  }

  return {
    backgroundColor,
    color,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  maxWidth: '440px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const searchBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const filterWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '16px var(--space-4)',
  color: '#374151',
};

const productRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const productImgStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  objectFit: 'cover',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const productNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#1f2937',
};

const productSKUStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#6b7280',
};

const productQtyStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#9ca3af',
};

const progressWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: '120px',
};

const progressBarContainerStyles: React.CSSProperties = {
  flex: 1,
  height: '8px',
  backgroundColor: '#f3f4f6',
  borderRadius: '9999px',
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#ff7a00',
  borderRadius: '9999px',
  background: 'linear-gradient(90deg, #ff7a00 0%, #ff9500 100%)',
};

const progressLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
};

const inspectBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ff7a00',
  border: '1px solid rgba(255,122,0,0.2)',
  padding: '4px 10px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  gap: '16px',
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const pageLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};
