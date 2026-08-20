import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { User, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Selected User Modal / Detail
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listUsers({
        page,
        q: searchTerm || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1); // 20 per page typical
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load user list.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(true);
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    setIsActionPending(true);
    const isSuspending = userToUpdate.status === 'ACTIVE';
    try {
      let updatedUser: User;
      if (isSuspending) {
        updatedUser = await adminApi.suspendUser(userToUpdate.id);
        toast.success(`User ${userToUpdate.email} suspended successfully.`);
      } else {
        updatedUser = await adminApi.activateUser(userToUpdate.id);
        toast.success(`User ${userToUpdate.email} activated successfully.`);
      }
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (err: any) {
      toast.error(err.message || `Failed to update status for ${userToUpdate.email}.`);
    } finally {
      setIsActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>User Management</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>User Management</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Roles</option>
            <option value="BUYER">Buyer</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Users Found"
          subtitle="Try adjusting your search criteria or filter options."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Full Name</th>
                  <th style={tableHeaderCellStyles}>Email Address</th>
                  <th style={tableHeaderCellStyles}>Role</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Joined Date</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, fontWeight: 600 }}>
                      {u.first_name} {u.last_name}
                    </td>
                    <td style={tableCellStyles}>{u.email}</td>
                    <td style={tableCellStyles}>
                      <span style={roleBadgeStyles(u.role)}>{u.role}</span>
                    </td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(u.status)}>{u.status}</span>
                    </td>
                    <td style={tableCellStyles}>{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        style={viewBtnStyles}
                      >
                        Inspect
                      </button>
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

      {/* Inspect User Modal */}
      {selectedUser && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>User Account Details</h3>
              <button type="button" onClick={() => setSelectedUser(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Full Name</span>
                <span style={detailValueStyles}>{selectedUser.first_name} {selectedUser.last_name}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Email Address</span>
                <span style={detailValueStyles}>{selectedUser.email}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Phone Number</span>
                <span style={detailValueStyles}>{selectedUser.phone || 'N/A'}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Account Role</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={roleBadgeStyles(selectedUser.role)}>{selectedUser.role}</span>
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>System Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedUser.status)}>{selectedUser.status}</span>
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Registration Date</span>
                <span style={detailValueStyles}>{new Date(selectedUser.date_joined).toLocaleString()}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Last Login Date</span>
                <span style={detailValueStyles}>
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {selectedUser.role !== 'ADMIN' && (
              <div style={modalActionsStyles}>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleToggleStatus(selectedUser)}
                  style={selectedUser.status === 'ACTIVE' ? suspendBtnStyles : activateBtnStyles}
                >
                  {isActionPending
                    ? 'Updating...'
                    : selectedUser.status === 'ACTIVE'
                    ? 'Suspend User Account'
                    : 'Activate User Account'
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Badge Helpers
const roleBadgeStyles = (role: string): React.CSSProperties => {
  let backgroundColor = '#e0f2fe';
  let color = '#0369a1';
  if (role === 'VENDOR') {
    backgroundColor = '#fef3c7';
    color = '#d97706';
  } else if (role === 'ADMIN') {
    backgroundColor = '#f3e8ff';
    color = '#7e22ce';
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

const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#d1fae5';
  let color = '#065f46';
  if (status === 'SUSPENDED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  } else if (status === 'DEACTIVATED') {
    backgroundColor = '#f3f4f6';
    color = '#4b5563';
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
  maxWidth: '440px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
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

const viewBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ff7a00',
  border: '1px solid rgba(255,122,0,0.2)',
  padding: '4px 10px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
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
  justifyContent: 'flex-end',
  marginTop: '24px',
};

const suspendBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const activateBtnStyles: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};
