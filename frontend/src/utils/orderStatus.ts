export type CustomerPaymentStatus =
  | 'Awaiting Payment'
  | 'Pending Verification'
  | 'Payment Confirmed'
  | 'Payment Rejected'
  | 'Refund Pending'
  | 'Refunded';

export interface StatusBadgeConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getCustomerPaymentStatusInfo(paymentStatus?: string): StatusBadgeConfig {
  const s = (paymentStatus || 'AWAITING_PAYMENT').toUpperCase();
  switch (s) {
    case 'PAID':
    case 'VERIFIED':
    case 'PAYMENT_VERIFIED':
    case 'CONFIRMED':
    case 'PAYMENT_CONFIRMED':
    case 'SUCCESS':
    case 'SUCCESSFUL':
      return {
        label: 'Payment Confirmed',
        bg: '#ecfdf5',
        text: '#059669',
        border: '#a7f3d0',
      };
    case 'PENDING_VERIFICATION':
    case 'AWAITING_PAYMENT_VERIFICATION':
    case 'UNDER_VERIFICATION':
    case 'EVIDENCE_SUBMITTED':
      return {
        label: 'Pending Verification',
        bg: '#eff6ff',
        text: '#2563eb',
        border: '#bfdbfe',
      };
    case 'REJECTED':
    case 'PAYMENT_REJECTED':
    case 'FAILED':
      return {
        label: 'Payment Rejected',
        bg: '#fef2f2',
        text: '#dc2626',
        border: '#fecaca',
      };
    case 'REFUND_PENDING':
    case 'REFUND_QUEUED':
    case 'REFUND_INITIATED':
      return {
        label: 'Refund Pending',
        bg: '#fdf4ff',
        text: '#a21caf',
        border: '#f5d0fe',
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        bg: '#f1f5f9',
        text: '#475569',
        border: '#cbd5e1',
      };
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'AWAITING_PAYMENT':
    default:
      return {
        label: 'Awaiting Payment',
        bg: '#fffbeb',
        text: '#d97706',
        border: '#fde68a',
      };
  }
}

export function getCustomerFulfillmentStatusInfo(fulfillmentStatus?: string, orderStatus?: string): StatusBadgeConfig {
  let raw = (fulfillmentStatus || orderStatus || 'ORDER_PLACED').toUpperCase();
  if (raw === 'PENDING_PAYMENT' || raw === 'PENDING') {
    raw = 'ORDER_PLACED';
  }

  switch (raw) {
    case 'DELIVERED':
    case 'RECEIVED':
    case 'COMPLETED':
      return {
        label: 'Delivered',
        bg: '#ecfdf5',
        text: '#059669',
        border: '#a7f3d0',
      };
    case 'OUT_FOR_DELIVERY':
      return {
        label: 'Out for Delivery',
        bg: '#f0fdf4',
        text: '#16a34a',
        border: '#bbf7d0',
      };
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return {
        label: 'Dispatched',
        bg: '#f0f9ff',
        text: '#0284c7',
        border: '#bae6fd',
      };
    case 'READY_FOR_DISPATCH':
    case 'PACKAGED':
    case 'READY_FOR_PACKAGING':
      return {
        label: 'Ready for Dispatch',
        bg: '#fdf4ff',
        text: '#9333ea',
        border: '#f0abfc',
      };
    case 'PROCESSING':
    case 'SOURCING_PRODUCTS':
    case 'AWAITING_PRODUCTS_AT_HUB':
    case 'PRODUCTS_RECEIVED':
    case 'QUALITY_CHECK':
      return {
        label: 'Processing',
        bg: '#faf5ff',
        text: '#7c3aed',
        border: '#e9d5ff',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: '#fef2f2',
        text: '#dc2626',
        border: '#fecaca',
      };
    case 'AWAITING_DELIVERY':
      return {
        label: 'Awaiting Delivery',
        bg: '#eff6ff',
        text: '#1d4ed8',
        border: '#bfdbfe',
      };
    case 'ORDER_PLACED':
    default:
      return {
        label: 'Order Placed',
        bg: '#f8fafc',
        text: '#334155',
        border: '#cbd5e1',
      };
  }
}
