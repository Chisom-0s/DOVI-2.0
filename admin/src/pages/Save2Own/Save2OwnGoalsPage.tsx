import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnGoal, Save2OwnContribution, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Save2OwnGoalsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'goals' | 'contributions'>('goals');

  // Goals State
  const [goals, setGoals] = useState<Save2OwnGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [goalPage, setGoalPage] = useState(1);
  const [totalGoalPages, setTotalGoalPages] = useState(1);

  // Contributions / Verification Queue State
  const [contributions, setContributions] = useState<Save2OwnContribution[]>([]);
  const [isLoadingContribs, setIsLoadingContribs] = useState(false);
  const [contribStatusFilter, setContribStatusFilter] = useState('');
  const [contribSearch, setContribSearch] = useState('');
  const [contribPage, setContribPage] = useState(1);
  const [totalContribPages, setTotalContribPages] = useState(1);

  // Verification Actions State
  const [selectedContribForAction, setSelectedContribForAction] = useState<Save2OwnContribution | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  const [error, setError] = useState<APIError | null>(null);

  const fetchGoals = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoadingGoals(true);
    setError(null);
    try {
      const res = await adminApi.listSave2OwnGoals({
        page: goalPage,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });
      setGoals(res.results || []);
      setTotalGoalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own goals list.');
    } finally {
      if (showSkeleton) setIsLoadingGoals(false);
    }
  };

  const fetchContributions = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoadingContribs(true);
    try {
      const res = await adminApi.listSave2OwnContributions({
        page: contribPage,
        status: contribStatusFilter || undefined,
        search: contribSearch || undefined,
      });
      setContributions(res.results || []);
      setTotalContribPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      toast.error('Failed to load contributions list.');
    } finally {
      if (showSkeleton) setIsLoadingContribs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'goals') {
      fetchGoals();
    } else {
      fetchContributions();
    }
  }, [activeTab, goalPage, statusFilter, contribPage, contribStatusFilter]);

  const handleGoalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoalPage(1);
    fetchGoals(true);
  };

  const handleContribSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContribPage(1);
    fetchContributions(true);
  };

  const handleConfirmContribution = async () => {
    if (!selectedContribForAction) return;
    setIsActionPending(true);
    try {
      await adminApi.confirmSave2OwnContribution(selectedContribForAction.id, actionNotes.trim());
      toast.success('Contribution confirmed! Authoritative balance has been credited.');
      setShowConfirmModal(false);
      setSelectedContribForAction(null);
      setActionNotes('');
      await fetchContributions(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm contribution.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectContribution = async () => {
    if (!selectedContribForAction) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }

    setIsActionPending(true);
    try {
      await adminApi.rejectSave2OwnContribution(selectedContribForAction.id, rejectionReason.trim());
      toast.success('Contribution rejected. Balance remains unchanged.');
      setShowRejectModal(false);
      setSelectedContribForAction(null);
      setRejectionReason('');
      await fetchContributions(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject contribution.');
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

  const pendingCount = contributions.filter(
    (c) => (c.status || '').toLowerCase() === 'submitted' || (c.status || '').toLowerCase() === 'pending'
  ).length;

  return (
    <div style={containerStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ ...titleStyles, margin: '0 0 4px 0' }}>Save2Own Goals Management</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Monitor direct commerce Save2Own customer goals, installments, and fulfillment state.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, backgroundColor: '#ff7a00', color: '#ffffff' }}>
            🎯 All Goals
          </span>
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
            👥 Participants & Identity
          </Link>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Tab Navigation */}
      <div style={tabContainerStyles}>
        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          style={tabBtnStyles(activeTab === 'goals')}
        >
          🎯 Goals Overview ({goals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contributions')}
          style={tabBtnStyles(activeTab === 'contributions')}
        >
          🏦 Bank Transfer Verification Queue
          {pendingCount > 0 && (
            <span style={pendingCounterBadgeStyles}>{pendingCount} Pending</span>
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: GOALS OVERVIEW
          ======================================================== */}
      {activeTab === 'goals' && (
        <>
          {/* Filters & Search */}
          <div style={filterBarStyles}>
            <form onSubmit={handleGoalSearchSubmit} style={searchFormStyles}>
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
                  setGoalPage(1);
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

          {isLoadingGoals ? (
            <Skeleton width="100%" height="300px" borderRadius="12px" />
          ) : goals.length === 0 ? (
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
                    {goals.map((g: any) => {
                      const prodName =
                        g.product?.name ||
                        (typeof g.product === 'string' ? g.product : null) ||
                        g.product_name ||
                        g.variant_name ||
                        `Goal ${g.reference_code || g.id}`;
                      const variantName =
                        g.variant?.name ||
                        g.variant_name ||
                        g.variant_sku ||
                        (typeof g.variant === 'string' ? g.variant : '');
                      const targetAmt = g.target_amount || '0';
                      const savedAmt = g.saved_amount || g.total_contributed || '0';
                      const rawProgress =
                        g.progress_percent ??
                        g.progress_percentage ??
                        (parseFloat(String(targetAmt || '0')) > 0
                          ? (parseFloat(String(savedAmt || '0')) / parseFloat(String(targetAmt || '0'))) * 100
                          : 0);
                      const progressPct = Number(rawProgress) || 0;
                      const img = g.product?.primary_image_url || g.product_image || '/logo.jpg?v=2';

                      return (
                        <tr key={g.id} style={tableRowStyles}>
                          <td style={tableCellStyles}>
                            <div style={productRowStyles}>
                              <img
                                src={img}
                                alt={prodName}
                                style={productImgStyles}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                                }}
                              />
                              <div>
                                <strong style={productNameStyles}>{prodName}</strong>
                                {variantName && <span style={productSKUStyles}>Variant: {variantName}</span>}
                                <span style={productQtyStyles}>Quantity: {g.quantity || 1}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                            {formatCurrency(targetAmt)}
                          </td>
                          <td style={{ ...tableCellStyles, fontWeight: 700, color: '#10b981' }}>
                            {formatCurrency(savedAmt)}
                          </td>
                          <td style={tableCellStyles}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700 }}>{progressPct.toFixed(1)}%</span>
                              <div style={progressBgStyles}>
                                <div style={{ ...progressFillStyles, width: `${Math.min(progressPct, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td style={tableCellStyles}>
                            {g.target_date ? new Date(g.target_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={tableCellStyles}>
                            <span style={statusBadgeStyles(g.status)}>
                              {(g.status || '').replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/save2own/${g.id}`)}
                              style={inspectBtnStyles}
                            >
                              Audit Goal &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalGoalPages > 1 && (
                <div style={paginationStyles}>
                  <button
                    type="button"
                    disabled={goalPage <= 1}
                    onClick={() => setGoalPage((p) => p - 1)}
                    style={pageBtnStyles}
                  >
                    &larr; Prev
                  </button>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Page {goalPage} of {totalGoalPages}
                  </span>
                  <button
                    type="button"
                    disabled={goalPage >= totalGoalPages}
                    onClick={() => setGoalPage((p) => p + 1)}
                    style={pageBtnStyles}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================
          TAB 2: BANK TRANSFER VERIFICATION QUEUE
          ======================================================== */}
      {activeTab === 'contributions' && (
        <>
          <div style={complianceNoticeStyles}>
            🔒 <strong>Verification Policy:</strong> Bank transfer contributions remain <em>Pending Verification</em> until approved below. Approving a contribution authoritatively increases the user's Save2Own balance. Rejecting a contribution leaves the balance unchanged.
          </div>

          {/* Filters & Search */}
          <div style={filterBarStyles}>
            <form onSubmit={handleContribSearchSubmit} style={searchFormStyles}>
              <input
                type="text"
                placeholder="Search by transfer ref, email, product..."
                value={contribSearch}
                onChange={(e) => setContribSearch(e.target.value)}
                style={searchInputStyles}
              />
              <button type="submit" style={searchBtnStyles}>Filter</button>
            </form>

            <div style={filterWrapperStyles}>
              <label style={filterLabelStyles}>Status:</label>
              <select
                value={contribStatusFilter}
                onChange={(e) => {
                  setContribStatusFilter(e.target.value);
                  setContribPage(1);
                }}
                style={selectStyles}
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted / Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
          </div>

          {isLoadingContribs ? (
            <Skeleton width="100%" height="300px" borderRadius="12px" />
          ) : contributions.length === 0 ? (
            <EmptyState
              icon="🏦"
              title="No Contributions Found"
              subtitle="There are no bank transfer contributions matching your filter."
            />
          ) : (
            <div style={tableCardStyles}>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>User &amp; Goal</th>
                      <th style={tableHeaderCellStyles}>Amount</th>
                      <th style={tableHeaderCellStyles}>Transfer Reference</th>
                      <th style={tableHeaderCellStyles}>Bank Account (Snapshotted)</th>
                      <th style={tableHeaderCellStyles}>Submitted At</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Proof &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => {
                      const isConfirmed = (c.status || '').toLowerCase() === 'confirmed' || c.payment_status === 'SUCCESSFUL';
                      const isRejected = (c.status || '').toLowerCase() === 'rejected';
                      const isPending = !isConfirmed && !isRejected;

                      return (
                        <tr key={c.id} style={tableRowStyles}>
                          <td style={tableCellStyles}>
                            <div>
                              <strong>{c.user_name || c.user_email || 'Buyer'}</strong>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                Goal: {c.goal_reference || c.product_name || (c.goal_id ? c.goal_id.slice(0, 8) : 'N/A')}
                              </div>
                            </div>
                          </td>
                          <td style={{ ...tableCellStyles, fontWeight: 800, fontSize: '13px' }}>
                            {formatCurrency(c.amount)}
                          </td>
                          <td style={tableCellStyles}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff7a00' }}>
                              {c.transfer_reference || c.payment_reference || c.id.slice(0, 8)}
                            </span>
                          </td>
                          <td style={tableCellStyles}>
                            <div>
                              <strong>{c.bank_name_snapshot || 'Save2Own Bank'}</strong>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                {c.account_number_snapshot || '2039485712'}
                              </div>
                            </div>
                          </td>
                          <td style={tableCellStyles}>
                            {new Date(c.submitted_at || c.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td style={tableCellStyles}>
                            <span style={contribStatusBadgeStyles(c.status || c.payment_status || 'submitted')}>
                              {c.status || 'SUBMITTED'}
                            </span>
                          </td>
                          <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContribForAction(c);
                                  setShowDetailsModal(true);
                                }}
                                style={inspectBtnStyles}
                              >
                                👁️ View
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedContribForAction(c);
                                      setShowConfirmModal(true);
                                    }}
                                    style={confirmBtnStyles}
                                  >
                                    ✓ Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedContribForAction(c);
                                      setShowRejectModal(true);
                                    }}
                                    style={rejectBtnStyles}
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalContribPages > 1 && (
                <div style={paginationStyles}>
                  <button
                    type="button"
                    disabled={contribPage <= 1}
                    onClick={() => setContribPage((p) => p - 1)}
                    style={pageBtnStyles}
                  >
                    &larr; Prev
                  </button>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Page {contribPage} of {totalContribPages}
                  </span>
                  <button
                    type="button"
                    disabled={contribPage >= totalContribPages}
                    onClick={() => setContribPage((p) => p + 1)}
                    style={pageBtnStyles}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================
          MODAL: Confirm Contribution Payment
          ======================================================== */}
      {showConfirmModal && selectedContribForAction && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Confirm Save2Own Deposit</h3>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '13px', color: '#065f46', marginBottom: '4px' }}>
                Amount to Confirm: <strong>{formatCurrency(selectedContribForAction.amount)}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                Transfer Ref: <strong>{selectedContribForAction.transfer_reference}</strong>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
              By confirming, you verify that funds have been received in the Save2Own bank account (<strong>{selectedContribForAction.bank_name_snapshot || 'Save2Own Account'}</strong>). The customer's authoritative Save2Own balance will immediately increase by <strong>{formatCurrency(selectedContribForAction.amount)}</strong>.
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={modalLabelStyles}>Internal Verification Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Bank statement matched line #482"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                style={modalInputStyles}
              />
            </div>

            <div style={modalActionsStyles}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedContribForAction(null);
                }}
                disabled={isActionPending}
                style={modalCancelBtnStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmContribution}
                disabled={isActionPending}
                style={modalConfirmSubmitBtnStyles}
              >
                {isActionPending ? 'Verifying...' : 'Confirm & Credit Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Reject Contribution Payment
          ======================================================== */}
      {showRejectModal && selectedContribForAction && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={{ ...modalTitleStyles, color: '#dc2626' }}>Reject Save2Own Deposit</h3>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '4px' }}>
                Amount: <strong>{formatCurrency(selectedContribForAction.amount)}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                Transfer Ref: <strong>{selectedContribForAction.transfer_reference}</strong>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
              Rejecting this contribution will ensure the customer's balance is NOT increased. Please provide a reason to inform the user.
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={modalLabelStyles}>Rejection Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Funds not received in bank statement, invalid transfer narration code..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ ...modalInputStyles, height: '80px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={modalActionsStyles}>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedContribForAction(null);
                }}
                disabled={isActionPending}
                style={modalCancelBtnStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectContribution}
                disabled={isActionPending}
                style={modalDangerSubmitBtnStyles}
              >
                {isActionPending ? 'Rejecting...' : 'Reject Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: View Contribution Details & Snapshot
          ======================================================== */}
      {showDetailsModal && selectedContribForAction && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ ...modalTitleStyles, margin: 0 }}>Contribution Audit Details</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedContribForAction(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Amount</span>
                <strong style={{ fontSize: '16px', color: '#111827' }}>
                  {formatCurrency(selectedContribForAction.amount)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Status</span>
                <span style={contribStatusBadgeStyles(selectedContribForAction.status)}>
                  {selectedContribForAction.status?.toUpperCase() || 'SUBMITTED'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Transfer Reference</span>
                <strong style={{ fontSize: '13px', color: '#ff7a00', fontFamily: 'monospace' }}>
                  {selectedContribForAction.transfer_reference || 'N/A'}
                </strong>
              </div>

              {/* Historical Bank Account Snapshot */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Bank Account Snapshot at Time of Contribution
                </span>
                <div style={{ fontSize: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Bank Name: <strong>{selectedContribForAction.bank_name_snapshot || 'Save2Own Account'}</strong></div>
                  <div>Account Name: <strong>{selectedContribForAction.account_name_snapshot || 'Dovi Save2Own Savings Trust'}</strong></div>
                  <div>Account Number: <strong>{selectedContribForAction.account_number_snapshot || '2039485712'}</strong></div>
                </div>
              </div>

              {selectedContribForAction.rejection_reason && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                    Rejection Reason
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#111827' }}>
                    {selectedContribForAction.rejection_reason}
                  </p>
                </div>
              )}

              {selectedContribForAction.payment_proof_path && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Payment Proof Receipt
                  </span>
                  <a
                    href={selectedContribForAction.payment_proof_path}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#ff7a00', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Open Full Receipt File / Image &rarr;
                  </a>
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                <div>Submitted: {new Date(selectedContribForAction.submitted_at || selectedContribForAction.created_at).toLocaleString()}</div>
                {selectedContribForAction.verified_at && (
                  <div>Verified: {new Date(selectedContribForAction.verified_at).toLocaleString()} by {selectedContribForAction.verified_by || 'Admin'}</div>
                )}
              </div>
            </div>

            <div style={modalActionsStyles}>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedContribForAction(null);
                }}
                style={modalSubmitBtnStyles}
              >
                Close Details
              </button>
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
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};


const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};



const complianceNoticeStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '13px',
  color: '#1e40af',
  lineHeight: 1.4,
};

const tabContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: '2px',
};

const tabBtnStyles = (active: boolean): React.CSSProperties => ({
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: active ? 800 : 600,
  color: active ? '#ff7a00' : '#4b5563',
  backgroundColor: active ? '#ffffff' : 'transparent',
  border: 'none',
  borderBottom: active ? '3px solid #ff7a00' : '3px solid transparent',
  marginBottom: '-3px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 150ms ease',
});

const pendingCounterBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '9999px',
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  minWidth: '260px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const searchBtnStyles: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
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
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
  color: '#1f2937',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
  fontWeight: 700,
  color: '#4b5563',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tableCellStyles: React.CSSProperties = {
  padding: '12px 16px',
  color: '#1f2937',
};

const productRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const productImgStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  objectFit: 'cover',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
};

const productNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#111827',
};

const productSKUStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#6b7280',
};

const productQtyStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const progressBgStyles: React.CSSProperties = {
  width: '100%',
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '9999px',
  overflow: 'hidden',
};

const progressFillStyles: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#10b981',
  borderRadius: '9999px',
};

const inspectBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

const confirmBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
};

const rejectBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
};

const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  switch (status) {
    case 'ACTIVE':
      backgroundColor = '#d1fae5';
      color = '#065f46';
      break;
    case 'COMPLETED':
      backgroundColor = '#d1fae5';
      color = '#047857';
      break;
    case 'PAUSED':
      backgroundColor = '#fef3c7';
      color = '#92400e';
      break;
    case 'PRICE_CHANGED':
    case 'PAYMENT_REVIEW':
      backgroundColor = '#ffedd5';
      color = '#c2410c';
      break;
    case 'CANCELLED':
    case 'SUSPENDED':
      backgroundColor = '#fee2e2';
      color = '#991b1b';
      break;
  }

  return {
    backgroundColor,
    color,
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  };
};

const contribStatusBadgeStyles = (status: string): React.CSSProperties => {
  const s = (status || '').toLowerCase();
  let backgroundColor = '#fef3c7';
  let color = '#92400e';

  if (s === 'confirmed' || s === 'successful') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (s === 'rejected' || s === 'failed') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  } else if (s === 'under_review') {
    backgroundColor = '#e0f2fe';
    color = '#0369a1';
  }

  return {
    backgroundColor,
    color,
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  };
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderTop: '1px solid #e5e7eb',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
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
  zIndex: 999,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 16px 0',
};

const modalLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const modalInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '9999px',
  border: 'none',
  backgroundColor: '#1f2937',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
};

const modalConfirmSubmitBtnStyles: React.CSSProperties = {
  ...modalSubmitBtnStyles,
  backgroundColor: '#10b981',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  ...modalSubmitBtnStyles,
  backgroundColor: '#ef4444',
};
