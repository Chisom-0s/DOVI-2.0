import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { User, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('');

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
      setTotalPages(Math.ceil(res.count / 20) || 1);
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

  const handleToggleLoginStatus = async (userToUpdate: User) => {
    setIsActionPending(true);
    const isSuspending = userToUpdate.status === 'ACTIVE';
    try {
      let updatedUser: User;
      if (isSuspending) {
        updatedUser = await adminApi.suspendUser(userToUpdate.id);
        toast.success(`User login access for ${userToUpdate.email} suspended.`);
      } else {
        updatedUser = await adminApi.activateUser(userToUpdate.id);
        toast.success(`User login access for ${userToUpdate.email} activated.`);
      }
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    } catch (err: any) {
      toast.error(err.message || `Failed to update status for ${userToUpdate.email}.`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleApproveVendor = async (userToApprove: User) => {
    setIsActionPending(true);
    try {
      // Find associated vendor store in directory if one exists
      const vendorList = await adminApi.listVendors({ q: userToApprove.email });
      const matchedVendor = vendorList.results.find(
        (v: any) =>
          v.email === userToApprove.email ||
          v.user?.email === userToApprove.email ||
          v.user === userToApprove.id
      );

      if (matchedVendor) {
        await adminApi.approveVendor(matchedVendor.id);
      }

      const updatedUser: User = {
        ...userToApprove,
        vendor_status: 'APPROVED',
        profile: {
          ...userToApprove.profile,
          vendor_status: 'APPROVED',
        },
      };

      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`Vendor ${userToApprove.email} approved successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to approve vendor status.`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectVendor = async (userToReject: User) => {
    const reason = window.prompt('Specify reason for rejection:');
    if (reason === null) return; // cancelled

    setIsActionPending(true);
    try {
      const vendorList = await adminApi.listVendors({ q: userToReject.email });
      const matchedVendor = vendorList.results.find(
        (v: any) =>
          v.email === userToReject.email ||
          v.user?.email === userToReject.email ||
          v.user === userToReject.id
      );

      if (matchedVendor) {
        await adminApi.rejectVendor(matchedVendor.id, reason || 'Compliance validation issue');
      }

      const updatedUser: User = {
        ...userToReject,
        vendor_status: 'REJECTED',
        profile: {
          ...userToReject.profile,
          vendor_status: 'REJECTED',
        },
      };

      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`Vendor ${userToReject.email} set to rejected.`);
    } catch (err: any) {
      toast.error(err.message || `Failed to reject vendor.`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleSuspendVendor = async (userToSuspend: User) => {
    if (!confirm(`Are you sure you want to suspend merchant privileges for ${userToSuspend.email}?`)) return;

    setIsActionPending(true);
    try {
      const vendorList = await adminApi.listVendors({ q: userToSuspend.email });
      const matchedVendor = vendorList.results.find(
        (v: any) =>
          v.email === userToSuspend.email ||
          v.user?.email === userToSuspend.email ||
          v.user === userToSuspend.id
      );

      if (matchedVendor) {
        await adminApi.suspendVendor(matchedVendor.id);
      }

      const updatedUser: User = {
        ...userToSuspend,
        vendor_status: 'SUSPENDED',
        profile: {
          ...userToSuspend.profile,
          vendor_status: 'SUSPENDED',
        },
      };

      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success(`Vendor ${userToSuspend.email} merchant status suspended.`);
    } catch (err: any) {
      toast.error(err.message || `Failed to suspend vendor.`);
    } finally {
      setIsActionPending(false);
    }
  };

  // Client-side filtration for vendor status if selected
  const filteredUsers = users.filter(u => {
    if (!vendorStatusFilter) return true;
    const vStatus = u.profile?.vendor_status || u.vendor_status || 'N/A';
    return vStatus === vendorStatusFilter;
  });

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
            onChange={e => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={filterWrapperStyles}>
            <label style={filterLabelStyles}>Role:</label>
            <select
              value={roleFilter}
              onChange={e => {
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

          <div style={filterWrapperStyles}>
            <label style={filterLabelStyles}>Merchant Status:</label>
            <select
              value={vendorStatusFilter}
              onChange={e => setVendorStatusFilter(e.target.value)}
              style={selectStyles}
            >
              <option value="">All Merchant Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved / Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="N/A">Not Applicable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
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
                  <th style={tableHeaderCellStyles}>Login Status</th>
                  <th style={tableHeaderCellStyles}>Merchant Status</th>
                  <th style={tableHeaderCellStyles}>Joined Date</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const merchantStatus = u.profile?.vendor_status || u.vendor_status || (u.role === 'VENDOR' ? 'PENDING' : 'N/A');

                  return (
                    <tr key={u.id} style={tableRowStyles}>
                      <td style={{ ...tableCellStyles, fontWeight: 600 }}>
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : '—'}
                      </td>
                      <td style={tableCellStyles}>{u.email}</td>
                      <td style={tableCellStyles}>
                        <span style={roleBadgeStyles(u.role)}>{u.role}</span>
                      </td>
                      <td style={tableCellStyles}>
                        <span style={statusBadgeStyles(u.status)}>{u.status}</span>
                      </td>
                      <td style={tableCellStyles}>
                        {u.role === 'VENDOR' ? (
                          <span style={vendorStatusBadgeStyles(merchantStatus)}>
                            {merchantStatus}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td style={tableCellStyles}>
                        {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}
                      </td>
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
                  );
                })}
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
              <span style={pageLabelStyles}>
                Page {page} of {totalPages}
              </span>
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
              <h3 style={modalTitleStyles}>User Account & Merchant Details</h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={closeBtnStyles}
              >
                &times;
              </button>
            </div>

            <div style={detailsGridStyles}>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Full Name</span>
                <span style={detailValueStyles}>
                  {selectedUser.first_name || selectedUser.last_name
                    ? `${selectedUser.first_name} ${selectedUser.last_name}`
                    : 'Not Specified'}
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Email Address</span>
                <span style={detailValueStyles}>{selectedUser.email}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Phone Number</span>
                <span style={detailValueStyles}>{selectedUser.phone || selectedUser.profile?.phone_number || 'N/A'}</span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Account Role</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={roleBadgeStyles(selectedUser.role)}>{selectedUser.role}</span>
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Login Access Status</span>
                <span style={{ display: 'inline-block' }}>
                  <span style={statusBadgeStyles(selectedUser.status)}>{selectedUser.status}</span>
                </span>
              </div>

              {/* Merchant / Vendor Verification Status */}
              {selectedUser.role === 'VENDOR' && (
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Merchant Store Status</span>
                  <span style={{ display: 'inline-block' }}>
                    <span
                      style={vendorStatusBadgeStyles(
                        selectedUser.profile?.vendor_status || selectedUser.vendor_status || 'PENDING'
                      )}
                    >
                      {selectedUser.profile?.vendor_status || selectedUser.vendor_status || 'PENDING'}
                    </span>
                  </span>
                </div>
              )}

              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Registration Date</span>
                <span style={detailValueStyles}>
                  {selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div style={detailItemStyles}>
                <span style={detailLabelStyles}>Last Login Date</span>
                <span style={detailValueStyles}>
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Vendor Specific Verification Actions */}
              {selectedUser.role === 'VENDOR' && (
                <div style={vendorActionBoxStyles}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Merchant Moderation Actions
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(selectedUser.profile?.vendor_status === 'PENDING' || selectedUser.vendor_status === 'PENDING' || !selectedUser.profile?.vendor_status) && (
                      <>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleApproveVendor(selectedUser)}
                          style={approveBtnStyles}
                        >
                          {isActionPending ? 'Processing...' : '✓ Approve Vendor Store'}
                        </button>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleRejectVendor(selectedUser)}
                          style={rejectBtnStyles}
                        >
                          ✕ Reject Application
                        </button>
                      </>
                    )}

                    {(selectedUser.profile?.vendor_status === 'APPROVED' || selectedUser.vendor_status === 'APPROVED') && (
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() => handleSuspendVendor(selectedUser)}
                        style={suspendMerchantBtnStyles}
                      >
                        {isActionPending ? 'Processing...' : 'Suspend Vendor Status'}
                      </button>
                    )}

                    {(selectedUser.profile?.vendor_status === 'SUSPENDED' || selectedUser.vendor_status === 'SUSPENDED' || selectedUser.profile?.vendor_status === 'REJECTED') && (
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() => handleApproveVendor(selectedUser)}
                        style={approveBtnStyles}
                      >
                        {isActionPending ? 'Processing...' : '✓ Re-activate Vendor'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        navigate('/vendors');
                      }}
                      style={viewDirectoryBtnStyles}
                    >
                      Open Vendors Directory →
                    </button>
                  </div>
                </div>
              )}

              {/* Login Access Toggle (Separate from Merchant Moderation) */}
              {selectedUser.role !== 'ADMIN' && (
                <div style={modalActionsStyles}>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => handleToggleLoginStatus(selectedUser)}
                    style={selectedUser.status === 'ACTIVE' ? suspendBtnStyles : activateBtnStyles}
                  >
                    {isActionPending
                      ? 'Updating...'
                      : selectedUser.status === 'ACTIVE'
                      ? 'Suspend Login Access'
                      : 'Activate Login Access'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
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

const vendorStatusBadgeStyles = (vStatus?: string): React.CSSProperties => {
  const status = vStatus || 'PENDING';
  let backgroundColor = '#fef3c7';
  let color = '#d97706';
  if (status === 'APPROVED') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'REJECTED' || status === 'SUSPENDED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  } else if (status === 'N/A') {
    backgroundColor = '#f3f4f6';
    color = '#6b7280';
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
  maxWidth: '520px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
  marginBottom: '16px',
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
  gap: '12px',
};

const detailItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  borderBottom: '1px dotted #f3f4f6',
  paddingBottom: '6px',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
};

const detailValueStyles: React.CSSProperties = {
  fontWeight: 600,
  color: '#1f2937',
};

const vendorActionBoxStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px',
};

const approveBtnStyles: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  padding: '7px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const rejectBtnStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#ef4444',
  border: '1px solid #ef4444',
  padding: '7px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const suspendMerchantBtnStyles: React.CSSProperties = {
  backgroundColor: '#d97706',
  color: '#ffffff',
  border: 'none',
  padding: '7px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const viewDirectoryBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#1f2937',
  border: '1px solid #d1d5db',
  padding: '7px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  borderTop: '1px solid #f3f4f6',
  paddingTop: '10px',
};

const suspendBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '7px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const activateBtnStyles: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  padding: '7px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};
