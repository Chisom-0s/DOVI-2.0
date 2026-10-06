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

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          results: prev.results.filter(n => n.id !== id),
          count: Math.max(0, prev.count - 1),
        };
      });
      toast.success('Notification deleted.');
    } catch {
      toast.error('Failed to delete notification.');
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

  const getNotifIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        );
      case 'PAYMENT_SUCCESSFUL':
      case 'PAYMENT_FAILED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        );
      case 'REFUND_REQUESTED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        );
      case 'SAVE2OWN_CONTRIBUTION':
      case 'SAVE2OWN_REMINDER':
      case 'SAVE2OWN_TARGET_REACHED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
        );
      case 'PRICE_CHANGED':
      case 'PRODUCT_UNAVAILABLE':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        );
      case 'VENDOR_APPROVED':
      case 'VENDOR_REJECTED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        );
      case 'AUTO_BOOKING_CONFIRMED':
      case 'AUTO_BOOKING_CANCELLED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
            <circle cx="7" cy="17" r="2"></circle>
            <path d="M9 17h6"></path>
            <circle cx="17" cy="17" r="2"></circle>
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        );
    }
  };

  const getNotifButtonLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_FAILED': return 'Retry Payment';
      case 'ORDER_DELIVERED': return 'Confirm Receipt';
      case 'SAVE2OWN_TARGET_REACHED': return 'Checkout Goal';
      case 'REFUND_REJECTED': return 'Review Reason';
      default: return 'View Details';
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
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

                    <button onClick={() => handleDelete(notif.id)} style={deleteBtnStyles}>
                      Delete
                    </button>
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

const deleteBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: '600',
  color: 'var(--color-danger)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 'var(--space-1) var(--space-3)',
};
