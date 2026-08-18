import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/api/notifications';
import type { Notification, PaginatedResponse } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function NotificationsPage() {
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

  return (
    <div style={containerStyles}>
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Notifications</h2>
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
            <Skeleton key={i} width="100%" height="80px" borderRadius="var(--radius-lg)" />
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
                  backgroundColor: notif.is_read ? '#ffffff' : 'rgba(255, 122, 0, 0.03)',
                  borderColor: notif.is_read ? 'var(--color-border)' : 'rgba(255, 122, 0, 0.2)',
                }}
              >
                <div style={cardHeaderStyles}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {!notif.is_read && <span style={unreadDotStyles} />}
                    <strong style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: notif.is_read ? 'var(--font-semibold)' : 'var(--font-bold)',
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
                {!notif.is_read && (
                  <button onClick={() => handleMarkRead(notif.id)} style={markReadBtnStyles}>
                    Mark as read
                  </button>
                )}
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
                ← Previous
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
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling
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
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  position: 'relative',
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
  paddingLeft: 'var(--space-1)',
};

const markReadBtnStyles: React.CSSProperties = {
  alignSelf: 'flex-end',
  fontSize: '10px',
  color: 'var(--color-primary)',
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
