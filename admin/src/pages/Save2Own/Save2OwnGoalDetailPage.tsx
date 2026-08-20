import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    return (
      <div style={containerStyles}>
        <button type="button" onClick={() => navigate('/save2own')} style={backBtnStyles}>
          ← Back to Goals List
        </button>
        <ApiErrorMessage error={error} />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header bar */}
      <div style={headerRowStyles}>
        <div>
          <button type="button" onClick={() => navigate('/save2own')} style={backBtnStyles}>
            ← Back to Goals
          </button>
          <h2 style={goalTitleStyles}>
            Save2Own Audit — {goal.product.name}
          </h2>
          <span style={goalIdStyles}>Internal ID: {goal.id}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={statusBadgeStyles(goal.status)}>{goal.status.replace('_', ' ')}</span>
          {goal.status !== 'SUSPENDED' && goal.status !== 'CANCELLED' && goal.status !== 'COMPLETED' && (
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
                <span style={widgetValueStyles}>{formatCurrency(goal.target_amount)}</span>
              </div>
              <div style={widgetStyles}>
                <span style={widgetLabelStyles}>Total Contributed</span>
                <span style={{ ...widgetValueStyles, color: '#10b981' }}>{formatCurrency(goal.total_contributed)}</span>
              </div>
              <div style={widgetStyles}>
                <span style={widgetLabelStyles}>Remaining Balance</span>
                <span style={{ ...widgetValueStyles, color: '#ff7a00' }}>{formatCurrency(goal.remaining_amount)}</span>
              </div>
            </div>

            {/* Progress track */}
            <div style={{ marginTop: '8px' }}>
              <div style={progressLabelRowStyles}>
                <span style={progressTextStyles}>Target Goal Progress</span>
                <span style={progressPercentStyles}>{(goal.progress_percentage || 0).toFixed(1)}%</span>
              </div>
              <div style={progressBarContainerStyles}>
                <div
                  style={{
                    ...progressBarFillStyles,
                    width: `${Math.min(goal.progress_percentage || 0, 100)}%`,
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
                src={goal.product.primary_image_url || '/logo.jpg?v=2'}
                alt={goal.product.name}
                style={productImgStyles}
                onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={productNameStyles}>{goal.product.name}</h4>
                {goal.variant && <span style={productVariantStyles}>Variant: {goal.variant.name}</span>}
                <div style={productSpecsGridStyles}>
                  <div style={specItemStyles}>
                    <span style={specLabelStyles}>Quantity:</span>
                    <span style={specValueStyles}>{goal.quantity} items</span>
                  </div>
                  <div style={specItemStyles}>
                    <span style={specLabelStyles}>Vendor:</span>
                    <span style={specValueStyles}>{goal.product.vendor.name}</span>
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
            <h3 style={cardTitleStyles}>Contribution Payment Timeline (Immutable)</h3>
            {goal.contributions && goal.contributions.length > 0 ? (
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Deposit Ref</th>
                      <th style={tableHeaderCellStyles}>Amount</th>
                      <th style={tableHeaderCellStyles}>Gateway Ref</th>
                      <th style={tableHeaderCellStyles}>Date</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goal.contributions.map((c) => (
                      <tr key={c.id} style={tableRowStyles}>
                        <td style={{ ...tableCellStyles, fontWeight: 700 }}>{c.id.substring(0, 8)}</td>
                        <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(c.amount)}</td>
                        <td style={tableCellStyles}>{c.payment_reference || 'N/A'}</td>
                        <td style={tableCellStyles}>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={tableCellStyles}>
                          <span style={paymentStatusBadgeStyles(c.payment_status)}>{c.payment_status}</span>
                        </td>
                      </tr>
                    ))}
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
            {goal.product_changes && goal.product_changes.length > 0 ? (
              <div style={historyWrapperStyles}>
                {goal.product_changes.map((change) => (
                  <div key={change.id} style={historyItemStyles}>
                    <div style={historyDotStyles} />
                    <div style={{ flex: 1 }}>
                      <span style={historyDateStyles}>
                        {new Date(change.changed_at).toLocaleString()}
                      </span>
                      <div style={historyContentStyles}>
                        <div>
                          <span style={historyLabelStyles}>Product Target updated:</span>
                          <p style={historyTextStyles}>
                            Old Product: <strong>{change.old_product.name}</strong> ➔ New Product: <strong>{change.new_product.name}</strong>
                          </p>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <span style={historyLabelStyles}>Target Goal Value shifted:</span>
                          <p style={historyTextStyles}>
                            Old Target: <strong>{formatCurrency(change.old_target)}</strong> ➔ New Target: <strong>{formatCurrency(change.new_target)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={emptyLabelStyles}>No targets or targeted product updates logged.</p>
            )}
          </div>
        </div>
      </div>

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
  if (status === 'SUCCESSFUL') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  }
  return {
    backgroundColor,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 700,
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
