import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Payment, PaymentSession, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { exportTransactionsToPdf, exportTransactionsToDocx } from '@/utils/exportUtils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'payments' | 'sessions'>('payments');

  // 60-Minute Payment Sessions State
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionStatusFilter, setSessionStatusFilter] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  // Row Selection State for Exporting
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());

  // Selected Payment for Review Modal
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [paymentToReject, setPaymentToReject] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment not received in DOVI bank account');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Receipt image zoom modal
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);

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
      setTotalPages(Math.ceil((res.count || 1) / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load payments.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await adminApi.listPaymentSessions({
        status: sessionStatusFilter || undefined,
        search: sessionSearch || undefined,
      });
      setSessions(data);
    } catch (err: any) {
      console.error('Failed to load payment sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, sessionStatusFilter, sessionSearch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (val: string, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  const formatRemainingTime = (expiresAt: string, currentNow: number) => {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - currentNow) / 1000));
    if (diff <= 0) return '00:00 (Expired)';
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  const handleReviewSessionPayment = (session: PaymentSession) => {
    const match = payments.find(
      (p) =>
        (p.order_reference && p.order_reference === session.order_reference) ||
        (p.id && (p.id === session.payment_evidence_id || p.id === session.id))
    );
    if (match) {
      setSelectedPayment(match);
    } else {
      setSelectedPayment({
        id: session.payment_evidence_id || session.id,
        order_reference: session.order_reference,
        amount: session.amount,
        currency: session.currency || 'NGN',
        status: (session.payment_verification_status || (session.status === 'EVIDENCE_SUBMITTED' ? 'PENDING_VERIFICATION' : session.status)) as any,
        created_at: session.evidence_submitted_at || session.created_at,
        payment_method: 'MANUAL_BANK_TRANSFER',
      } as any);
    }
  };

  const handleApprovePayment = async (payment: Payment) => {
    if (!window.confirm(`Approve payment of ${formatCurrency(payment.amount, payment.currency)} for order ${payment.order_reference}?`)) {
      return;
    }

    setIsProcessingAction(true);
    try {
      await adminApi.verifyPayment(payment.id || payment.order_reference || '');
      toast.success(`Payment for order ${payment.order_reference} approved! Order updated to Processing.`);
      if (selectedPayment?.id === payment.id) {
        setSelectedPayment(null);
      }
      await fetchPayments(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenRejectModal = (payment: Payment) => {
    setPaymentToReject(payment);
    setRejectionReason('Payment not received in DOVI bank account');
    setCustomRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!paymentToReject) return;
    const finalReason = rejectionReason === 'Other' ? customRejectionReason.trim() : rejectionReason;
    if (!finalReason) {
      toast.error('Please specify a rejection reason.');
      return;
    }

    setIsProcessingAction(true);
    try {
      await adminApi.rejectPayment(paymentToReject.id || paymentToReject.order_reference || '', {
        rejection_reason: finalReason,
      });
      toast.success(`Payment rejected for order ${paymentToReject.order_reference}.`);
      setShowRejectModal(false);
      setPaymentToReject(null);
      if (selectedPayment?.id === paymentToReject.id) {
        setSelectedPayment(null);
      }
      await fetchPayments(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject payment.');
    } finally {
      setIsProcessingAction(false);
    }
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

  const pendingCount = payments.filter(
    (p) => (p.status || '').toUpperCase() === 'PENDING_VERIFICATION' || (p.status || '').toUpperCase() === 'PENDING'
  ).length;

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={titleHeaderStyles}>
          <h2 style={titleStyles}>Payment Verification Console</h2>
        </div>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={titleHeaderStyles}>
          <div>
            <h2 style={titleStyles}>Payment Verification Console</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Verify customer manual bank transfers, inspect payment receipts, approve or reject transactions.
            </p>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {selectedPaymentIds.size > 0 && (
            <>
              <button type="button" onClick={handleExportSelectedDocx} style={exportBtnStyles}>
                📄 Export Selected ({selectedPaymentIds.size}) DOCX
              </button>
              <button type="button" onClick={handleExportSelectedPdf} style={exportBtnStyles}>
                📕 Export Selected ({selectedPaymentIds.size}) PDF
              </button>
            </>
          )}
          <button type="button" onClick={handleExportAllDocx} style={secondaryExportBtnStyles}>
            📥 Export All DOCX
          </button>
          <button type="button" onClick={handleExportAllPdf} style={secondaryExportBtnStyles}>
            📥 Export All PDF
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* View Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'payments' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'payments' ? 800 : 600,
            color: activeTab === 'payments' ? '#ff7a00' : '#4b5563',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>💳 Payment Submissions & Receipts</span>
          {pendingCount > 0 && (
            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'sessions' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'sessions' ? 800 : 600,
            color: activeTab === 'sessions' ? '#ff7a00' : '#4b5563',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⏱️ 60-Minute Payment Sessions</span>
          {sessions.filter((s) => s.status === 'ACTIVE').length > 0 && (
            <span style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              {sessions.filter((s) => s.status === 'ACTIVE').length} Active
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: PAYMENT SUBMISSIONS & EVIDENCE
          ======================================================== */}
      {activeTab === 'payments' && (
        <>
          {/* Filter / Status Tabs */}
          <div style={filterBarStyles}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
            style={{
              ...tabButtonStyles,
              backgroundColor: statusFilter === '' ? 'var(--color-primary, #ff7a00)' : '#f3f4f6',
              color: statusFilter === '' ? '#ffffff' : '#374151',
              fontWeight: statusFilter === '' ? 700 : 500,
            }}
          >
            All Submissions
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('PENDING_VERIFICATION');
              setPage(1);
            }}
            style={{
              ...tabButtonStyles,
              backgroundColor: statusFilter === 'PENDING_VERIFICATION' ? '#f59e0b' : '#f3f4f6',
              color: statusFilter === 'PENDING_VERIFICATION' ? '#ffffff' : '#374151',
              fontWeight: statusFilter === 'PENDING_VERIFICATION' ? 700 : 500,
            }}
          >
            Pending Verification {pendingCount > 0 && `(${pendingCount})`}
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('VERIFIED');
              setPage(1);
            }}
            style={{
              ...tabButtonStyles,
              backgroundColor: statusFilter === 'VERIFIED' ? '#10b981' : '#f3f4f6',
              color: statusFilter === 'VERIFIED' ? '#ffffff' : '#374151',
              fontWeight: statusFilter === 'VERIFIED' ? 700 : 500,
            }}
          >
            Verified / Approved
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('REJECTED');
              setPage(1);
            }}
            style={{
              ...tabButtonStyles,
              backgroundColor: statusFilter === 'REJECTED' ? '#ef4444' : '#f3f4f6',
              color: statusFilter === 'REJECTED' ? '#ffffff' : '#374151',
              fontWeight: statusFilter === 'REJECTED' ? 700 : 500,
            }}
          >
            Rejected
          </button>
        </div>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Detailed Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="VERIFIED">Verified / Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUCCESSFUL">Legacy Successful</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Verification Notice */}
      <div style={infoAlertStyles}>
        💳 <strong>Manual Bank Transfer Verification:</strong> DOVI operates strictly on verified bank transfers. When a customer submits their payment receipt, compare it against your bank statement before approving. Approving a payment will immediately advance the customer&apos;s order to Processing.
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No Payments Found"
          subtitle="Try adjusting your status filter."
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
                  <th style={tableHeaderCellStyles}>Sender Bank &amp; Name</th>
                  <th style={tableHeaderCellStyles}>Amount</th>
                  <th style={tableHeaderCellStyles}>Receipt</th>
                  <th style={tableHeaderCellStyles}>Date Submitted</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isPending =
                    (p.status || '').toUpperCase() === 'PENDING_VERIFICATION' ||
                    (p.status || '').toUpperCase() === 'PENDING';

                  return (
                    <tr key={p.id} style={tableRowStyles}>
                      <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedPaymentIds.has(p.id)}
                          onChange={() => handleToggleSelectPayment(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                        {p.reference || p.payment_reference || p.id}
                      </td>
                      <td style={tableCellStyles}>
                        <a
                          href={`/orders?ref=${p.order_reference}`}
                          style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                        >
                          {p.order_reference}
                        </a>
                      </td>
                      <td style={tableCellStyles}>
                        <div style={{ fontWeight: 600 }}>{p.sender_bank || 'Bank Transfer'}</div>
                        {p.sender_account_name && (
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {p.sender_account_name}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td style={tableCellStyles}>
                        {p.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => setZoomedReceiptUrl(p.payment_proof_url || null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <img
                              src={p.payment_proof_url}
                              alt="Receipt"
                              style={{
                                width: '36px',
                                height: '36px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                              }}
                            />
                            <span style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'underline' }}>
                              View
                            </span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>No file</span>
                        )}
                      </td>
                      <td style={tableCellStyles}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={tableCellStyles}>
                        <span style={statusBadgeStyles(p.status)}>{p.status}</span>
                      </td>
                      <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            style={viewBtnStyles}
                          >
                            Review
                          </button>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(p)}
                                disabled={isProcessingAction}
                                style={{
                                  ...actionBtnStyles,
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(p)}
                                disabled={isProcessingAction}
                                style={{
                                  ...actionBtnStyles,
                                  backgroundColor: '#ef4444',
                                  color: '#ffffff',
                                }}
                              >
                                Reject
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
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>
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
        </>
      )}

      {/* ========================================================
          TAB 2: 60-MINUTE PAYMENT SESSIONS CONSOLE
          ======================================================== */}
      {activeTab === 'sessions' && (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Total Sessions</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '4px' }}>{sessions.length}</div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '16px', border: '1px solid #a7f3d0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Active Window (60m)</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
                {sessions.filter((s) => s.status === 'ACTIVE').length}
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', borderRadius: '10px', padding: '16px', border: '1px solid #bfdbfe', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Evidence Submitted</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                {sessions.filter((s) => s.status === 'EVIDENCE_SUBMITTED').length}
              </div>
            </div>

            <div style={{ backgroundColor: '#fef2f2', borderRadius: '10px', padding: '16px', border: '1px solid #fecaca', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Expired (Unsubmitted)</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                {sessions.filter((s) => s.status === 'EXPIRED').length}
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div style={{ ...infoAlertStyles, backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e3a8a', marginBottom: '16px' }}>
            ⏱️ <strong>Strict 60-Minute Payment Expiry Policy:</strong> Customers are allocated exactly 60 minutes to transfer funds and submit payment proof. If proof is submitted before the session expires, the payment is locked as <strong>Evidence Submitted</strong> and remains permanently verifiable by administrators even after the countdown expires. Unsubmitted sessions automatically expire and must be renewed by the customer to obtain a fresh session.
          </div>

          {/* Sessions Filter Bar */}
          <div style={filterBarStyles}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Sessions', value: '' },
                { label: 'Active Countdown', value: 'ACTIVE' },
                { label: 'Evidence Submitted', value: 'EVIDENCE_SUBMITTED' },
                { label: 'Expired', value: 'EXPIRED' },
                { label: 'Closed / Verified', value: 'CLOSED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSessionStatusFilter(tab.value)}
                  style={{
                    ...tabButtonStyles,
                    backgroundColor: sessionStatusFilter === tab.value ? '#ff7a00' : '#f3f4f6',
                    color: sessionStatusFilter === tab.value ? '#ffffff' : '#374151',
                    fontWeight: sessionStatusFilter === tab.value ? 700 : 500,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search order ref, customer, email..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                style={{
                  ...selectStyles,
                  minWidth: '220px',
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
              />
              <button
                type="button"
                onClick={fetchSessions}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Sessions Table */}
          {isLoadingSessions ? (
            <Skeleton width="100%" height="260px" borderRadius="12px" />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="⏱️"
              title="No Payment Sessions Found"
              subtitle="No payment sessions match the selected filter."
            />
          ) : (
            <div style={tableCardStyles}>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Order Reference</th>
                      <th style={tableHeaderCellStyles}>Customer</th>
                      <th style={tableHeaderCellStyles}>Amount</th>
                      <th style={tableHeaderCellStyles}>Session Window &amp; Countdown</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                      <th style={tableHeaderCellStyles}>Evidence Submission</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const expTime = new Date(s.expires_at).getTime();
                      const isExpired = s.status === 'EXPIRED' || (s.status === 'ACTIVE' && expTime <= now);
                      const hasSubmittedEvidence = s.status === 'EVIDENCE_SUBMITTED' || Boolean(s.evidence_submitted_at);

                      return (
                        <tr key={s.id} style={tableRowStyles}>
                          <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{s.order_reference}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(s.order_reference);
                                  toast.success(`Copied ${s.order_reference}`);
                                }}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  background: '#f9fafb',
                                  cursor: 'pointer',
                                }}
                              >
                                Copy
                              </button>
                            </div>
                            <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>
                              {s.id}
                            </span>
                          </td>
                          <td style={tableCellStyles}>
                            <div style={{ fontWeight: 600 }}>{s.customer_name || 'Customer'}</div>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.customer_email || '—'}</span>
                          </td>
                          <td style={{ ...tableCellStyles, fontWeight: 700, color: '#111827' }}>
                            {formatCurrency(s.amount, s.currency)}
                          </td>
                          <td style={tableCellStyles}>
                            {s.status === 'ACTIVE' && !isExpired ? (
                              <div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#d1fae5',
                                  color: '#065f46',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                }}>
                                  ⏱️ {formatRemainingTime(s.expires_at, now)}
                                </span>
                                <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                                  Expires {new Date(s.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : hasSubmittedEvidence ? (
                              <div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                }}>
                                  🛡️ Submitted In Window
                                </span>
                                <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                  {s.evidence_submitted_at ? new Date(s.evidence_submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified on time'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                }}>
                                  ⌛ Expired ({new Date(s.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={tableCellStyles}>
                            <span style={sessionStatusBadgeStyles(isExpired && s.status === 'ACTIVE' ? 'EXPIRED' : s.status)}>
                              {isExpired && s.status === 'ACTIVE' ? 'EXPIRED' : s.status}
                            </span>
                          </td>
                          <td style={tableCellStyles}>
                            {hasSubmittedEvidence ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Receipt Attached</span>
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                  ({s.payment_verification_status || 'PENDING'})
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>No evidence uploaded</span>
                            )}
                          </td>
                          <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {hasSubmittedEvidence ? (
                                <button
                                  type="button"
                                  onClick={() => handleReviewSessionPayment(s)}
                                  style={{
                                    ...viewBtnStyles,
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 700,
                                  }}
                                >
                                  Review &amp; Verify
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(s.order_reference);
                                    toast.success(`Copied ${s.order_reference}`);
                                  }}
                                  style={viewBtnStyles}
                                >
                                  Copy Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review / Inspect Payment Modal */}
      {selectedPayment && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '600px' }}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Review Payment Submission</h3>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                style={closeBtnStyles}
              >
                &times;
              </button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Order Reference</span>
                <span style={detailValueStyles}>
                  <a
                    href={`/orders?ref=${selectedPayment.order_reference}`}
                    style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                  >
                    {selectedPayment.order_reference}
                  </a>
                </span>
              </div>

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Payment Reference</span>
                <span style={detailValueStyles}>
                  {selectedPayment.reference || selectedPayment.payment_reference || selectedPayment.id}
                </span>
              </div>

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Amount Payable</span>
                <span style={{ ...detailValueStyles, fontSize: '16px', color: '#0f172a' }}>
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </span>
              </div>

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Sender Bank</span>
                <span style={detailValueStyles}>
                  {selectedPayment.sender_bank || 'Manual Bank Transfer'}
                </span>
              </div>

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Sender Account Name</span>
                <span style={detailValueStyles}>
                  {selectedPayment.sender_account_name || 'Not provided'}
                </span>
              </div>

              {selectedPayment.transaction_reference && (
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Transaction Narration / ID</span>
                  <span style={detailValueStyles}>{selectedPayment.transaction_reference}</span>
                </div>
              )}

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Submission Date</span>
                <span style={detailValueStyles}>
                  {new Date(selectedPayment.created_at).toLocaleString()}
                </span>
              </div>

              <div style={{ ...detailItemStyles, border: 'none' }}>
                <span style={detailLabelStyles}>Current Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedPayment.status)}>
                    {selectedPayment.status}
                  </span>
                </span>
              </div>

              {selectedPayment.rejection_reason && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#991b1b',
                    fontSize: '13px',
                  }}
                >
                  <strong>Rejection Reason:</strong> {selectedPayment.rejection_reason}
                </div>
              )}

              {/* Receipt Preview */}
              {selectedPayment.payment_proof_url ? (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Uploaded Payment Receipt:
                  </span>
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedPayment.payment_proof_url}
                      alt="Uploaded Receipt"
                      style={{
                        maxHeight: '260px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                      }}
                      onClick={() => setZoomedReceiptUrl(selectedPayment.payment_proof_url || null)}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      (Click image to zoom full screen)
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  No payment receipt image uploaded.
                </div>
              )}
            </div>

            <div style={modalActionsStyles}>
              {((selectedPayment.status || '').toUpperCase() === 'PENDING_VERIFICATION' ||
                (selectedPayment.status || '').toUpperCase() === 'PENDING') ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenRejectModal(selectedPayment)}
                    disabled={isProcessingAction}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reject Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovePayment(selectedPayment)}
                    disabled={isProcessingAction}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Approve Payment
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  style={modalCloseBtnStyles}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && paymentToReject && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '460px' }}>
            <div style={modalHeaderStyles}>
              <h3 style={{ ...modalTitleStyles, color: '#dc2626' }}>Reject Payment</h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={closeBtnStyles}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Select the reason why the payment for order <strong>{paymentToReject.order_reference}</strong> is being rejected. This reason will be displayed to the customer so they can resolve the issue and submit a new receipt.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                Rejection Reason:
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              >
                <option value="Payment not received in DOVI bank account">
                  Payment not received in DOVI bank account
                </option>
                <option value="Amount transferred is less than required order total">
                  Amount transferred is less than required order total
                </option>
                <option value="Receipt image is blurry, cropped, or illegible">
                  Receipt image is blurry, cropped, or illegible
                </option>
                <option value="Sender name does not match transaction record">
                  Sender name does not match transaction record
                </option>
                <option value="Duplicate or fraudulent transaction receipt">
                  Duplicate or fraudulent transaction receipt
                </option>
                <option value="Other">Other (custom explanation)</option>
              </select>

              {rejectionReason === 'Other' && (
                <textarea
                  rows={3}
                  placeholder="Specify detailed reason for rejection..."
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    resize: 'none',
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingAction}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Receipt Modal */}
      {zoomedReceiptUrl && (
        <div
          style={{ ...modalBackdropStyles, zIndex: 1000 }}
          onClick={() => setZoomedReceiptUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={zoomedReceiptUrl}
              alt="Receipt Full View"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            />
            <button
              type="button"
              onClick={() => setZoomedReceiptUrl(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status?: string): React.CSSProperties => {
  const s = (status || '').toUpperCase();
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  if (s === 'VERIFIED' || s === 'SUCCESS' || s === 'SUCCESSFUL') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (s === 'PENDING_VERIFICATION' || s === 'PENDING') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (s === 'REJECTED' || s === 'FAILED' || s === 'REFUNDED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  }

  return {
    backgroundColor,
    color,
    padding: '3px 8px',
    borderRadius: '4px',
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

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const tabButtonStyles: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
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
  padding: '14px var(--space-4)',
  color: '#374151',
};

const viewBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ff7a00',
  border: '1px solid rgba(255,122,0,0.25)',
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255,122,0,0.05)',
  cursor: 'pointer',
};

const actionBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  border: 'none',
  padding: '4px 10px',
  borderRadius: '6px',
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
  maxHeight: '90vh',
  overflowY: 'auto',
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

const modalCloseBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '8px 16px',
  borderRadius: '8px',
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

const sessionStatusBadgeStyles = (status: string): React.CSSProperties => {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') {
    return {
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 800,
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };
  }
  if (s === 'EVIDENCE_SUBMITTED') {
    return {
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 800,
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };
  }
  if (s === 'CLOSED' || s === 'VERIFIED') {
    return {
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 800,
      backgroundColor: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };
  }
  return {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 800,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };
};
