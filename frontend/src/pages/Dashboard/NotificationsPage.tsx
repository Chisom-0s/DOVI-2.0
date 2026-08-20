import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/api/notifications';
import type { Notification, PaginatedResponse } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Notification> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.list(page);
      setData(res);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          results: prev.results.map(n => n.id === id ? { ...n, is_read: true } : n),
        };
      });
      toast.success('Notification marked as read.');
    } catch {
      toast.error('Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          results: prev.results.map(n => ({ ...n, is_read: true })),
        };
      });
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to update notifications.');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED': return '📦';
      case 'PAYMENT_SUCCESSFUL': return '💳';
      case 'PAYMENT_FAILED': return '❌';
      case 'ORDER_SHIPPED': return '🚚';
      case 'ORDER_DELIVERED': return '✅';
      case 'REFUND_REQUESTED': return '↩️';
      case 'REFUND_APPROVED': return '💰';
      case 'REFUND_REJECTED': return '⚠️';
      case 'SAVE2OWN_CONTRIBUTION': return '🐷';
      case 'SAVE2OWN_REMINDER': return '⏰';
      case 'SAVE2OWN_TARGET_REACHED': return '🏆';
      case 'PRICE_CHANGED': return '🏷️';
      case 'PRODUCT_UNAVAILABLE': return '🚫';
      case 'VENDOR_APPROVED': return '🏢';
      case 'VENDOR_REJECTED': return '🏢';
      case 'AUTO_BOOKING_CONFIRMED': return '🔑';
      case 'AUTO_BOOKING_CANCELLED': return '❌';
      default: return '🔔';
    }
  };

  const getNotifButtonLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_FAILED': return 'Retry Payment 💳';
      case 'ORDER_DELIVERED': return 'Confirm Receipt ✅';
      case 'SAVE2OWN_TARGET_REACHED': return 'Checkout Goal 🏆';
      case 'REFUND_REJECTED': return 'Review Reason 🔍';
      default: return 'View Details &rarr;';
    }
  };

  const handleActionClick = (notif: Notification) => {
    // Proactively mark read, then navigate
    if (!notif.is_read) {
      notificationsApi.markRead(notif.id).catch(console.error);
    }
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Notifications Centre</h2>
          <p style={subtitleStyles}>Stay updated on your orders, payments, and savings goals.</p>
        </div>
        {!isLoading && data && data.results.some(n => !n.is_read) && (
          <button onClick={handleMarkAllRead} style={markAllBtnStyles}>
            Mark All as Read
          </button>
        )}
      </div>

      {isLoading && (
        <div style={listStyles}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="90px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {!isLoading && data && data.results.length === 0 && (
        <div style={emptyStyles}>
          <span style={{ fontSize: '2.5rem' }}>🔔</span>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)' }}>All caught up!</h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            You don't have any notifications right now.
          </p>
        </div>
      )}

      {!isLoading && data && data.results.length > 0 && (
        <>
          <div style={listStyles}>
            {data.results.map((notif) => (
              <div
                key={notif.id}
                style={{
                  ...notifCardStyles,
                  backgroundColor: notif.is_read ? '#ffffff' : 'rgba(255, 122, 0, 0.02)',
                  borderColor: notif.is_read ? 'var(--color-border)' : 'rgba(255, 122, 0, 0.15)',
                }}
              >
                <div style={notifInnerGridStyles}>
                  {/* Icon Block */}
                  <div style={iconBoxStyles}>
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Message details */}
                  <div style={infoBoxStyles}>
                    <div style={cardHeaderStyles}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {!notif.is_read && <span style={unreadDotStyles} />}
                        <strong style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: notif.is_read ? '600' : '800',
                          color: 'var(--color-text)',
                        }}>
                          {notif.title}
                        </strong>
                      </div>
                      <span style={dateStyles}>
                        {new Date(notif.created_at).toLocaleString('en-NG', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p style={bodyStyles}>{notif.message}</p>
                  </div>

                  {/* Actions Right block */}
                  <div style={actionsColStyles}>
                    {notif.action_url && (
                      <button
                        onClick={() => handleActionClick(notif)}
                        style={actionBtnStyles}
                      >
                        {getNotifButtonLabel(notif.type)}
                      </button>
                    )}
                    
                    {!notif.is_read && (
                      <button onClick={() => handleMarkRead(notif.id)} style={markReadBtnStyles}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(data.next || data.previous) && (
            <div style={paginationStyles}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.previous}
                style={{
                  ...pageBtnStyles,
                  opacity: data.previous ? 1 : 0.4,
                }}
              >
                &larr; Previous
              </button>
              <span style={pageInfoStyles}>Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.next}
                style={{
                  ...pageBtnStyles,
                  opacity: data.next ? 1 : 0.4,
                }}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
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
  gap: 'var(--space-4)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  marginBottom: '16px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  margin: '2px 0 0 0',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const markAllBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  cursor: 'pointer',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const notifCardStyles: React.CSSProperties = {
  padding: '16px 20px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
};

const notifInnerGridStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const iconBoxStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  flexShrink: 0,
};

const infoBoxStyles: React.CSSProperties = {
  flex: 1,
  minWidth: '240px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const cardHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const unreadDotStyles: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  display: 'inline-block',
};

const dateStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const bodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
};

const actionsColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px',
  flexShrink: 0,
  minWidth: '120px',
};

const actionBtnStyles: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const markReadBtnStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-4)',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  backgroundColor: 'transparent',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
};

const pageInfoStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-16) var(--space-4)',
  textAlign: 'center',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
};
