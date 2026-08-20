import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Refund, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Refund Detail Modal
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Reject Reason Modal / State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRefunds = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listRefunds({
        page,
        status: statusFilter || undefined,
      });
      setRefunds(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load refund requests.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, statusFilter]);

  const handleApprove = async (refund: Refund) => {
    const confirmApprove = window.confirm(`Approve refund request for order ${refund.order_reference}?`);
    if (!confirmApprove) return;
    setIsActionPending(true);
    try {
      const updated = await adminApi.approveRefund(refund.id);
      toast.success(`Refund of ${formatCurrency(refund.amount)} approved successfully.`);
      setSelectedRefund(updated);
      setRefunds(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve refund.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund || !rejectReason) return;
    setIsActionPending(true);
    try {
      const updated = await adminApi.rejectRefund(selectedRefund.id, rejectReason);
      toast.success(`Refund of ${formatCurrency(selectedRefund.amount)} rejected.`);
      setSelectedRefund(updated);
      setRefunds(prev => prev.map(r => r.id === updated.id ? updated : r));
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject refund.');
    } finally {
      setIsActionPending(false);
    }
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
        <h2 style={titleStyles}>Refund Request Management</h2>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Refund Request Management</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Refunds</option>
            <option value="PENDING">Pending Initial Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved / Settlement Queue</option>
            <option value="REJECTED">Rejected</option>
            <option value="PROCESSED">Processed / Settled</option>
          </select>
        </div>
      </div>

      {/* Refunds Table */}
      {refunds.length === 0 ? (
        <EmptyState
          icon="💵"
          title="No Refund Submissions"
          subtitle="Try adjusting your status filter."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Order Reference</th>
                  <th style={tableHeaderCellStyles}>Reason</th>
                  <th style={tableHeaderCellStyles}>Evidence Attachments</th>
                  <th style={tableHeaderCellStyles}>Refund Amount</th>
                  <th style={tableHeaderCellStyles}>Submission Date</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                      <a href={`/orders?ref=${r.order_reference}`} style={{ color: 'var(--color-primary)' }}>
                        {r.order_reference}
                      </a>
                    </td>
                    <td style={{ ...tableCellStyles, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </td>
                    <td style={tableCellStyles}>{r.evidence?.length || 0} files</td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(r.amount)}</td>
                    <td style={tableCellStyles}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(r.status)}>{r.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRefund(r)}
                        style={viewBtnStyles}
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

      {/* Inspect Refund Detail Modal */}
      {selectedRefund && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '520px' }}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Refund Claim Verification</h3>
              <button type="button" onClick={() => setSelectedRefund(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Order Reference</span>
                <span style={detailValueStyles}>{selectedRefund.order_reference}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Claim Amount</span>
                <span style={detailValueStyles}>{formatCurrency(selectedRefund.amount)}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Dispute Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedRefund.status)}>{selectedRefund.status}</span>
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Initiation Date</span>
                <span style={detailValueStyles}>{new Date(selectedRefund.created_at).toLocaleString()}</span>
              </div>
              {selectedRefund.resolved_at && (
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Resolution Date</span>
                  <span style={detailValueStyles}>{new Date(selectedRefund.resolved_at).toLocaleString()}</span>
                </div>
              )}
              <div style={{ ...detailItemStyles, flexDirection: 'column', gap: '4px', border: 'none' }}>
                <span style={detailLabelStyles}>Claim Reason Summary</span>
                <p style={paragraphStyles}>{selectedRefund.reason}</p>
              </div>
              <div style={{ ...detailItemStyles, flexDirection: 'column', gap: '4px', border: 'none' }}>
                <span style={detailLabelStyles}>Detailed Explanation</span>
                <p style={paragraphStyles}>{selectedRefund.description || 'No extended description provided.'}</p>
              </div>

              {selectedRefund.admin_note && (
                <div style={{ ...detailItemStyles, flexDirection: 'column', gap: '4px', border: 'none' }}>
                  <span style={detailLabelStyles}>Administrative Notes</span>
                  <p style={{ ...paragraphStyles, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c' }}>
                    {selectedRefund.admin_note}
                  </p>
                </div>
              )}

              {/* Dispute Evidence files */}
              <div style={{ ...detailItemStyles, flexDirection: 'column', gap: '8px', border: 'none' }}>
                <span style={detailLabelStyles}>Provided Evidence Screenshots ({selectedRefund.evidence?.length || 0})</span>
                {selectedRefund.evidence && selectedRefund.evidence.length > 0 ? (
                  <div style={evidenceGridStyles}>
                    {selectedRefund.evidence.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={evidenceThumbnailStyles}
                      >
                        <span style={{ fontSize: '24px' }}>📄</span>
                        <span style={evidenceLabelStyles}>View File</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={detailValueStyles}>No dispute images uploaded.</span>
                )}
              </div>
            </div>

            {/* Resolution buttons */}
            {(selectedRefund.status === 'PENDING' || selectedRefund.status === 'UNDER_REVIEW') && (
              <div style={modalActionsStyles}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => handleApprove(selectedRefund)}
                    style={approveBtnStyles}
                  >
                    Approve &amp; Settle
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => setShowRejectModal(true)}
                    style={rejectBtnStyles}
                  >
                    Reject Claim
                  </button>
                </div>
              </div>
            )}
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
                <label style={modalLabelStyles}>Explanation notes to Buyer</label>
                <textarea
                  required
                  placeholder="Specify missing photos, verification of receipt, or return policy boundaries..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={textareaStyles}
                  rows={4}
                />
              </div>
              <div style={modalActionsStyles}>
                <button type="button" onClick={() => setShowRejectModal(false)} style={modalCancelBtnStyles}>
                  Cancel
                </button>
                <button type="submit" disabled={isActionPending} style={modalDangerSubmitBtnStyles}>
                  {isActionPending ? 'Saving...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  if (status === 'PROCESSED' || status === 'APPROVED') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING' || status === 'UNDER_REVIEW') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'REJECTED') {
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

const paragraphStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#1f2937',
  backgroundColor: '#f9fafb',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  lineHeight: 1.4,
};

const evidenceGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: '12px',
};

const evidenceThumbnailStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px',
  backgroundColor: '#f9fafb',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  textDecoration: 'none',
  color: '#4b5563',
  gap: '6px',
  transition: 'background-color 150ms ease',
};

const evidenceLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
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
