import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnRefund, Save2OwnRefundStatus, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Save2OwnRefundsPage() {
  const [refunds, setRefunds] = useState<Save2OwnRefund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Modals State
  const [selectedRefund, setSelectedRefund] = useState<Save2OwnRefund | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form Inputs for Modals
  const [payoutReference, setPayoutReference] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRefunds = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listSave2OwnRefunds({
        page,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });
      setRefunds(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
      setTotalCount(res.count || 0);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own refunds.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRefunds(true);
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    setIsActionPending(true);
    try {
      await adminApi.approveSave2OwnRefund(selectedRefund.id);
      toast.success(`Refund ${selectedRefund.refund_reference} approved.`);
      setShowApproveModal(false);
      setSelectedRefund(null);
      await fetchRefunds(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve refund.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!payoutReference.trim()) {
      toast.error('Please enter the bank transaction or payout reference.');
      return;
    }

    setIsActionPending(true);
    try {
      await adminApi.processSave2OwnRefund(selectedRefund.id, {
        payout_reference: payoutReference.trim(),
        admin_notes: actionNotes.trim() || undefined,
      });
      toast.success(`Refund ${selectedRefund.refund_reference} marked as PROCESSED / PAID.`);
      setShowProcessModal(false);
      setSelectedRefund(null);
      setPayoutReference('');
      setActionNotes('');
      await fetchRefunds(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process refund.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting this refund.');
      return;
    }

    setIsActionPending(true);
    try {
      await adminApi.rejectSave2OwnRefund(selectedRefund.id, rejectionReason.trim());
      toast.success(`Refund ${selectedRefund.refund_reference} rejected.`);
      setShowRejectModal(false);
      setSelectedRefund(null);
      setRejectionReason('');
      await fetchRefunds(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject refund.');
    } finally {
      setIsActionPending(false);
    }
  };

  const formatCurrency = (val: any) => {
    const num = parseFloat(String(val || '0'));
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(isNaN(num) ? 0 : num);
  };

  const getStatusBadge = (status: Save2OwnRefundStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>
            ⏳ PENDING APPROVAL
          </span>
        );
      case 'APPROVED':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            ✓ APPROVED (AWAITING PAYOUT)
          </span>
        );
      case 'PROCESSED':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>
            ✓ PROCESSED / PAID
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            ✕ REJECTED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={containerStyles}>
      {/* Header and Subnav Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={titleStyles}>Save2Own Refunds Management</h1>
          <p style={subtitleStyles}>
            Formal refunds queue, payout verification, and settlement ledger for cancelled goals.
          </p>
        </div>

        {/* CSV Export Button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href={adminApi.exportSave2OwnRefundsCsvUrl({
              q: searchTerm || undefined,
              status: statusFilter || undefined,
            })}
            target="_blank"
            rel="noreferrer"
            style={btnSecondaryStyles}
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {/* Subnav Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <Link
          to="/save2own/dashboard"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          📊 Dashboard
        </Link>
        <Link
          to="/save2own"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🎯 All Goals
        </Link>
        <Link
          to="/save2own/contributions"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🏦 Contributions Verification
        </Link>
        <Link
          to="/save2own/participants"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          👥 Participants &amp; Identity
        </Link>
        <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, backgroundColor: '#ff7a00', color: '#ffffff' }}>
          💸 Refunds ({totalCount})
        </span>
      </div>

      <ApiErrorMessage error={error} />

      {/* Search and Status Filters */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by buyer name, email, goal ref, or refund ref..."
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
            <option value="APPROVED">Approved (Awaiting Payout)</option>
            <option value="PROCESSED">Processed / Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="320px" borderRadius="12px" />
        </div>
      ) : refunds.length === 0 ? (
        <EmptyState
          icon="💸"
          title="No Refunds Found"
          subtitle="There are currently no Save2Own refunds matching your selected search or filter."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Buyer</th>
                  <th style={tableHeaderCellStyles}>Goal / Product</th>
                  <th style={tableHeaderCellStyles}>Refund Amount</th>
                  <th style={tableHeaderCellStyles}>Refund Ref</th>
                  <th style={tableHeaderCellStyles}>Destination Account</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Requested Date</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{r.buyer_name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.buyer_email}</div>
                    </td>

                    <td style={tableCellStyles}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{r.goal_reference}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.product_name}</div>
                    </td>

                    <td style={{ ...tableCellStyles, fontWeight: 700, color: '#111827' }}>
                      {formatCurrency(r.amount)}
                    </td>

                    <td style={tableCellStyles}>
                      <code style={codeStyles}>{r.refund_reference}</code>
                    </td>

                    <td style={tableCellStyles}>
                      {r.destination_bank_name ? (
                        <div style={{ fontSize: '12px' }}>
                          <strong>{r.destination_bank_name}</strong>
                          <div style={{ fontSize: '11px', color: '#4b5563' }}>{r.destination_account_number}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.destination_account_name}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Not specified</span>
                      )}
                    </td>

                    <td style={tableCellStyles}>
                      {getStatusBadge(r.status)}
                    </td>

                    <td style={{ ...tableCellStyles, fontSize: '11px', color: '#6b7280' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>

                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRefund(r);
                                setShowApproveModal(true);
                              }}
                              style={btnApproveStyles}
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRefund(r);
                                setRejectionReason('');
                                setShowRejectModal(true);
                              }}
                              style={btnRejectStyles}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {r.status === 'APPROVED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRefund(r);
                                setPayoutReference('');
                                setActionNotes('');
                                setShowProcessModal(true);
                              }}
                              style={btnProcessStyles}
                            >
                              💸 Process Payout
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRefund(r);
                                setRejectionReason('');
                                setShowRejectModal(true);
                              }}
                              style={btnRejectStyles}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRefund(r);
                            setShowDetailModal(true);
                          }}
                          style={btnInspectStyles}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationWrapperStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && selectedRefund && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Approve Refund Request</h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Are you sure you want to approve refund <strong>{selectedRefund.refund_reference}</strong> for amount{' '}
              <strong>{formatCurrency(selectedRefund.amount)}</strong>?
            </p>
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '12px' }}>
              <div><strong>Buyer:</strong> {selectedRefund.buyer_name} ({selectedRefund.buyer_email})</div>
              <div><strong>Destination Bank:</strong> {selectedRefund.destination_bank_name}</div>
              <div><strong>Account Number:</strong> {selectedRefund.destination_account_number}</div>
              <div><strong>Account Name:</strong> {selectedRefund.destination_account_name}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                style={btnSecondaryStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isActionPending}
                style={btnApproveStyles}
              >
                {isActionPending ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS PAYOUT MODAL */}
      {showProcessModal && selectedRefund && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Process Refund Payout</h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Record payout details for refund <strong>{selectedRefund.refund_reference}</strong> ({formatCurrency(selectedRefund.amount)}).
            </p>

            <form onSubmit={handleProcessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '12px' }}>
                <div><strong>Payee Account:</strong> {selectedRefund.destination_account_name}</div>
                <div><strong>Bank:</strong> {selectedRefund.destination_bank_name} ({selectedRefund.destination_account_number})</div>
              </div>

              <div>
                <label style={formLabelStyles}>Bank Transfer / Payout Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIP-REF-99201928"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Admin Settlement Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transferred via Zenith Corporate Internet Banking"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  style={{ ...formInputStyles, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  style={btnSecondaryStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={btnProcessStyles}
                >
                  {isActionPending ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedRefund && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Reject Refund Request</h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Rejecting this refund will record an audit trail and preserve the reason.
            </p>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={formLabelStyles}>Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State clear reason for rejection (e.g. Account number mismatch)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ ...formInputStyles, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={btnSecondaryStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={btnRejectStyles}
                >
                  {isActionPending ? 'Rejecting...' : 'Reject Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailModal && selectedRefund && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={modalTitleStyles}>Refund Audit &amp; Settlement Details</h3>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Refund Reference:</span>
                <code>{selectedRefund.refund_reference}</code>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Goal Reference:</span>
                <span>{selectedRefund.goal_reference}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Product:</span>
                <span>{selectedRefund.product_name}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Amount:</span>
                <strong>{formatCurrency(selectedRefund.amount)}</strong>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Status:</span>
                {getStatusBadge(selectedRefund.status)}
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Customer Bank:</span>
                <span>{selectedRefund.destination_bank_name || 'N/A'}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Account Number:</span>
                <code>{selectedRefund.destination_account_number || 'N/A'}</code>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Account Name:</span>
                <span>{selectedRefund.destination_account_name || 'N/A'}</span>
              </div>
              {selectedRefund.reason && (
                <div style={detailRowStyles}>
                  <span style={detailLabelStyles}>Cancellation Reason:</span>
                  <span>{selectedRefund.reason}</span>
                </div>
              )}
              {selectedRefund.processed_by_email && (
                <div style={detailRowStyles}>
                  <span style={detailLabelStyles}>Processed By:</span>
                  <span>{selectedRefund.processed_by_email}</span>
                </div>
              )}
              {selectedRefund.processed_at && (
                <div style={detailRowStyles}>
                  <span style={detailLabelStyles}>Processed Date:</span>
                  <span>{new Date(selectedRefund.processed_at).toLocaleString()}</span>
                </div>
              )}
              {selectedRefund.admin_notes && (
                <div style={detailRowStyles}>
                  <span style={detailLabelStyles}>Admin Notes:</span>
                  <span>{selectedRefund.admin_notes}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={btnSecondaryStyles}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  padding: '24px',
  maxWidth: '1280px',
  margin: '0 auto',
};

const titleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 6px 0',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: 0,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '20px',
  backgroundColor: '#ffffff',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  minWidth: '260px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
};

const searchBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const filterWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  backgroundColor: '#ffffff',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '13px',
};

const tableHeaderRowStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontWeight: 600,
  color: '#374151',
  fontSize: '12px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tableCellStyles: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const codeStyles: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: '#1f2937',
};

const btnSecondaryStyles: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const btnApproveStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnProcessStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnRejectStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnInspectStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '6px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const paginationWrapperStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
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
  zIndex: 1000,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 10px 0',
};

const formLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const formInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const detailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '8px',
  borderBottom: '1px solid #f3f4f6',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
  fontWeight: 500,
};
