import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnGoal, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function Save2OwnGoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<Save2OwnGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Suspension Modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  // Verification & Proof Modals
  const [confirmingContrib, setConfirmingContrib] = useState<any | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [rejectingContrib, setRejectingContrib] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchGoalDetails = async (showSkeleton = true) => {
    if (!id) return;
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getSave2OwnGoal(id);
      setGoal(data);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own goal details.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalDetails();
  }, [id]);

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingContrib) return;
    setIsVerifying(true);
    try {
      await adminApi.confirmSave2OwnContribution(confirmingContrib.id, confirmNotes);
      toast.success(`Contribution of ${formatCurrency(confirmingContrib.amount)} confirmed! User balance credited.`);
      setConfirmingContrib(null);
      setConfirmNotes('');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm contribution.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingContrib || !rejectionReason.trim()) return;
    setIsVerifying(true);
    try {
      await adminApi.rejectSave2OwnContribution(rejectingContrib.id, rejectionReason.trim());
      toast.error(`Contribution of ${formatCurrency(rejectingContrib.amount)} rejected.`);
      setRejectingContrib(null);
      setRejectionReason('');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject contribution.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !suspendReason.trim()) return;

    setIsActionPending(true);
    try {
      const updated = await adminApi.suspendSave2OwnGoal(id, suspendReason);
      toast.success('Save2Own goal suspended successfully.');
      setGoal(updated);
      setShowSuspendModal(false);
      setSuspendReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend goal.');
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

  const renderHistoryValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>;
    }
    if (typeof val !== 'object') {
      return <span>{String(val)}</span>;
    }
    const entries = Object.entries(val);
    if (entries.length === 0) {
      return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>;
    }
    return (
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
        {entries.map(([k, v]) => (
          <span
            key={k}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>
              {k.replace(/_/g, ' ')}:
            </span>
            <strong style={{ color: '#111827' }}>
              {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
            </strong>
          </span>
        ))}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <Skeleton width="120px" height="24px" />
        <div style={{ marginTop: '16px' }}>
          <Skeleton width="100%" height="220px" borderRadius="12px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          <Skeleton height="300px" borderRadius="12px" />
          <Skeleton height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    const displayError: APIError = error || {
      error: true,
      code: 'NOT_FOUND',
      message: 'Goal details could not be loaded.',
    };

    return (
      <div style={containerStyles}>
        <button type="button" onClick={() => navigate('/save2own')} style={backBtnStyles}>
          ← Back to Goals List
        </button>
        <ApiErrorMessage error={displayError} />
      </div>
    );
  }

  const g: any = goal;
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
  const remainingAmt =
    g.remaining_amount ||
    Math.max(0, parseFloat(String(targetAmt || '0')) - parseFloat(String(savedAmt || '0'))).toString();
  const rawProgress =
    g.progress_percent ??
    g.progress_percentage ??
    (parseFloat(String(targetAmt || '0')) > 0
      ? (parseFloat(String(savedAmt || '0')) / parseFloat(String(targetAmt || '0'))) * 100
      : 0);
  const progressPct = Number(rawProgress) || 0;
  const img = g.product?.primary_image_url || g.product_image || '/logo.jpg?v=2';

  return (
    <div style={containerStyles}>
      {/* Header bar */}
      <div style={headerRowStyles}>
        <div>
          <button type="button" onClick={() => navigate('/save2own')} style={backBtnStyles}>
            ← Back to Goals
          </button>
          <h2 style={goalTitleStyles}>
            Save2Own Audit — {prodName}
          </h2>
          <span style={goalIdStyles}>Internal ID: {g.reference_code || g.id}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={statusBadgeStyles(g.status)}>{(g.status || '').replace('_', ' ')}</span>
          {g.status !== 'SUSPENDED' && g.status !== 'CANCELLED' && g.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setShowSuspendModal(true)}
              style={suspendActionBtnStyles}
            >
              Suspend Goal
            </button>
          )}
        </div>
      </div>

      {/* Warning layout panel */}
      <div style={infoAlertStyles}>
        🔒 <strong>Administrative Control Policy:</strong> All financial progress, deposits, remaining amounts, and target specifications are strictly read-only and immutable. Actions are restricted to goal audits and account suspension.
      </div>

      {/* Core Grid: Left (Summary & Product) / Right (Timeline & logs) */}
      <div style={splitLayoutStyles}>
        {/* Left Column: Summary and Targeted Product details */}
        <div style={columnStyles}>
          {/* Financial Summary Card */}
          <div style={cardStyles}>
            <h3 style={cardTitleStyles}>Financial Target Summary</h3>
            <div style={financialWidgetsGridStyles}>
              <div style={widgetStyles}>
                <span style={widgetLabelStyles}>Total Goal Target</span>
                <span style={widgetValueStyles}>{formatCurrency(targetAmt)}</span>
              </div>
              <div style={widgetStyles}>
                <span style={widgetLabelStyles}>Total Contributed</span>
                <span style={{ ...widgetValueStyles, color: '#10b981' }}>{formatCurrency(savedAmt)}</span>
              </div>
              <div style={widgetStyles}>
                <span style={widgetLabelStyles}>Remaining Balance</span>
                <span style={{ ...widgetValueStyles, color: '#ff7a00' }}>{formatCurrency(remainingAmt)}</span>
              </div>
            </div>

            {/* Progress track */}
            <div style={{ marginTop: '8px' }}>
              <div style={progressLabelRowStyles}>
                <span style={progressTextStyles}>Target Goal Progress</span>
                <span style={progressPercentStyles}>{progressPct.toFixed(1)}%</span>
              </div>
              <div style={progressBarContainerStyles}>
                <div
                  style={{
                    ...progressBarFillStyles,
                    width: `${Math.min(progressPct, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Product Specifications Card */}
          <div style={cardStyles}>
            <h3 style={cardTitleStyles}>Current Target Product Specifications</h3>
            <div style={productDetailRowStyles}>
              <img
                src={img}
                alt={prodName}
                style={productImgStyles}
                onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={productNameStyles}>{prodName}</h4>
                {variantName && <span style={productVariantStyles}>Variant: {variantName}</span>}
                <div style={productSpecsGridStyles}>
                  <div style={specItemStyles}>
                    <span style={specLabelStyles}>Quantity:</span>
                    <span style={specValueStyles}>{g.quantity || 1} item{g.quantity !== 1 ? 's' : ''}</span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timelines & History Logs */}
        <div style={columnStyles}>
          {/* Timeline Table */}
          <div style={cardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ ...cardTitleStyles, margin: 0 }}>Bank Transfer & Contribution Timeline</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                  {g.contributions ? g.contributions.length : 0} Total Records
                </span>
                <Link to="/save2own/contributions" style={{ fontSize: '12px', color: '#ff7a00', textDecoration: 'none', fontWeight: 600 }}>
                  Verification Queue →
                </Link>
              </div>
            </div>
            {g.contributions && g.contributions.length > 0 ? (
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Transfer / Dep Ref</th>
                      <th style={tableHeaderCellStyles}>Amount</th>
                      <th style={tableHeaderCellStyles}>Target Bank Snapshot</th>
                      <th style={tableHeaderCellStyles}>Proof</th>
                      <th style={tableHeaderCellStyles}>Date</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.contributions.map((c: any) => {
                      const isPending =
                        c.status === 'pending_verification' ||
                        c.status === 'submitted' ||
                        c.status === 'under_review' ||
                        c.status === 'pending' ||
                        c.payment_status === 'PENDING';
                      const isConfirmed = c.status === 'confirmed' || c.status === 'CONFIRMED' || c.payment_status === 'SUCCESSFUL';
                      const proofUrl = c.payment_proof_path || c.payment_proof_url || c.payment_proof;
                      const refCode = c.transfer_reference || c.payment_reference || c.id;

                      return (
                        <tr key={c.id} style={tableRowStyles}>
                          <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#111827' }}>
                              {String(refCode || 'N/A').substring(0, 16)}
                            </span>
                          </td>
                          <td style={{ ...tableCellStyles, fontWeight: 800, color: '#111827' }}>
                            {formatCurrency(c.amount)}
                          </td>
                          <td style={tableCellStyles}>
                            {c.bank_name_snapshot || c.account_number_snapshot ? (
                              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{c.bank_name_snapshot || 'Save2Own Bank'}</span>
                                <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>
                                  {c.account_number_snapshot} {c.account_name_snapshot ? `(${c.account_name_snapshot})` : ''}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                                Primary Save2Own Account
                              </span>
                            )}
                          </td>
                          <td style={tableCellStyles}>
                            {proofUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingProof(proofUrl)}
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                              >
                                📎 View Receipt
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>No proof</span>
                            )}
                          </td>
                          <td style={tableCellStyles}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              {c.created_at || c.submitted_at
                                ? new Date(c.created_at || c.submitted_at).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </td>
                          <td style={tableCellStyles}>
                            <span style={paymentStatusBadgeStyles(c.status || c.payment_status || 'submitted')}>
                              {c.status || c.payment_status || 'submitted'}
                            </span>
                          </td>
                          <td style={{ ...tableCellStyles, textAlign: 'right' }}>
                            {isPending ? (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingContrib(c);
                                    setConfirmNotes('');
                                  }}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✓ Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingContrib(c);
                                    setRejectionReason('');
                                  }}
                                  style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : isConfirmed ? (
                              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                                Verified by Admin
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={emptyLabelStyles}>No contributions made yet.</p>
            )}
          </div>

          {/* Product and Price Shift History Logs */}
          <div style={cardStyles}>
            <h3 style={cardTitleStyles}>Save2Own Update Event Logs</h3>
            {g.history && g.history.length > 0 ? (
              <div style={historyWrapperStyles}>
                {g.history.map((h: any) => (
                  <div key={h.id} style={historyItemStyles}>
                    <div style={historyDotStyles} />
                    <div style={{ flex: 1 }}>
                      <span style={historyDateStyles}>
                        {h.created_at ? new Date(h.created_at).toLocaleString() : 'N/A'}
                      </span>
                      <div style={historyContentStyles}>
                        <div>
                          <span style={historyLabelStyles}>Event: {String(h.event_type || 'UPDATE')}</span>
                          <div style={{ ...historyTextStyles, display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Previous:</span>
                              {renderHistoryValue(h.previous_value)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>New:</span>
                              {renderHistoryValue(h.new_value)}
                            </div>
                          </div>
                          {h.reason && (
                            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              <strong>Reason:</strong> {String(h.reason)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={emptyLabelStyles}>No history events logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingContrib && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Confirm Save2Own Bank Deposit</h3>
            <form onSubmit={handleConfirmSubmit} style={formStyles}>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to verify and confirm this transfer of{' '}
                <strong style={{ color: '#059669' }}>{formatCurrency(confirmingContrib.amount)}</strong>?
              </p>

              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Ref:</strong> {confirmingContrib.transfer_reference || confirmingContrib.payment_reference || confirmingContrib.id}</div>
                <div><strong>Destination Account:</strong> {confirmingContrib.bank_name_snapshot || 'Save2Own Account'} ({confirmingContrib.account_number_snapshot || 'N/A'})</div>
              </div>

              <div>
                <label style={modalLabelStyles}>Internal Verification Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bank statement narration matched reference..."
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                />
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => setConfirmingContrib(null)}
                  style={modalCancelBtnStyles}
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{ ...modalDangerSubmitBtnStyles, backgroundColor: '#10b981' }}
                >
                  {isVerifying ? 'Confirming...' : 'Yes, Confirm & Credit User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingContrib && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Reject Save2Own Bank Deposit</h3>
            <form onSubmit={handleRejectSubmit} style={formStyles}>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                You are rejecting a reported deposit of{' '}
                <strong style={{ color: '#dc2626' }}>{formatCurrency(rejectingContrib.amount)}</strong>.
                The customer's Save2Own progress will NOT be increased.
              </p>

              <div>
                <label style={modalLabelStyles}>Rejection Reason *</label>
                <textarea
                  required
                  placeholder="Explain why the payment was rejected (e.g. Funds not received in Save2Own bank account, invalid proof, incorrect amount)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={textareaStyles}
                  rows={3}
                />
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => setRejectingContrib(null)}
                  style={modalCancelBtnStyles}
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !rejectionReason.trim()}
                  style={modalDangerSubmitBtnStyles}
                >
                  {isVerifying ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {viewingProof && (
        <div style={modalBackdropStyles} onClick={() => setViewingProof(null)}>
          <div
            style={{ ...modalContentStyles, maxWidth: '560px', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3 style={modalTitleStyles}>Payment Transfer Proof</h3>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>
            <div style={{ width: '100%', maxHeight: '400px', overflowY: 'auto', display: 'flex', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <img
                src={viewingProof}
                alt="Payment proof receipt"
                style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '6px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).alt = 'Document attached: ' + viewingProof;
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" onClick={() => setViewingProof(null)} style={modalCancelBtnStyles}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Reason Modal */}
      {showSuspendModal && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Confirm Goal Suspension</h3>
            <form onSubmit={handleSuspendSubmit} style={formStyles}>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                You are about to suspend this Save2Own goal. The buyer will be notified and all upcoming deposit auto-billing rotations will be paused.
              </p>
              <div>
                <label style={modalLabelStyles}>Suspension Reason *</label>
                <textarea
                  required
                  placeholder="Specify violation, pricing shift validations, or user request notes..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  style={textareaStyles}
                  rows={4}
                />
              </div>
              <div style={modalActionsStyles}>
                <button type="button" onClick={() => setShowSuspendModal(false)} style={modalCancelBtnStyles}>
                  Cancel
                </button>
                <button type="submit" disabled={isActionPending} style={modalDangerSubmitBtnStyles}>
                  {isActionPending ? 'Suspending...' : 'Confirm Suspend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Payment Status badges
const paymentStatusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#fee2e2';
  let color = '#991b1b';
  const norm = (status || '').toLowerCase();

  if (norm === 'confirmed' || norm === 'successful' || norm === 'completed') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (
    norm === 'pending_verification' ||
    norm === 'submitted' ||
    norm === 'under_review' ||
    norm === 'pending'
  ) {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (norm === 'rejected' || norm === 'failed') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  } else if (norm === 'reversed' || norm === 'refunded') {
    backgroundColor = '#ede9fe';
    color = '#5b21b6';
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

// 10 States Badge Status Helpers
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
      backgroundColor = '#ffe4e6';
      color = '#be123c';
      break;
    case 'PRODUCT_UNAVAILABLE':
      backgroundColor = '#ffedd5';
      color = '#c2410c';
      break;
    case 'PAYMENT_REVIEW':
      backgroundColor = '#e0f2fe';
      color = '#0369a1';
      break;
    case 'REFUND_PENDING':
      backgroundColor = '#f3e8ff';
      color = '#6b21a8';
      break;
    case 'CANCELLED':
    case 'SUSPENDED':
      backgroundColor = '#fee2e2';
      color = '#991b1b';
      break;
    case 'DRAFT':
    default:
      backgroundColor = '#f3f4f6';
      color = '#374151';
      break;
  }

  return {
    backgroundColor,
    color,
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '11px',
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

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const backBtnStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#ff7a00',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  padding: 0,
  marginBottom: '8px',
  display: 'block',
};

const goalTitleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 850,
  color: '#1f2937',
  margin: 0,
};

const goalIdStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const suspendActionBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const infoAlertStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#4b5563',
  lineHeight: 1.5,
};

const splitLayoutStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
  alignItems: 'start',
};

const columnStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#374151',
  margin: 0,
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '10px',
};

const financialWidgetsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const widgetStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const widgetLabelStyles: React.CSSProperties = {
  fontSize: '10px',
  color: '#6b7280',
  fontWeight: 650,
  textTransform: 'uppercase',
};

const widgetValueStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#1f2937',
};

const progressLabelRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '6px',
};

const progressTextStyles: React.CSSProperties = {
  color: '#4b5563',
};

const progressPercentStyles: React.CSSProperties = {
  color: '#ff7a00',
  fontWeight: 700,
};

const progressBarContainerStyles: React.CSSProperties = {
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

const productDetailRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
};

const productImgStyles: React.CSSProperties = {
  width: '72px',
  height: '72px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const productNameStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const productVariantStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  display: 'block',
  marginTop: '2px',
};

const productSpecsGridStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginTop: '8px',
};

const specItemStyles: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  fontSize: '12px',
};

const specLabelStyles: React.CSSProperties = {
  color: '#6b7280',
};

const specValueStyles: React.CSSProperties = {
  fontWeight: 600,
  color: '#1f2937',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  maxHeight: '260px',
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
  padding: '10px 12px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '12px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '12px',
  color: '#374151',
};

const emptyLabelStyles: React.CSSProperties = {
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: '13px',
  margin: '24px 0',
};

const historyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxHeight: '260px',
  overflowY: 'auto',
  paddingLeft: '8px',
};

const historyItemStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  position: 'relative',
  borderLeft: '2px solid #e5e7eb',
  paddingLeft: '16px',
  paddingBottom: '8px',
};

const historyDotStyles: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#ff7a00',
  position: 'absolute',
  left: '-5px',
  top: '4px',
};

const historyDateStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  display: 'block',
  marginBottom: '4px',
};

const historyContentStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '10px',
  fontSize: '12px',
};

const historyLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#6b7280',
  fontWeight: 600,
};

const historyTextStyles: React.CSSProperties = {
  margin: '2px 0 0 0',
  color: '#1f2937',
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
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
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

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
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
