import { getCustomerPaymentStatusInfo, getCustomerFulfillmentStatusInfo } from '@/utils/orderStatus';
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders';
import { paymentsApi } from '@/api/payments';
import type { PaymentAccount } from '@/types';
import { deliveryApi } from '@/api/delivery';
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_ORDER,
  PARCEL_CLASSIFICATION_LABELS,
} from '@/services/deliveryPricingService';
import type {
  Order,
  DeliveryGroup,
  DeliveryStatus,
  OrderShipment,
  ShipmentFulfillmentStatus,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

const TIMELINE_KEY_STEPS: ShipmentFulfillmentStatus[] = [
  'ORDER_PLACED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const STATUS_DESCRIPTIONS: Record<string, string> = {
  ORDER_PLACED: 'Your order has been placed and received by our team.',
  PROCESSING: 'Your order is being sourced and prepared.',
  READY_FOR_DISPATCH: 'Your order is packed and ready for dispatch.',
  DISPATCHED: 'Your order has been dispatched and is on its way.',
  OUT_FOR_DELIVERY: 'Your order is out for final delivery to your address.',
  DELIVERED: 'Your order has been delivered.',
  CANCELLED: 'This order has been cancelled.',
};


const NIGERIAN_BANKS = [
  'Zenith Bank',
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay Digital Services',
  'PalmPay',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank',
  'Fidelity Bank',
  'Union Bank',
  'Other Bank',
];

export default function OrderDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [bankAccount, setBankAccount] = useState<PaymentAccount | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitBank, setResubmitBank] = useState('Zenith Bank');
  const [customBank, setCustomBank] = useState('');
  const [resubmitAccountName, setResubmitAccountName] = useState('');
  const [resubmitRef, setResubmitRef] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitReceiptFile, setResubmitReceiptFile] = useState<File | null>(null);
  const [resubmitReceiptPreview, setResubmitReceiptPreview] = useState<string | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    paymentsApi.getActiveAccount('marketplace').then(setBankAccount).catch(() => {});
  }, []);

  const handleCopyAccount = () => {
    if (!bankAccount?.account_number) return;
    navigator.clipboard.writeText(bankAccount.account_number);
    setIsCopied(true);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
    setResubmitReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setResubmitReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const finalBank = resubmitBank === 'Other Bank' ? customBank.trim() : resubmitBank;
    if (!finalBank) {
      toast.error('Please specify your bank name.');
      return;
    }
    if (!resubmitAccountName.trim()) {
      toast.error('Please enter the sender account name.');
      return;
    }
    if (!resubmitReceiptPreview && !resubmitRef.trim()) {
      toast.error('Please upload a transfer receipt or enter transaction reference.');
      return;
    }

    setIsSubmittingEvidence(true);
    try {
      let proofUrl = resubmitReceiptPreview || undefined;
      if (resubmitReceiptFile) {
        try {
          const uploadRes = await paymentsApi.uploadReceipt(resubmitReceiptFile, order.reference);
          if (uploadRes && uploadRes.receipt_url) {
            proofUrl = uploadRes.receipt_url;
          }
        } catch (uploadErr) {
          console.warn('Receipt upload fallback:', uploadErr);
        }
      }

      await paymentsApi.submitPaymentEvidence({
        order_reference: order.reference,
        sender_bank: finalBank,
        sender_account_name: resubmitAccountName.trim(),
        transaction_reference: resubmitRef.trim(),
        amount: String(order.total),
        payment_proof_url: proofUrl,
        notes: resubmitNotes.trim() || undefined,
      });

      toast.success('Bank transfer evidence submitted successfully! Our team is verifying your payment.');
      setShowResubmitModal(false);
      setResubmitReceiptPreview(null);
      setResubmitNotes('');
      await fetchOrder();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment evidence.');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };


  const fetchOrder = useCallback(async () => {
    if (!ref) return;
    setIsLoading(true);
    try {
      const data = await ordersApi.getByRef(ref);
      setOrder(data);
    } catch {
      setError('Order not found.');
    } finally {
      setIsLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!ref) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.cancel(ref);
      setOrder(updated);
      toast.success('Order cancelled successfully.');
    } catch {
      toast.error('Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!ref) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.confirmReceipt(ref);
      setOrder(updated);
      toast.success('Receipt confirmed!');
    } catch {
      toast.error('Failed to confirm receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmGroupDelivery = async (groupId: string) => {
    setActionLoading(true);
    try {
      await deliveryApi.confirmDelivery(groupId);
      toast.success('Delivery confirmed for group!');
      fetchOrder();
    } catch {
      toast.error('Failed to confirm delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondToManualQuote = async (shipmentId: string, accept: boolean) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.respondToDeliveryQuote(
        order.id || order.reference,
        shipmentId,
        accept
      );
      setOrder(updated);
      if (accept) {
        toast.success(
          'Delivery quotation accepted! Your order is now confirmed for payment and direct delivery.'
        );
      } else {
        toast('Delivery quotation declined.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to respond to delivery quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Manual Quote Pending';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Manual Quote Pending';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        
      <div className="checkout-layout-grid">
          <Skeleton width="100%" height="400px" borderRadius="var(--radius-lg)" />
          <Skeleton width="100%" height="280px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <h2 style={headingStyles}>Order Not Found</h2>
          <p style={subTextStyles}>{error}</p>
          <Link to="/dashboard/orders" style={primaryBtnStyles}>View All Orders</Link>
        </div>
      </div>
    );
  }

  const shipments: OrderShipment[] = order.shipments || [];
  const hasDirectShipments = shipments.length > 0;
  const hasDeliveryGroups = order.delivery_groups && order.delivery_groups.length > 0;
  const quotedShipments = shipments.filter(
    (s) => s.manual_quote_status === 'QUOTED_AWAITING_CUSTOMER'
  );
  const pendingQuoteShipments = shipments.filter(
    (s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE'
  );

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <div>
          <Link to="/dashboard/orders" style={backLinkStyles}>← My Orders</Link>
          <h1 style={titleStyles}>Order #{order.reference}</h1>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Delivery: <strong>Direct Destination Delivery</strong> · Shipments:{' '}
            <strong>
              {shipments.length || 1}{' '}
              {shipments.length <= 1 ? 'Consolidated Shipment' : 'Separate Shipments'}
            </strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(() => {
            const fulfillInfo = getCustomerFulfillmentStatusInfo(order.fulfillment_status, order.status);
            const payInfo = getCustomerPaymentStatusInfo(order.payment_status);
            return (
              <>
                <span
                  style={{
                    backgroundColor: fulfillInfo.bg,
                    color: fulfillInfo.text,
                    border: `1px solid ${fulfillInfo.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                  }}
                >
                  Order Status: {fulfillInfo.label}
                </span>
                <span
                  style={{
                    backgroundColor: payInfo.bg,
                    color: payInfo.text,
                    border: `1px solid ${payInfo.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                  }}
                >
                  Payment Status: {payInfo.label}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* MANUAL DELIVERY QUOTATION BANNERS (Section 8) */}
      {pendingQuoteShipments.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            color: '#92400e',
          }}
        >
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
            ⏳ Awaiting Delivery Fee Confirmation from DOVI
          </strong>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
            Your order includes a route or bulky item requiring a custom transport quotation from our logistics desk. As soon as the administrator confirms your exact delivery fee, you will be notified here to review and approve it before payment and dispatch proceed.
          </p>
        </div>
      )}

      {quotedShipments.map((qs) => (
        <div
          key={qs.id}
          style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '2px 8px',
                borderRadius: '999px',
                marginBottom: '6px',
              }}
            >
              ACTION REQUIRED: DELIVERY QUOTATION READY
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
              Review & Confirm Your Delivery Quotation for {qs.shipment_reference}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
              Our logistics team has confirmed the transport arrangement ({qs.transport_arrangement}) to {qs.destination_city}, {qs.destination_state}.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bfdbfe',
              fontSize: '13px',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Product Subtotal: </span>
              <strong>{formatCurrency(order.subtotal)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Confirmed Delivery Fee: </span>
              <strong style={{ color: '#2563eb' }}>{formatCurrency(qs.delivery_fee)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Updated Total Payable: </span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>
                {formatCurrency(parseFloat(order.subtotal || '0') + (qs.delivery_fee ?? 0))}
              </strong>
            </div>
          </div>

          {qs.delivery_notes && (
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <strong>Logistics Notes:</strong> {qs.delivery_notes}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleRespondToManualQuote(qs.id, true)}
              style={{
                ...primaryBtnStyles,
                backgroundColor: '#16a34a',
                padding: '10px 20px',
                fontSize: '13px',
              }}
            >
              {actionLoading
                ? 'Processing...'
                : `✓ Accept Delivery Fee (${formatCurrency(qs.delivery_fee)}) & Proceed`}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleRespondToManualQuote(qs.id, false)}
              style={{
                ...dangerBtnStyles,
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              Decline Quotation
            </button>
          </div>
        </div>
      ))}

{/* BANK TRANSFER PAYMENT VERIFICATION STATUS & RESUBMISSION */}
      {(() => {
        const payment = (order as any).payment_evidence;
        const pStatus = ((order as any).payment_status || 'PENDING_PAYMENT').toUpperCase();
        const isPaid = pStatus === 'PAID' || pStatus === 'VERIFIED';
        const isPendingVerification = pStatus === 'PENDING_VERIFICATION';
        const isRejected = pStatus === 'REJECTED';

        if (isPendingVerification) {
          return (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '2px solid #3b82f6',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      marginBottom: '6px',
                    }}
                  >
                    ⏳ PAYMENT UNDER VERIFICATION
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
                    Bank Transfer Proof Received — Admin Verification in Progress
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                    We have received your payment evidence. Our finance desk is cross-checking the transfer with our bank account. Verification is usually completed within 15–30 minutes during normal operating hours. Your order will move into processing immediately upon confirmation.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Order Total</span>
                  <strong style={{ fontSize: '14px', color: '#1e293b' }}>{formatCurrency(order.total)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Sender Bank</span>
                  <strong style={{ color: '#1e293b' }}>{payment?.sender_bank || 'Bank Transfer'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Sender Account Name</span>
                  <strong style={{ color: '#1e293b' }}>{payment?.sender_account_name || 'Customer'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Transaction Reference</span>
                  <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>{payment?.transaction_reference || 'N/A'}</span>
                </div>
              </div>

              {payment?.payment_proof_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <img
                    src={payment.payment_proof_url}
                    alt="Receipt thumbnail"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    onClick={() => setZoomedReceiptUrl(payment.payment_proof_url)}
                  />
                  <button
                    type="button"
                    onClick={() => setZoomedReceiptUrl(payment.payment_proof_url)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#2563eb',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    🔍 View Uploaded Receipt
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (isPaid) {
          return (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '2px solid #10b981',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  ✓ PAYMENT CONFIRMED &amp; VERIFIED
                </span>
                <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
                  Order Fulfillment: <strong>{SHIPMENT_STATUS_LABELS[order.status as ShipmentFulfillmentStatus] || order.status}</strong>
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                Bank Transfer Payment Verified
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
                Your bank transfer payment of <strong>{formatCurrency(order.total)}</strong> has been verified and confirmed by DOVI. Your order is safely recorded, and product preparation and direct destination delivery are actively in progress.
              </p>
            </div>
          );
        }

        if (isRejected) {
          return (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    marginBottom: '6px',
                  }}
                >
                  ✕ PAYMENT VERIFICATION UNSUCCESSFUL
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>
                  Bank Transfer Could Not Be Verified
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
                  The administrator reviewed your transfer proof but was unable to verify the transaction in DOVI accounts.
                </p>
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: '#7f1d1d',
                  }}
                >
                  <strong>Reason:</strong> {payment?.rejection_reason || 'Payment was not found in DOVI bank account'}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(true)}
                  style={{
                    ...primaryBtnStyles,
                    backgroundColor: '#dc2626',
                    padding: '10px 22px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ↻ Resubmit Payment Proof
                </button>
              </div>
            </div>
          );
        }

        // PENDING_PAYMENT
        return (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '2px solid #f59e0b',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  marginBottom: '6px',
                }}
              >
                💳 AWAITING BANK TRANSFER PAYMENT
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                Complete Your Order via Direct Bank Transfer
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
                Please transfer exactly <strong>{formatCurrency(order.total)}</strong> to the official DOVI account below and submit your payment proof to begin fulfillment.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>BANK NAME</span>
                <strong style={{ color: '#1e293b' }}>{bankAccount?.bank_name || 'Zenith Bank'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>ACCOUNT NAME</span>
                <strong style={{ color: '#1e293b' }}>{bankAccount?.account_name || 'Dovi Direct Commerce Limited'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>ACCOUNT NUMBER</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '16px', fontFamily: 'monospace', color: '#047857' }}>
                    {bankAccount?.account_number || '5601660874'}
                  </strong>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: isCopied ? '#10b981' : '#f1f5f9',
                      color: isCopied ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowResubmitModal(true)}
                style={{
                  ...primaryBtnStyles,
                  backgroundColor: '#d97706',
                  padding: '10px 22px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📤 Upload & Submit Transfer Receipt
              </button>
            </div>
          </div>
        );
      })()}

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* DIRECT DELIVERY CONSOLIDATED SHIPMENTS VIEW (Section 9) */}
          {hasDirectShipments ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                  {shipments.length === 1
                    ? 'Consolidated Delivery Progress'
                    : `Shipments Breakdown (${shipments.length} Shipments for direct delivery)`}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {shipments.length === 1
                    ? 'All products in your order are consolidated into a single shipment to your destination.'
                    : 'Your order requires separate transport arrangements. Track the status of each shipment below — your order is marked Delivered only when all shipments have arrived.'}
                </p>
              </div>

              {shipments.map((shipment, idx) => {
                const currentRank = SHIPMENT_STATUS_ORDER.indexOf(shipment.status);
                return (
                  <div key={shipment.id || idx} style={groupCardStyles}>
                    <div style={groupHeaderStyles}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                            {shipments.length === 1
                              ? `Consolidated Shipment (${shipment.shipment_reference})`
                              : `Shipment #${idx + 1} of ${shipments.length} (${shipment.shipment_reference})`}
                          </strong>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: '#ffedd5',
                              color: '#9a3412',
                            }}
                          >
                            {PARCEL_CLASSIFICATION_LABELS[shipment.shipment_classification]}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Route: <strong>Direct Delivery</strong> &rarr;{' '}
                          <strong>
                            {shipment.destination_city}, {shipment.destination_state}
                          </strong>{' '}
                          · Transport: <strong>{shipment.transport_arrangement}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 'var(--font-bold)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: statusColor(shipment.status).bg,
                            color: statusColor(shipment.status).text,
                          }}
                        >
                          {SHIPMENT_STATUS_LABELS[shipment.status] || shipment.status}
                        </span>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                          Delivery Fee:{' '}
                          {shipment.requires_manual_quote && shipment.delivery_fee === null
                            ? 'Manual Quote Pending'
                            : formatCurrency(shipment.delivery_fee)}
                        </div>
                      </div>
                    </div>

                    {/* Visual Delivery Fulfillment Progress Timeline */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: '#fcfcfd',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#475569',
                            textTransform: 'uppercase',
                          }}
                        >
                          Delivery Fulfillment Progress
                        </div>
                        {STATUS_DESCRIPTIONS[shipment.status] && (
                          <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                            {STATUS_DESCRIPTIONS[shipment.status]}
                          </div>
                        )}
                      </div>

                      {shipment.status === 'CANCELLED' || order.status === 'CANCELLED' ? (
                        <div
                          style={{
                            padding: '14px 16px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#991b1b',
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>
                            ✕ Order Cancelled
                          </strong>
                          <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                            This order has been cancelled and is no longer active for fulfillment.
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                            gap: '8px',
                          }}
                        >
                          {TIMELINE_KEY_STEPS.map((stepStatus, stepIdx) => {
                            const stepRank = SHIPMENT_STATUS_ORDER.indexOf(stepStatus);
                            const isCompleted = currentRank >= stepRank;
                            const isCurrent = shipment.status === stepStatus;
                            return (
                              <div
                                key={stepStatus}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: `1px solid ${
                                    isCurrent
                                      ? 'var(--color-primary)'
                                      : isCompleted
                                      ? '#bbf7d0'
                                      : '#e2e8f0'
                                  }`,
                                  backgroundColor: isCurrent
                                    ? '#fff7ed'
                                    : isCompleted
                                    ? '#f0fdf4'
                                    : '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: isCurrent || isCompleted ? 700 : 500,
                                  color: isCurrent
                                    ? '#9a3412'
                                    : isCompleted
                                    ? '#166534'
                                    : '#94a3b8',
                                  textAlign: 'center',
                                }}
                              >
                                <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                                  {isCompleted ? '✓ Step ' + (stepIdx + 1) : 'Step ' + (stepIdx + 1)}
                                </div>
                                <div>{SHIPMENT_STATUS_LABELS[stepStatus]}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Shipment Items */}
                    <div
                      style={{
                        padding: 'var(--space-4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Items Included in Shipment ({shipment.items.length})
                      </div>
                      {shipment.items.map((item) => (
                        <div key={item.id} style={itemRowStyles}>
                          <img
                            src={item.image_url || '/logo.jpg?v=2'}
                            alt={item.product_name}
                            style={itemImgStyles}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <Link to={`/products/${item.product_id}`} style={itemNameStyles}>
                              {item.product_name}
                            </Link>
                            {item.variant_name && <p style={itemSubStyles}>{item.variant_name}</p>}
                            <p style={itemSubStyles}>
                              Qty: {item.quantity} × {formatCurrency(item.unit_price)} ·{' '}
                              {PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#475569',
                                  fontWeight: 600,
                                }}
                              >
                                {PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]}
                              </span>
                            </div>
                          </div>
                          <span style={itemPriceStyles}>
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipment Footer Details */}
                    <div
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--color-bg-subtle)',
                        borderTop: '1px dashed var(--color-border)',
                        fontSize: 'var(--text-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {shipment.separation_reason && (
                        <div>
                          <strong>Consolidation / Grouping Note:</strong> {shipment.separation_reason}
                        </div>
                      )}
                      {shipment.tracking_reference && (
                        <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                          Waybill / Tracking Reference: {shipment.tracking_reference}
                        </div>
                      )}
                      {shipment.delivery_notes && (
                        <div style={{ color: 'var(--color-text-muted)' }}>
                          Notes: {shipment.delivery_notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : hasDeliveryGroups ? (
            /* Legacy Multi-Vendor Delivery Groups Fallback */
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Fulfillment & Delivery Groups
              </h2>

              {order.delivery_groups!.map((group: DeliveryGroup, idx: number) => (
                <div key={group.id || idx} style={groupCardStyles}>
                  <div style={groupHeaderStyles}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        GROUP #{idx + 1}: {group.vendor?.name || 'DOVI Fulfillment'}
                      </strong>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'var(--font-bold)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: deliveryStatusColor(group.status).bg,
                        color: deliveryStatusColor(group.status).text,
                      }}
                    >
                      {group.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {group.items.map((item) => (
                      <div key={item.id} style={itemRowStyles}>
                        <img
                          src={item.product.primary_image_url || '/logo.jpg?v=2'}
                          alt={item.product.name}
                          style={itemImgStyles}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                        />
                        <div style={{ flex: 1 }}>
                          <Link to={`/products/${item.product.id}`} style={itemNameStyles}>
                            {item.product.name}
                          </Link>
                          {item.variant && <p style={itemSubStyles}>{item.variant.name}</p>}
                          <p style={itemSubStyles}>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                        <span style={itemPriceStyles}>{formatCurrency(item.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  {group.status === 'DELIVERED' && (
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px dashed var(--color-border)' }}>
                      <button
                        onClick={() => handleConfirmGroupDelivery(group.id)}
                        disabled={actionLoading}
                        style={primaryBtnStyles}
                      >
                        {actionLoading ? 'Confirming...' : 'Confirm Delivery Receipt'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          ) : (
            /* Legacy Order Items View */
            <section style={sectionStyles}>
              <h3 style={sectionTitleStyles}>Order Items</h3>
              {order.items.map((item) => (
                <div key={item.id} style={itemRowStyles}>
                  <img
                    src={item.product.primary_image_url || '/logo.jpg?v=2'}
                    alt={item.product.name}
                    style={itemImgStyles}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <Link to={`/products/${item.product.id}`} style={itemNameStyles}>
                      {item.product.name}
                    </Link>
                    {item.variant && <p style={itemSubStyles}>{item.variant.name}</p>}
                    <p style={itemSubStyles}>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <span style={itemPriceStyles}>{formatCurrency(item.line_total)}</span>
                </div>
              ))}
            </section>
          )}

          {/* Delivery Destination Card */}
          {(order.delivery_address || shipments[0]) && (
            <section style={sectionStyles}>
              <h3 style={sectionTitleStyles}>Delivery Destination</h3>
              <p style={addrTextStyles}>
                {order.delivery_address?.full_name || shipments[0]?.recipient_name || 'Customer'}
                <br />
                {order.delivery_address?.phone || shipments[0]?.recipient_phone || ''}
                <br />
                {order.delivery_address?.address_line_1 || shipments[0]?.destination_address}
                {order.delivery_address?.address_line_2
                  ? `, ${order.delivery_address.address_line_2}`
                  : ''}
                <br />
                {order.delivery_address?.city || shipments[0]?.destination_city},{' '}
                {order.delivery_address?.state || shipments[0]?.destination_state}
              </p>
            </section>
          )}
        </div>

        {/* Summary Sidebar */}
        <div style={sidebarStyles}>
          <div style={summaryCardStyles}>
            <h3 style={summaryTitleStyles}>Order & Delivery Summary</h3>

            <div style={summaryRowStyles}>
              <span>Product Subtotal</span>
              <span style={summaryValStyles}>{formatCurrency(order.subtotal)}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Shipment Count</span>
              <span style={summaryValStyles}>
                {shipments.length || 1} {shipments.length <= 1 ? 'Shipment' : 'Shipments'}
              </span>
            </div>

            {shipments.length > 1 &&
              shipments.map((s, idx) => (
                <div key={s.id} style={{ ...summaryRowStyles, color: 'var(--color-text-muted)' }}>
                  <span>Shipment #{idx + 1} Delivery:</span>
                  <span>
                    {s.requires_manual_quote && s.delivery_fee === null
                      ? 'Manual Quote'
                      : formatCurrency(s.delivery_fee)}
                  </span>
                </div>
              ))}

            <div style={summaryRowStyles}>
              <span>Total Delivery Fee</span>
              <span style={summaryValStyles}>
                {pendingQuoteShipments.length > 0
                  ? 'Pending Confirmation'
                  : formatCurrency(order.delivery_fee)}
              </span>
            </div>

            <hr style={dividerStyles} />

            <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                {pendingQuoteShipments.length > 0
                  ? `${formatCurrency(order.subtotal)} + Quote`
                  : formatCurrency(order.total)}
              </span>
            </div>

            <div style={summaryRowStyles}>
              <span>Fulfillment Status</span>
              <span style={summaryValStyles}>
                {SHIPMENT_STATUS_LABELS[order.status as ShipmentFulfillmentStatus] ||
                  order.status}
              </span>
            </div>

            <div style={summaryRowStyles}>
              <span>Payment Status</span>
              <span style={summaryValStyles}>{getCustomerPaymentStatusInfo(order.payment_status).label}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Placed on</span>
              <span style={summaryValStyles}>
                {new Date(order.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Overall Actions */}
          <div style={actionsCardStyles}>
            {String(order.status) === 'DELIVERY_FEE_CONFIRMED' && (
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                style={primaryBtnStyles}
              >
                Proceed to Payment
              </button>
            )}

            {order.can_cancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                style={dangerBtnStyles}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {order.can_confirm_receipt && (
              <button
                onClick={handleConfirmReceipt}
                disabled={actionLoading}
                style={primaryBtnStyles}
              >
                {actionLoading ? 'Confirming...' : 'Confirm Receipt'}
              </button>
            )}

            {order.can_request_refund && (
              <Link
                to={`/dashboard/refunds?order=${order.reference}`}
                style={{ ...secondaryBtnStyles, textAlign: 'center' }}
              >
                Request Refund
              </Link>
            )}

            {order.can_review && (
              <Link
                to={`/dashboard/reviews?order=${order.reference}`}
                style={{ ...secondaryBtnStyles, textAlign: 'center' }}
              >
                Write Review
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Resubmit / Upload Payment Proof Modal */}
      {showResubmitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowResubmitModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
                Submit Bank Transfer Evidence
              </h3>
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Enter the bank transfer details and attach your transaction receipt so our accounts team can verify and approve your order.
            </p>

            <form onSubmit={handleSubmitPaymentEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Your Bank (Sender Bank)
                </label>
                <select
                  value={resubmitBank}
                  onChange={(e) => setResubmitBank(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                  }}
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {resubmitBank === 'Other Bank' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Specify Bank Name
                  </label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Enter bank name"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Sender Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={resubmitAccountName}
                  onChange={(e) => setResubmitAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Transaction Reference / Narration
                </label>
                <input
                  type="text"
                  value={resubmitRef}
                  onChange={(e) => setResubmitRef(e.target.value)}
                  placeholder="e.g. ORD-XXXXX or Bank Session ID"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Upload Transfer Receipt / Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                    fontSize: '12px',
                  }}
                />
                {resubmitReceiptPreview && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img
                      src={resubmitReceiptPreview}
                      alt="Receipt preview"
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Any helpful note for our accounts desk..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  disabled={isSubmittingEvidence}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {isSubmittingEvidence ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom Receipt Modal */}
      {zoomedReceiptUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setZoomedReceiptUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedReceiptUrl}
              alt="Payment receipt full view"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <a
                href={zoomedReceiptUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Open Original in New Tab
              </a>
              <button
                type="button"
                onClick={() => setZoomedReceiptUrl(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
function statusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
    case 'COMPLETED':
    case 'RECEIVED':
    case 'DELIVERY_FEE_CONFIRMED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUND_REQUESTED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
    case 'REFUND_REVIEW':
    case 'AWAITING_DELIVERY_CONFIRMATION':
    case 'SOURCING_PRODUCTS':
    case 'AWAITING_PRODUCTS_AT_HUB':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    case 'SHIPPED':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'OUT_FOR_DELIVERY':
    case 'PACKAGED':
    case 'READY_FOR_DISPATCH':
      return { bg: 'rgba(255, 122, 0, 0.12)', text: 'var(--color-primary)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

function deliveryStatusColor(status: DeliveryStatus | string) {
  switch (status) {
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_DELIVERY':
    case 'IN_TRANSIT':
      return { bg: 'rgba(255, 122, 0, 0.12)', text: 'var(--color-primary)' };
    case 'PICKED_UP':
    case 'DELIVERED':
    case 'COMPLETED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'FAILED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

// Styles
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontWeight: 'var(--font-medium)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginTop: 'var(--space-1)',
  marginBottom: 0,
};

const centerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-12)',
  textAlign: 'center',
};

const headingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const subTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const mainColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const sectionStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: '0 0 var(--space-4)',
};

const groupCardStyles: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
};

const groupHeaderStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  background: 'var(--color-bg-subtle)',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '8px',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
};

const itemImgStyles: React.CSSProperties = {
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
};

const itemNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const itemSubStyles: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const addrTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
};

const sidebarStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const summaryCardStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: '4px 0',
};

const actionsCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-medium)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const dangerBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};

// removed unused paymentBadgeStyle
