import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

interface AnalyticsOverview {
  total_users: number;
  new_users_today: number;
  total_vendors: number;
  pending_vendors_count: number;
  total_orders: number;
  revenue_today: string;
  payments_summary: {
    today: string;
    week: string;
    month: string;
  };
  pending_refunds_count: number;
  active_s2o_goals_count: number;
  recent_orders: Array<{
    reference: string;
    total: string;
    status: string;
    created_at: string;
  }>;
  recent_users: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
  }>;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminApi.getAnalyticsOverview();
        setData(res);
      } catch (err: any) {
        setError(err);
        toast.error('Failed to load dashboard analytics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val?.toString() || '0'));
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Dashboard Overview</h2>
        <div style={gridStyles}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="120px" borderRadius="12px" />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          <Skeleton height="300px" borderRadius="12px" />
          <Skeleton height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Dashboard Overview</h2>
        <ApiErrorMessage error={error} />
      </div>
    );
  }

  const widgets = [
    { label: 'Total Users', value: data.total_users, sub: `+${data.new_users_today} joined today`, icon: '👤', color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
    { label: 'Total Orders', value: data.total_orders, sub: 'All-time platform orders', icon: '📦', color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
    { label: 'Revenue Today', value: formatCurrency(data.revenue_today), sub: `Payments Month: ${formatCurrency(data.payments_summary?.month || 0)}`, icon: '💰', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { label: 'Pending Refunds', value: data.pending_refunds_count, sub: `Active Save2Own: ${data.active_s2o_goals_count}`, icon: '💵', color: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' },
  ];

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Dashboard Overview</h2>

      {/* Widgets Grid */}
      <div style={gridStyles}>
        {widgets.map((w, i) => (
          <div key={i} style={widgetCardStyles}>
            <div style={widgetInfoStyles}>
              <span style={widgetLabelStyles}>{w.label}</span>
              <span style={widgetValueStyles}>{w.value}</span>
              <span style={widgetSubStyles}>{w.sub}</span>
            </div>
            <div style={{ ...widgetIconStyles, background: w.color }}>{w.icon}</div>
          </div>
        ))}
      </div>

      {/* Lists Row */}
      <div style={listsGridStyles}>
        {/* Recent Orders */}
        <div style={cardStyles}>
          <h3 style={cardTitleStyles}>Recent Orders</h3>
          {data.recent_orders && data.recent_orders.length > 0 ? (
            <div style={tableWrapperStyles}>
              <table style={tableStyles}>
                <thead>
                  <tr style={tableHeaderRowStyles}>
                    <th style={tableHeaderStyles}>Ref</th>
                    <th style={tableHeaderStyles}>Total</th>
                    <th style={tableHeaderStyles}>Status</th>
                    <th style={tableHeaderStyles}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((o) => (
                    <tr key={o.reference} style={tableRowStyles}>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                        <a href={`/orders?ref=${o.reference}`} style={{ color: 'var(--color-primary)' }}>{o.reference}</a>
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
            <p style={emptyLabelStyles}>No recent orders.</p>
          )}
        </div>

        {/* Recent Users */}
        <div style={cardStyles}>
          <h3 style={cardTitleStyles}>Recent User Registrations</h3>
          {data.recent_users && data.recent_users.length > 0 ? (
            <div style={listWrapperStyles}>
              {data.recent_users.map((u) => (
                <div key={u.id} style={userItemStyles}>
                  <div style={userAvatarStyles}>
                    {u.first_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={userNameStyles}>
                      {u.first_name} {u.last_name}
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
            <p style={emptyLabelStyles}>No recent registrations.</p>
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
  } else if (status === 'PENDING_PAYMENT' || status === 'PROCESSING') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'CANCELLED' || status === 'REFUNDED') {
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

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const widgetCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
  letterSpacing: '0.5px',
};

const widgetValueStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#1f2937',
};

const widgetSubStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const widgetIconStyles: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  color: '#ffffff',
};

const listsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
  fontSize: '15px',
  fontWeight: 700,
  color: '#374151',
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
  color: '#374151',
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
