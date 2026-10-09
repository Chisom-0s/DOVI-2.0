import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnContributionAdmin, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Save2OwnContributionsPage() {
  const [contributions, setContributions] = useState<Save2OwnContributionAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedContribution, setSelectedContribution] = useState<Save2OwnContributionAdmin | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Confirm Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [contribToConfirm, setContribToConfirm] = useState<Save2OwnContributionAdmin | null>(null);

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [contribToReject, setContribToReject] = useState<Save2OwnContributionAdmin | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reverse Modal
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [contribToReverse, setContribToReverse] = useState<Save2OwnContributionAdmin | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Proof Image Preview Modal
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const fetchContributions = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listSave2OwnContributions({
        page,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setContributions(res.results || []);
      setTotalCount(res.count || 0);
      setTotalPages(Math.ceil((res.count || 0) / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load contributions.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContributions(true);
  };

  const handleOpenConfirm = (c: Save2OwnContributionAdmin) => {
    setContribToConfirm(c);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!contribToConfirm) return;
    setIsActionPending(true);
    try {
      const res = await adminApi.confirmSave2OwnContribution(contribToConfirm.id);
      toast.success(res.message || 'Payment confirmed! User goal balance updated.');
      setShowConfirmModal(false);
      setContribToConfirm(null);
      await fetchContributions(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm contribution.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleOpenReject = (c: Save2OwnContributionAdmin) => {
    setContribToReject(c);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribToReject || !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    setIsActionPending(true);
    try {
      const res = await adminApi.rejectSave2OwnContribution(contribToReject.id, rejectionReason.trim());
      toast.success(res.message || 'Contribution rejected.');
      setShowRejectModal(false);
      setContribToReject(null);
      setRejectionReason('');
      await fetchContributions(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject contribution.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleOpenReverse = (c: Save2OwnContributionAdmin) => {
    setContribToReverse(c);
    setReversalReason('');
    setShowReverseModal(true);
  };

  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribToReverse || !reversalReason.trim()) {
      toast.error('Please specify a reversal reason.');
      return;
    }
    setIsActionPending(true);
    try {
      const res = await adminApi.reverseSave2OwnContribution(contribToReverse.id, reversalReason.trim());
      toast.success(res.message || 'Contribution reversed! Balance deducted.');
      setShowReverseModal(false);
      setContribToReverse(null);
      setReversalReason('');
      await fetchContributions(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reverse contribution.');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span style={badgeConfirmedStyles}>CONFIRMED</span>;
      case 'REJECTED':
        return <span style={badgeRejectedStyles}>REJECTED</span>;
      case 'SUBMITTED':
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <span style={badgePendingStyles}>PENDING VERIFICATION</span>;
      default:
        return <span style={badgeDefaultStyles}>{status}</span>;
    }
  };

  return (
    <div style={containerStyles}>
      {/* Header and Subnav Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={titleStyles}>Save2Own Contributions Verification</h1>
          <p style={subtitleStyles}>
            Review and verify incoming bank transfer payments for Save2Own goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href={adminApi.exportSave2OwnContributionsCsvUrl({
              status: statusFilter || undefined,
              search: searchTerm || undefined,
            })}
            target="_blank"
            rel="noreferrer"
            style={{ ...tabInactiveStyles, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {/* Subnav Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <Link to="/save2own/dashboard" style={tabInactiveStyles}>
          📊 Dashboard
        </Link>
        <Link to="/save2own" style={tabInactiveStyles}>
          🎯 All Goals
        </Link>
        <span style={tabActiveStyles}>
          🏦 Contributions Verification ({totalCount})
        </span>
        <Link to="/save2own/participants" style={tabInactiveStyles}>
          👥 Participants &amp; Identity
        </Link>
        <Link to="/save2own/refunds" style={tabInactiveStyles}>
          💸 Refunds
        </Link>
      </div>

      <ApiErrorMessage error={error} />

      {/* Filter & Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by user email, name, or transfer ref..."
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
            <option value="SUBMITTED">Pending Verification (Submitted)</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending (Initiated)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="320px" borderRadius="12px" />
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No Contributions Found"
          subtitle="There are currently no contributions matching your selected status filter."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>User</th>
                  <th style={tableHeaderCellStyles}>Goal / Product</th>
                  <th style={tableHeaderCellStyles}>Amount</th>
                  <th style={tableHeaderCellStyles}>Transfer Ref</th>
                  <th style={tableHeaderCellStyles}>Payment Account (Snapshot)</th>
                  <th style={tableHeaderCellStyles}>Proof</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Date</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{c.user_name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.user_email}</div>
                    </td>

                    <td style={tableCellStyles}>
                      <Link
                        to={`/save2own/${c.goal_id}`}
                        style={{ color: '#ff7a00', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {c.goal_reference_code || `Goal #${c.goal_id?.slice(0, 8)}`}
                      </Link>
                      <div style={{ fontSize: '11px', color: '#4b5563', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.product_name}
                      </div>
                    </td>

                    <td style={{ ...tableCellStyles, fontWeight: 700, color: '#111827' }}>
                      {formatCurrency(c.amount)}
                    </td>

                    <td style={tableCellStyles}>
                      <code style={codeStyles}>
                        {c.transfer_reference || 'N/A'}
                      </code>
                      {c.has_duplicate_reference && (
                        <div style={{ marginTop: '4px' }}>
                          <span
                            title="Duplicate transfer reference detected! Multiple contributions share this reference code."
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            ⚠️ DUPLICATE REF ({c.duplicate_references_count || 2})
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={tableCellStyles}>
                      {c.bank_name_snapshot ? (
                        <div style={{ fontSize: '12px' }}>
                          <strong>{c.bank_name_snapshot}</strong>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.account_number_snapshot}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Dovi Save2Own Account</span>
                      )}
                    </td>

                    <td style={tableCellStyles}>
                      {c.payment_proof ? (
                        <button
                          type="button"
                          onClick={() => setProofPreviewUrl(c.payment_proof || null)}
                          style={proofBtnStyles}
                        >
                          📎 View Receipt
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>None</span>
                      )}
                    </td>

                    <td style={tableCellStyles}>
                      {getStatusBadge(c.status)}
                    </td>

                    <td style={{ ...tableCellStyles, fontSize: '11px', color: '#6b7280' }}>
                      {new Date(c.submitted_at || c.created_at).toLocaleString()}
                    </td>

                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {c.status !== 'CONFIRMED' && c.status !== 'REJECTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirm(c)}
                              style={btnConfirmStyles}
                              title="Confirm Payment & Credit Goal Balance"
                            >
                              ✓ Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(c)}
                              style={btnRejectStyles}
                              title="Reject Payment"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {c.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenReverse(c)}
                            style={btnReverseStyles}
                            title="Reverse confirmed payment and deduct from authoritative balance"
                          >
                            ↩ Reverse
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContribution(c);
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
                onClick={() => setPage(p => p - 1)}
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
                onClick={() => setPage(p => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PAYMENT MODAL */}
      {showConfirmModal && contribToConfirm && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Confirm Payment &amp; Credit Balance
            </h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Are you sure you want to confirm this payment? This will authoritatively increase the customer&apos;s Save2Own goal balance by <strong>{formatCurrency(contribToConfirm.amount)}</strong>.
            </p>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px' }}>
              <div><strong>User:</strong> {contribToConfirm.user_name} ({contribToConfirm.user_email})</div>
              <div><strong>Transfer Ref:</strong> {contribToConfirm.transfer_reference || 'N/A'}</div>
              <div><strong>Account Paid:</strong> {contribToConfirm.bank_name_snapshot || 'Save2Own Account'} ({contribToConfirm.account_number_snapshot})</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={btnSecondaryModalStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleConfirmSubmit}
                style={btnConfirmSubmitStyles}
              >
                {isActionPending ? 'Confirming...' : 'Yes, Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL */}
      {showRejectModal && contribToReject && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
              Reject Contribution
            </h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              The contribution will be marked as rejected and will <strong>NOT</strong> affect the user&apos;s goal balance.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Funds not received in account, incorrect transfer reference, insufficient transfer amount..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={btnSecondaryModalStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={btnRejectSubmitStyles}
                >
                  {isActionPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedContribution && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                Contribution Details
              </h3>
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
                <span style={detailLabelStyles}>Contribution ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedContribution.id}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Customer:</span>
                <span>{selectedContribution.user_name} ({selectedContribution.user_email})</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Target Product:</span>
                <span>{selectedContribution.product_name}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Amount:</span>
                <strong style={{ color: '#ff7a00', fontSize: '15px' }}>{formatCurrency(selectedContribution.amount)}</strong>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Transfer Narration / Ref:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedContribution.transfer_reference || 'N/A'}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Bank Account Snapshot:</span>
                <span>{selectedContribution.bank_name_snapshot || 'Save2Own Account'} ({selectedContribution.account_number_snapshot})</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Status:</span>
                <span>{getStatusBadge(selectedContribution.status)}</span>
              </div>
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Submitted At:</span>
                <span>{selectedContribution.submitted_at ? new Date(selectedContribution.submitted_at).toLocaleString() : 'N/A'}</span>
              </div>
              {selectedContribution.verified_at && (
                <div style={detailRowStyles}>
                  <span style={detailLabelStyles}>Verified At:</span>
                  <span>{new Date(selectedContribution.verified_at).toLocaleString()} by {selectedContribution.verified_by_email || 'Admin'}</span>
                </div>
              )}
              {selectedContribution.rejection_reason && (
                <div style={{ ...detailRowStyles, color: '#dc2626' }}>
                  <span style={detailLabelStyles}>Rejection Reason:</span>
                  <span>{selectedContribution.rejection_reason}</span>
                </div>
              )}
              {selectedContribution.payment_proof && (
                <div style={{ marginTop: '8px' }}>
                  <span style={detailLabelStyles}>Payment Proof / Receipt:</span>
                  <div style={{ marginTop: '6px' }}>
                    <a
                      href={selectedContribution.payment_proof}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#ff7a00', textDecoration: 'underline', fontSize: '12px' }}
                    >
                      Open Full Receipt File
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={btnSecondaryModalStyles}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF PREVIEW MODAL */}
      {proofPreviewUrl && (
        <div style={modalBackdropStyles} onClick={() => setProofPreviewUrl(null)}>
          <div style={{ ...modalContentStyles, maxWidth: '640px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Payment Receipt</h4>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>
            <img
              src={proofPreviewUrl}
              alt="Payment Proof Receipt"
              style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '8px', objectFit: 'contain' }}
            />
            <div style={{ marginTop: '12px' }}>
              <a
                href={proofPreviewUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#ff7a00', textDecoration: 'underline', fontSize: '12px' }}
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* REVERSE MODAL */}
      {showReverseModal && contribToReverse && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                ↩ Reverse Confirmed Payment
              </h3>
              <button
                type="button"
                onClick={() => setShowReverseModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              You are reversing contribution <strong>{contribToReverse.transfer_reference}</strong> ({formatCurrency(contribToReverse.amount)}) for customer <strong>{contribToReverse.user_name}</strong>.
              <br /><br />
              <strong style={{ color: '#b91c1c' }}>Authoritative Action:</strong> This payment will transition to <code>REVERSED</code> and the amount will be immediately deducted from the goal's saved balance.
            </p>

            <form onSubmit={handleReverseSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={formLabelStyles}>Reversal Reason (Audit Log Required) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Bank chargeback / Bounced transfer / Double-counted reference..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  style={{ ...formInputStyles, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReverseModal(false)}
                  style={btnSecondaryModalStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={{ ...btnRejectSubmitStyles, backgroundColor: '#dc2626' }}
                >
                  {isActionPending ? 'Reversing...' : 'Confirm Reversal & Deduct'}
                </button>
              </div>
            </form>
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
  maxWidth: '1360px',
  margin: '0 auto',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 4px 0',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: 0,
};

const tabActiveStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 700,
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  textDecoration: 'none',
};

const tabInactiveStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  textDecoration: 'none',
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  marginBottom: '20px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  minWidth: '280px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
};

const searchBtnStyles: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#111827',
  color: '#ffffff',
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
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tableCellStyles: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
};

const codeStyles: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '12px',
  backgroundColor: '#f3f4f6',
  padding: '2px 6px',
  borderRadius: '4px',
};

const proofBtnStyles: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: '#ff7a00',
  border: '1px solid rgba(255, 122, 0, 0.3)',
  cursor: 'pointer',
};

const badgeConfirmedStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  color: '#059669',
};

const badgeRejectedStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: '#dc2626',
};

const badgePendingStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  color: '#d97706',
};

const badgeDefaultStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
};

const btnConfirmStyles: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: '4px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnRejectStyles: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: '4px',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#dc2626',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  cursor: 'pointer',
};

const btnReverseStyles: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: '4px',
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #f87171',
  cursor: 'pointer',
};

const btnInspectStyles: React.CSSProperties = {
  padding: '5px 8px',
  fontSize: '11px',
  fontWeight: 500,
  borderRadius: '4px',
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
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
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
  maxWidth: '460px',
  padding: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const detailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid #f3f4f6',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
};

const btnSecondaryModalStyles: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const btnConfirmSubmitStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700,
  borderRadius: '6px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnRejectSubmitStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700,
  borderRadius: '6px',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
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
