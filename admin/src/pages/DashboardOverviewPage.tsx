import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { AnalyticsOverviewResult, AnalyticsSourceStatus, AnalyticsRange } from '@/services/analyticsAggregator';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

type DashboardData = AnalyticsOverviewResult & {
  sources: AnalyticsSourceStatus[];
  discrepancies: string[];
};

const RANGES: Array<{ id: AnalyticsRange; label: string }> = [
  { id: 'TODAY', label: 'Today' },
  { id: '7D', label: 'Last 7 Days' },
  { id: '30D', label: 'Last 30 Days' },
  { id: 'ALL', label: 'All Time' },
];

export default function DashboardOverviewPage() {
  const [range, setRange] = useState<AnalyticsRange>('ALL');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchOverview = useCallback(async (selectedRange: AnalyticsRange, showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnalyticsOverview(selectedRange);
      setData(res);
      if (showToast) {
        toast.success('Analytics refreshed');
      }
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load dashboard analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(range);
  }, [range, fetchOverview]);

  const formatCurrency = (val: string | number | null | undefined) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val?.toString() || '0'));
  };

  if (isLoading && !data) {
    return (
      <div style={containerStyles}>
        <div style={headerRowStyles}>
          <h2 style={titleStyles}>Dashboard Overview</h2>
        </div>
        <div style={gridStyles}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="130px" borderRadius="12px" />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          <Skeleton height="320px" borderRadius="12px" />
          <Skeleton height="320px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Dashboard Overview</h2>
        <ApiErrorMessage error={error} />
        <button
          onClick={() => fetchOverview(range)}
          style={primaryButtonStyles}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const orders = data.orders || {
    total: 0,
    pending: 0,
    in_fulfilment: 0,
    completed: 0,
    cancelled: 0,
    refund_related: 0,
    other: 0,
    by_status: {},
  };

  const revenueLabel =
    range === 'TODAY'
      ? 'Revenue (Today)'
      : range === '7D'
      ? 'Revenue (7 Days)'
      : range === '30D'
      ? 'Revenue (30 Days)'
      : 'Revenue (Fulfilled)';

  const primaryCards = [
    {
      label: revenueLabel,
      value: formatCurrency(data.revenue?.range_total),
      sub: `Month: ${formatCurrency(data.revenue?.month)} · Today: ${formatCurrency(data.revenue?.today)}`,
      icon: '💰',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      href: '/orders',
    },
    {
      label: 'Orders',
      value: `${orders.total} Total`,
      sub: `${orders.in_fulfilment} in fulfilment · ${orders.completed} completed`,
      icon: '📦',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      href: '/orders',
    },
    {
      label: 'Save2Own Capital',
      value: formatCurrency(data.save2own?.confirmed_amount),
      sub: `${data.save2own?.active_goals ?? 0} active goals · ${formatCurrency(data.save2own?.pending_amount)} pending`,
      icon: '🎯',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      href: '/save2own',
    },
    {
      label: 'Registered Users',
      value: data.users?.total ?? 0,
      sub: `+${data.users?.new_today ?? 0} joined today (+${data.users?.new_in_range ?? 0} in range)`,
      icon: '👤',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      href: '/users',
    },
    {
      label: 'Vendors',
      value: data.vendors?.total ?? 0,
      sub: `${data.vendors?.pending ?? 0} pending review · ${data.vendors?.approved ?? 0} active`,
      icon: '🏢',
      color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      href: '/vendors',
    },
    {
      label: 'Products Catalog',
      value: data.products?.total ?? 0,
      sub: 'All marketplace listings',
      icon: '🏷️',
      color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      href: '/products',
    },
  ];

  const allWarnings = [
    ...(data.warnings || []),
    ...(data.discrepancies || []),
  ];

  return (
    <div style={containerStyles}>
      {/* Header with Title and Range Selector */}
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Dashboard Overview</h2>
          <p style={subtitleStyles}>
            Accurate, real-time activity and revenue synchronized with backend database records.
          </p>
        </div>

        <div style={controlsRowStyles}>
          <div style={rangeToggleGroupStyles}>
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                style={range === r.id ? activeRangeBtnStyles : inactiveRangeBtnStyles}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchOverview(range, true)}
            disabled={isRefreshing}
            style={refreshBtnStyles}
            title="Refresh analytics data"
          >
            {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Data Health / Warnings Notice */}
      {allWarnings.length > 0 && (
        <div style={warningNoticeStyles}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div style={{ flex: 1, fontSize: '12px', color: '#92400e' }}>
            <strong>Data Health Notice:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {allWarnings.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={gridStyles}>
        {primaryCards.map((c, i) => (
          <a
            key={i}
            href={c.href}
            style={widgetCardLinkStyles}
          >
            <div style={widgetInfoStyles}>
              <span style={widgetLabelStyles}>{c.label}</span>
              <span style={widgetValueStyles}>{c.value}</span>
              <span style={widgetSubStyles}>{c.sub}</span>
            </div>
            <div style={{ ...widgetIconStyles, background: c.color }}>{c.icon}</div>
          </a>
        ))}
      </div>

      {/* Order Status Lifecycle Breakdown */}
      <div style={cardStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={cardTitleStyles}>Order Lifecycle Breakdown ({orders.total} Total Orders)</h3>
          <a href="/orders" style={{ fontSize: '12px', color: '#ff7a00', fontWeight: 600, textDecoration: 'none' }}>
            View All in Orders →
          </a>
        </div>
        <div style={statusBreakdownGridStyles}>
          <div style={{ ...statusPillCardStyles, borderLeft: '4px solid #f59e0b' }}>
            <span style={statusPillLabelStyles}>Pending Payment</span>
            <span style={statusPillValueStyles}>{orders.pending}</span>
            <span style={statusPillHintStyles}>Unpaid checkout sessions</span>
          </div>
          <div style={{ ...statusPillCardStyles, borderLeft: '4px solid #3b82f6' }}>
            <span style={statusPillLabelStyles}>In Fulfilment</span>
            <span style={statusPillValueStyles}>{orders.in_fulfilment}</span>
            <span style={statusPillHintStyles}>Paid, processing or in transit</span>
          </div>
          <div style={{ ...statusPillCardStyles, borderLeft: '4px solid #10b981' }}>
            <span style={statusPillLabelStyles}>Completed / Delivered</span>
            <span style={statusPillValueStyles}>{orders.completed}</span>
            <span style={statusPillHintStyles}>Successfully received by buyer</span>
          </div>
          <div style={{ ...statusPillCardStyles, borderLeft: '4px solid #ef4444' }}>
            <span style={statusPillLabelStyles}>Cancelled / Refunded</span>
            <span style={statusPillValueStyles}>{orders.cancelled + orders.refund_related}</span>
            <span style={statusPillHintStyles}>{orders.refund_related} refund requests</span>
          </div>
        </div>
      </div>

      {/* Lists Row: Recent Orders & Recent Users */}
      <div style={listsGridStyles}>
        {/* Recent Orders */}
        <div style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={cardTitleStyles}>Recent Marketplace Orders</h3>
            <a href="/orders" style={{ fontSize: '12px', color: '#ff7a00', fontWeight: 600, textDecoration: 'none' }}>
              All Orders →
            </a>
          </div>
          {data.recent_orders && data.recent_orders.length > 0 ? (
            <div style={tableWrapperStyles}>
              <table style={tableStyles}>
                <thead>
                  <tr style={tableHeaderRowStyles}>
                    <th style={tableHeaderStyles}>Reference</th>
                    <th style={tableHeaderStyles}>Amount</th>
                    <th style={tableHeaderStyles}>Status</th>
                    <th style={tableHeaderStyles}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((o) => (
                    <tr key={o.reference} style={tableRowStyles}>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                        <a href={`/orders?ref=${o.reference}`} style={{ color: '#ff7a00', textDecoration: 'none' }}>
                          {o.reference}
                        </a>
                      </td>
                      <td style={tableCellStyles}>{formatCurrency(o.total)}</td>
                      <td style={tableCellStyles}>
                        <span style={statusBadgeStyles(o.status)}>{o.status}</span>
                      </td>
                      <td style={tableCellStyles}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={emptyLabelStyles}>No recent orders recorded.</p>
          )}
        </div>

        {/* Recent Users */}
        <div style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={cardTitleStyles}>Recent User Registrations</h3>
            <a href="/users" style={{ fontSize: '12px', color: '#ff7a00', fontWeight: 600, textDecoration: 'none' }}>
              All Users →
            </a>
          </div>
          {data.recent_users && data.recent_users.length > 0 ? (
            <div style={listWrapperStyles}>
              {data.recent_users.map((u) => (
                <div key={u.id} style={userItemStyles}>
                  <div style={userAvatarStyles}>
                    {u.first_name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={userNameStyles}>
                      {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Registered User'}
                    </span>
                    <span style={userEmailStyles}>{u.email}</span>
                  </div>
                  <span style={userDateStyles}>
                    {new Date(u.date_joined).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={emptyLabelStyles}>No recent registrations recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Status badge styling helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  if (status === 'PAID' || status === 'COMPLETED' || status === 'DELIVERED' || status === 'RECEIVED') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING_PAYMENT' || status === 'PROCESSING' || status === 'SHIPPED' || status === 'IN_TRANSIT') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'CANCELLED' || status === 'REFUNDED') {
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

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const controlsRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const rangeToggleGroupStyles: React.CSSProperties = {
  display: 'inline-flex',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '3px',
  gap: '4px',
};

const baseRangeBtn: React.CSSProperties = {
  border: 'none',
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const activeRangeBtnStyles: React.CSSProperties = {
  ...baseRangeBtn,
  backgroundColor: '#ffffff',
  color: '#111827',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const inactiveRangeBtnStyles: React.CSSProperties = {
  ...baseRangeBtn,
  backgroundColor: 'transparent',
  color: '#6b7280',
};

const refreshBtnStyles: React.CSSProperties = {
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  padding: '7px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const primaryButtonStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  padding: '8px 18px',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const warningNoticeStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  backgroundColor: '#fffbeb',
  border: '1px solid #fef3c7',
  borderRadius: '8px',
  padding: '12px 16px',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '18px',
};

const widgetCardLinkStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const widgetInfoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const widgetLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const widgetValueStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
};

const widgetSubStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
};

const widgetIconStyles: React.CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  color: '#ffffff',
  flexShrink: 0,
};

const statusBreakdownGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '14px',
  marginTop: '8px',
};

const statusPillCardStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const statusPillLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const statusPillValueStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#111827',
};

const statusPillHintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const listsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: '24px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
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
};

const tableHeaderStyles: React.CSSProperties = {
  padding: '10px 12px',
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
  padding: '12px',
  color: '#374151',
};

const listWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const userItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f3f4f6',
};

const userAvatarStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,122,0,0.12)',
  color: '#ff7a00',
  fontSize: '14px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const userNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#1f2937',
};

const userEmailStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#9ca3af',
};

const userDateStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
};

const emptyLabelStyles: React.CSSProperties = {
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: '13px',
  margin: '24px 0',
};
