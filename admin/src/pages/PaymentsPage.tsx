import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Payment, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { exportTransactionsToPdf, exportTransactionsToDocx } from '@/utils/exportUtils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Row Selection State for Exporting
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());

  // Selected Payment (Inspect Only - Read-only details)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listPayments({
        page,
        status: statusFilter || undefined,
      });
      setPayments(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load payment logs.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const formatCurrency = (val: string, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  const handleToggleSelectAll = () => {
    if (selectedPaymentIds.size === payments.length && payments.length > 0) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(payments.map((p) => p.id)));
    }
  };

  const handleToggleSelectPayment = (id: string) => {
    const next = new Set(selectedPaymentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPaymentIds(next);
  };

  const handleExportSelectedDocx = () => {
    const targets = payments.filter((p) => selectedPaymentIds.has(p.id));
    if (targets.length === 0) {
      toast.error('Please select at least one transaction to export.');
      return;
    }
    exportTransactionsToDocx(targets, `dovi-selected-transactions-${targets.length}.docx`);
    toast.success(`Exported ${targets.length} selected transactions to DOCX`);
  };

  const handleExportSelectedPdf = () => {
    const targets = payments.filter((p) => selectedPaymentIds.has(p.id));
    if (targets.length === 0) {
      toast.error('Please select at least one transaction to export.');
      return;
    }
    exportTransactionsToPdf(targets, `dovi-selected-transactions-${targets.length}.pdf`);
    toast.success(`Exported ${targets.length} selected transactions to PDF`);
  };

  const handleExportAllDocx = () => {
    if (payments.length === 0) {
      toast.error('No transactions available to export.');
      return;
    }
    exportTransactionsToDocx(payments, `dovi-all-transactions-${payments.length}.docx`);
    toast.success(`Exported ${payments.length} transactions to DOCX`);
  };

  const handleExportAllPdf = () => {
    if (payments.length === 0) {
      toast.error('No transactions available to export.');
      return;
    }
    exportTransactionsToPdf(payments, `dovi-all-transactions-${payments.length}.pdf`);
    toast.success(`Exported ${payments.length} transactions to PDF`);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={titleHeaderStyles}>
          <h2 style={titleStyles}>Payment Monitoring</h2>
          <span style={viewOnlyBadgeStyles}>View-Only logs</span>
        </div>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={titleHeaderStyles}>
          <h2 style={titleStyles}>Payment Monitoring</h2>
          <span style={viewOnlyBadgeStyles}>Read-Only logs</span>
        </div>

        {/* Action Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {selectedPaymentIds.size > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportSelectedDocx}
                style={exportBtnStyles}
              >
                📄 Export Selected ({selectedPaymentIds.size}) DOCX
              </button>
              <button
                type="button"
                onClick={handleExportSelectedPdf}
                style={exportBtnStyles}
              >
                📕 Export Selected ({selectedPaymentIds.size}) PDF
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExportAllDocx}
            style={secondaryExportBtnStyles}
          >
            📥 Export All Transactions DOCX
          </button>
          <button
            type="button"
            onClick={handleExportAllPdf}
            style={secondaryExportBtnStyles}
          >
            📥 Export All Transactions PDF
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Payment Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Payments</option>
            <option value="PENDING">Pending Transaction</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Warning indicator */}
      <div style={infoAlertStyles}>
        🔒 <strong>Administrative Notice:</strong> This log is strictly for transaction reconciliation. Payment gateway statuses are pulled in real-time from OPay and Flutterwave integration webhooks. No manual manipulation is allowed.
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No Payments Logged"
          subtitle="Try adjusting your status filters."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={{ ...tableHeaderCellStyles, width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={payments.length > 0 && selectedPaymentIds.size === payments.length}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={tableHeaderCellStyles}>Payment Ref</th>
                  <th style={tableHeaderCellStyles}>Order Ref</th>
                  <th style={tableHeaderCellStyles}>Gateway Provider</th>
                  <th style={tableHeaderCellStyles}>Amount</th>
                  <th style={tableHeaderCellStyles}>Date Initiated</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedPaymentIds.has(p.id)}
                        onChange={() => handleToggleSelectPayment(p.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{p.reference}</td>
                    <td style={tableCellStyles}>
                      <a href={`/orders?ref=${p.order_reference}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        {p.order_reference}
                      </a>
                    </td>
                    <td style={tableCellStyles}>{p.provider}</td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(p.amount, p.currency)}</td>
                    <td style={tableCellStyles}>{new Date(p.created_at).toLocaleString()}</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(p.status)}>{p.status}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(p)}
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

      {/* Inspect Payment Modal (Strictly Read Only) */}
      {selectedPayment && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Transaction Reconciliation</h3>
              <button type="button" onClick={() => setSelectedPayment(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Internal Payment Ref</span>
                <span style={detailValueStyles}>{selectedPayment.reference}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Order Reference Link</span>
                <span style={detailValueStyles}>{selectedPayment.order_reference}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Gateway Provider</span>
                <span style={detailValueStyles}>{selectedPayment.provider}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>External Gateway Ref</span>
                <span style={detailValueStyles}>{selectedPayment.provider_reference || 'Pending/None'}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Total Amount Charged</span>
                <span style={detailValueStyles}>{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Initiation Timestamp</span>
                <span style={detailValueStyles}>{new Date(selectedPayment.created_at).toLocaleString()}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Gateway Verif Timestamp</span>
                <span style={detailValueStyles}>
                  {selectedPayment.verified_at ? new Date(selectedPayment.verified_at).toLocaleString() : 'Unverified'}
                </span>
              </div>
              <div style={{ ...detailItemStyles, border: 'none' }}>
                <span style={detailLabelStyles}>Current Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedPayment.status)}>{selectedPayment.status}</span>
                </span>
              </div>
            </div>

            <div style={modalActionsStyles}>
              <span style={readOnlyPromptStyles}>🔒 Log is locked and immutable</span>
              <button type="button" onClick={() => setSelectedPayment(null)} style={modalCloseBtnStyles}>
                Close Inspect
              </button>
            </div>
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

  if (status === 'SUCCESSFUL') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'FAILED' || status === 'REFUNDED') {
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

const titleHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const viewOnlyBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  padding: '4px 10px',
  borderRadius: '9999px',
  textTransform: 'uppercase',
  border: '1px solid #e5e7eb',
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

const infoAlertStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#4b5563',
  lineHeight: 1.5,
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
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '24px',
};

const readOnlyPromptStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  fontWeight: 600,
};

const modalCloseBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const exportBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.2)',
};

const secondaryExportBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
};
