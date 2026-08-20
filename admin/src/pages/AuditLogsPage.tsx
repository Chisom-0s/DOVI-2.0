import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { AuditLog, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [userIdSearch, setUserIdSearch] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditLogs = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listAuditLogs({
        page,
        user: userIdSearch || undefined,
        action: actionSearch || undefined,
      });
      setLogs(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load audit logs.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs(true);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={titleHeaderStyles}>
          <h2 style={titleStyles}>Security Audit Log</h2>
          <span style={viewOnlyBadgeStyles}>Immutable records</span>
        </div>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={titleHeaderStyles}>
        <h2 style={titleStyles}>Security Audit Log</h2>
        <span style={viewOnlyBadgeStyles}>Immutable records</span>
      </div>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Filter by Actor User ID..."
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            style={searchInputStyles}
          />
          <input
            type="text"
            placeholder="Filter by Action (e.g. USER_SUSPEND)..."
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Filter</button>
        </form>
      </div>

      {/* Warning indicator */}
      <div style={infoAlertStyles}>
        🔒 <strong>Compliance Notice:</strong> This log records all write actions performed by admins and systems across the platform. In compliance with security policy, these logs are immutable, write-once-read-only records.
      </div>

      {/* Audit Logs Table */}
      {logs.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No Audit Logs Found"
          subtitle="Try adjusting your user ID or action type filters."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Timestamp</th>
                  <th style={tableHeaderCellStyles}>Actor / Administrator</th>
                  <th style={tableHeaderCellStyles}>Action Description</th>
                  <th style={tableHeaderCellStyles}>Entity Target</th>
                  <th style={tableHeaderCellStyles}>IP Address</th>
                  <th style={tableHeaderCellStyles}>Status Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={tableCellStyles}>
                      <strong style={{ display: 'block', fontSize: '12px' }}>
                        {log.actor.first_name} {log.actor.last_name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>ID: {log.actor.id}</span>
                    </td>
                    <td style={{ ...tableCellStyles, fontWeight: 600 }}>{log.action}</td>
                    <td style={tableCellStyles}>
                      <span style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>
                        {log.entity_type}:
                      </span>{' '}
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1f2937' }}>{log.entity_id}</span>
                    </td>
                    <td style={tableCellStyles}>{log.ip_address || 'N/A'}</td>
                    <td style={tableCellStyles}>
                      <span style={resultBadgeStyles(log.result)}>{log.result}</span>
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
    </div>
  );
}

// Result badge color styles helper
const resultBadgeStyles = (result: string): React.CSSProperties => {
  const success = result === 'SUCCESS' || result === 'ALLOWED';
  return {
    backgroundColor: success ? '#d1fae5' : '#fee2e2',
    color: success ? '#065f46' : '#991b1b',
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

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
  maxWidth: '300px',
};

const searchBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
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
