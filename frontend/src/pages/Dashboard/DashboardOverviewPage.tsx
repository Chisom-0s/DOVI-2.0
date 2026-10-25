import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/api/orders';
import { notificationsApi } from '@/api/notifications';
import { formatPrice } from '@/utils/currency';
import type { OrderSummary, Notification } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await ordersApi.list(1);
        setRecentOrders(data.results.slice(0, 3));
      } catch (err) {
        console.error('Failed to load recent orders:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.list(1);
        setRecentNotifications(data.results.slice(0, 3));
      } catch (err) {
        console.error('Failed to load recent notifications:', err);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    loadOrders();
    loadNotifications();
  }, []);

  const formatCurrency = (val: string) => formatPrice(val);

  return (
    <div style={pageStyles}>
      {/* Welcome Banner */}
      <div style={welcomeBannerStyles} className="dashboard-welcome-banner">
        <div style={{ flex: '1 1 auto', minWidth: '220px' }}>
          <h2 style={welcomeTitleStyles}>Hello, {user?.first_name || 'Buyer'}!</h2>
          <p style={welcomeSubStyles}>Manage your account, track active orders, or set up saving goals.</p>
        </div>
        <a
          href="https://wa.me/2347014109517?text=Hello%20Dovi%20Support%2C%20I%20need%20assistance%20with%20my%20account."
          target="_blank"
          rel="noopener noreferrer"
          className="dashboard-greeting-whatsapp-btn"
          aria-label="Chat with Dovi Support on WhatsApp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.811.922 3.145.922 3.18 0 5.767-2.587 5.767-5.766 0-3.181-2.587-5.764-5.763-5.764zM16.1 14.153c-.157.447-.905.867-1.285.932-.38.065-.898.114-2.868-.696-2.359-.968-3.874-3.376-3.99-3.532-.116-.156-.954-1.272-.954-2.428 0-1.156.602-1.725.815-1.947.213-.222.463-.278.618-.278.155 0 .31.002.449.009.146.007.342-.058.524.382.182.44.622 1.52.678 1.636.056.116.094.252.016.408-.078.156-.118.252-.234.389-.116.136-.245.292-.35.402-.116.116-.238.243-.105.474.133.23.593.979 1.277 1.594.88.793 1.611 1.042 1.838 1.157.227.116.36.097.494-.056.134-.153.58-675.722-.82.143-.146.338-.119.531-.016l3.35 1.593c.22.106.367.159.421.248.054.089.054.517-.103.964z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.761.455 3.424 1.267 4.908L2 22l5.228-1.185A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zM12 20.301c-1.42 0-2.812-.358-4.053-1.03l-.291-.157-3.003.681.693-2.905-.175-.29A8.324 8.324 0 013.699 12C3.699 7.424 7.424 3.699 12 3.699S20.301 7.424 20.301 12 16.576 20.301 12 20.301z" />
          </svg>
          <span>WhatsApp Support</span>
        </a>
      </div>

      <div style={gridStyles}>
        {/* Recent Orders Card */}
        <div style={widgetCardStyles}>
          <div style={widgetHeaderStyles}>
            <h3 style={widgetTitleStyles}>Recent Orders</h3>
            <Link to="/dashboard/orders" style={widgetLinkStyles}>View All</Link>
          </div>

          {isLoadingOrders ? (
            <div style={listContainerStyles}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} width="100%" height="60px" borderRadius="var(--radius-md)" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={emptyStyles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <p style={emptyTextStyles}>No orders placed yet.</p>
              <Link to="/products" style={actionLinkStyles}>Start Shopping</Link>
            </div>
          ) : (
            <div style={listContainerStyles}>
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/dashboard/orders/${order.reference}`}
                  style={orderItemStyles}
                >
                  <div>
                    <strong style={orderRefStyles}>#{order.reference}</strong>
                    <span style={orderDateStyles}>
                      {new Date(order.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusColor(order.status).bg,
                        color: statusColor(order.status).text,
                        fontSize: '9px',
                        padding: '2px 8px',
                      }}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <strong style={orderTotalStyles}>{formatCurrency(order.total)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Card */}
        <div style={widgetCardStyles}>
          <div style={widgetHeaderStyles}>
            <h3 style={widgetTitleStyles}>Recent Notifications</h3>
            <Link to="/dashboard/notifications" style={widgetLinkStyles}>View All</Link>
          </div>

          {isLoadingNotifications ? (
            <div style={listContainerStyles}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} width="100%" height="60px" borderRadius="var(--radius-md)" />
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div style={emptyStyles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <p style={emptyTextStyles}>All caught up!</p>
            </div>
          ) : (
            <div style={listContainerStyles}>
              {recentNotifications.map((notif) => (
                <div key={notif.id} style={notifItemStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <span style={{
                      ...notifTitleStyles,
                      fontWeight: notif.is_read ? 'var(--font-medium)' : 'var(--font-bold)',
                    }}>
                      {notif.title}
                    </span>
                    <span style={notifDateStyles}>
                      {new Date(notif.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                  <p style={notifBodyStyles}>{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function statusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
    case 'COMPLETED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    default:
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
  }
}

// Styling
const pageStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const welcomeBannerStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.05) 0%, rgba(255, 122, 0, 0.12) 100%)',
  border: '1px solid rgba(255, 122, 0, 0.1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--space-4)',
};

const welcomeTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
  margin: 0,
};

const welcomeSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
  lineHeight: 1.5,
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 'var(--space-6)',
};

const widgetCardStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const widgetHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const widgetTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const widgetLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  textDecoration: 'none',
};

const listContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const orderItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  transition: 'background-color var(--transition-fast)',
};

const orderRefStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  display: 'block',
};

const orderDateStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const orderTotalStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
};

const notifItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: 'var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const notifTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
};

const notifDateStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const notifBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-8) 0',
  textAlign: 'center',
};

const emptyTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const actionLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  textDecoration: 'underline',
};
