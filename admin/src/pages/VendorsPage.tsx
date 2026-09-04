import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Vendor, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

// Loading spinner icon component
const LoadingSpinnerIcon = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    style={{
      animation: 'vendorActionSpin 0.8s linear infinite',
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
    }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="3.5"
      strokeDasharray="32 60"
      strokeLinecap="round"
    />
  </svg>
);

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Vendor Detail Modal
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'SUSPEND' | null>(null);

  // Reject Reason Modal / State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVendors = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listVendors({
        page,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });
      setVendors(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load vendors list.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVendors(true);
  };

  const handleApprove = async (vendor: Vendor) => {
    if (isActionPending) return;
    setIsActionPending(true);
    setActionType('APPROVE');
    try {
      const updated = await adminApi.approveVendor(vendor.id);
      toast.success(`Vendor ${vendor.name} has been approved.`);
      setSelectedVendor(updated);
      setVendors(prev => prev.map(v => v.id === updated.id ? updated : v));
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve vendor.');
    } finally {
      setIsActionPending(false);
      setActionType(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !rejectReason || isActionPending) return;
    setIsActionPending(true);
    setActionType('REJECT');
    try {
      const updated = await adminApi.rejectVendor(selectedVendor.id, rejectReason);
      toast.success(`Vendor ${selectedVendor.name} has been rejected.`);
      setSelectedVendor(updated);
      setVendors(prev => prev.map(v => v.id === updated.id ? updated : v));
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject vendor.');
    } finally {
      setIsActionPending(false);
      setActionType(null);
    }
  };

  const handleSuspend = async (vendor: Vendor) => {
    if (isActionPending) return;
    setIsActionPending(true);
    setActionType('SUSPEND');
    try {
      const updated = await adminApi.suspendVendor(vendor.id);
      toast.success(`Vendor ${vendor.name} has been suspended.`);
      setSelectedVendor(updated);
      setVendors(prev => prev.map(v => v.id === updated.id ? updated : v));
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend vendor.');
    } finally {
      setIsActionPending(false);
      setActionType(null);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Vendor Directory</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Vendor Directory</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Active / Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      {vendors.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No Vendors Found"
          subtitle="Try adjusting your status filters or search term."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Business Name</th>
                  <th style={tableHeaderCellStyles}>Location</th>
                  <th style={tableHeaderCellStyles}>Rating</th>
                  <th style={tableHeaderCellStyles}>Products Count</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, fontWeight: 600 }}>{v.name}</td>
                    <td style={tableCellStyles}>{v.location || 'N/A'}</td>
                    <td style={tableCellStyles}>★ {v.rating?.toFixed(1) || '0.0'} ({v.review_count || 0})</td>
                    <td style={tableCellStyles}>{v.product_count} items</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(v.status)}>{v.status}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedVendor(v)}
                        style={viewBtnStyles}
                      >
                        Review
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

      {/* Inspect Vendor Modal */}
      {selectedVendor && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Vendor Review Panel</h3>
              <button type="button" onClick={() => setSelectedVendor(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Business Name</span>
                <span style={detailValueStyles}>{selectedVendor.name}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Vendor ID</span>
                <span style={detailValueStyles}>{selectedVendor.id}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>System Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedVendor.status)}>{selectedVendor.status}</span>
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Business Location</span>
                <span style={detailValueStyles}>{selectedVendor.location || 'Not Specified'}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Response Rate</span>
                <span style={detailValueStyles}>{selectedVendor.response_rate ? `${selectedVendor.response_rate}%` : 'N/A'}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Date Registered</span>
                <span style={detailValueStyles}>{new Date(selectedVendor.joined_date).toLocaleString()}</span>
              </div>
              <div style={{ ...detailItemStyles, flexDirection: 'column', gap: '4px', border: 'none' }}>
                <span style={detailLabelStyles}>Description / Bio</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#1f2937', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', lineHeight: 1.4 }}>
                  {selectedVendor.description || 'No business details provided.'}
                </p>
              </div>
            </div>

            {/* Verification actions */}
            <div style={modalActionsStyles}>
              {selectedVendor.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => handleApprove(selectedVendor)}
                    style={{
                      ...approveBtnStyles,
                      opacity: isActionPending ? 0.75 : 1,
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      minWidth: '140px',
                    }}
                  >
                    {isActionPending && actionType === 'APPROVE' ? (
                      <>
                        <LoadingSpinnerIcon color="#ffffff" />
                        <span>Approving Store...</span>
                      </>
                    ) : (
                      <>
                        <span>✓ Approve Store</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => setShowRejectModal(true)}
                    style={{
                      ...rejectBtnStyles,
                      opacity: isActionPending ? 0.6 : 1,
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}

              {selectedVendor.status === 'APPROVED' && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleSuspend(selectedVendor)}
                  style={{
                    ...suspendBtnStyles,
                    opacity: isActionPending ? 0.75 : 1,
                    cursor: isActionPending ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minWidth: '150px',
                  }}
                >
                  {isActionPending && actionType === 'SUSPEND' ? (
                    <>
                      <LoadingSpinnerIcon color="#ffffff" />
                      <span>Suspending...</span>
                    </>
                  ) : (
                    <span>Suspend Vendor</span>
                  )}
                </button>
              )}

              {selectedVendor.status === 'SUSPENDED' && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleApprove(selectedVendor)}
                  style={{
                    ...approveBtnStyles,
                    opacity: isActionPending ? 0.75 : 1,
                    cursor: isActionPending ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minWidth: '150px',
                  }}
                >
                  {isActionPending && actionType === 'APPROVE' ? (
                    <>
                      <LoadingSpinnerIcon color="#ffffff" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>✓ Activate Vendor</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal Dialog */}
      {showRejectModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '400px', zIndex: 1000 }}>
            <h3 style={modalTitleStyles}>Reason for Rejection</h3>
            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={modalLabelStyles}>Explanation notes to Vendor</label>
                <textarea
                  required
                  placeholder="Specify validation issues, missing tax details, or terms discrepancy..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={textareaStyles}
                  rows={4}
                />
              </div>
              <div style={modalActionsStyles}>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => setShowRejectModal(false)}
                  style={modalCancelBtnStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={{
                    ...modalDangerSubmitBtnStyles,
                    opacity: isActionPending ? 0.75 : 1,
                    cursor: isActionPending ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isActionPending && actionType === 'REJECT' ? (
                    <>
                      <LoadingSpinnerIcon color="#ffffff" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span>Confirm Reject</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes vendorActionSpin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#fee2e2';
  let color = '#991b1b';

  if (status === 'APPROVED') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'SUSPENDED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  }

  return {
    backgroundColor,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
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

const viewBtnStyles: React.CSSProperties = {
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

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '480px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
  marginBottom: '20px',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
};

const detailsGridStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const detailItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  borderBottom: '1px dotted #f3f4f6',
  paddingBottom: '8px',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
};

const detailValueStyles: React.CSSProperties = {
  fontWeight: 600,
  color: '#1f2937',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '24px',
};

const approveBtnStyles: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const rejectBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const suspendBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const modalLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
  marginBottom: '6px',
};

const textareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  resize: 'none',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  backgroundColor: '#ef4444',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
