import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { User, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

// Helper to generate consistent avatar background colors from name
const getAvatarGradient = (name: string): string => {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #ff7a00 0%, #ff007a 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const getInitials = (first?: string, last?: string, email?: string): string => {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'BUYER' | 'VENDOR' | 'ADMIN' | 'PENDING_VENDOR'>('ALL');
  const [loginStatusFilter, setLoginStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

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
        role: activeTab === 'ALL' || activeTab === 'PENDING_VENDOR' ? undefined : activeTab,
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
  }, [page, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(true);
  };

  // KPI Statistics Summary
  const stats = useMemo(() => {
    const total = users.length;
    const buyers = users.filter(u => u.role === 'BUYER').length;
    const vendors = users.filter(u => u.role === 'VENDOR').length;
    const pendingVendors = users.filter(
      u => u.role === 'VENDOR' && (u.profile?.vendor_status === 'PENDING' || u.vendor_status === 'PENDING' || !u.profile?.vendor_status)
    ).length;
    return { total, buyers, vendors, pendingVendors };
  }, [users]);

  // Client-side filtering across current page view
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role & Tab filter
      if (activeTab === 'BUYER' && u.role !== 'BUYER') return false;
      if (activeTab === 'VENDOR' && u.role !== 'VENDOR') return false;
      if (activeTab === 'ADMIN' && u.role !== 'ADMIN') return false;
      if (activeTab === 'PENDING_VENDOR') {
        const isPending =
          u.role === 'VENDOR' &&
          (u.profile?.vendor_status === 'PENDING' || u.vendor_status === 'PENDING' || !u.profile?.vendor_status);
        if (!isPending) return false;
      }

      // Login Status filter
      if (loginStatusFilter !== 'ALL' && u.status !== loginStatusFilter) return false;

      return true;
    });
  }, [users, activeTab, loginStatusFilter]);

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
      // Attempt to find associated store in directory
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
      toast.success(`Merchant status for ${userToApprove.email} approved successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to approve vendor status.`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectVendor = async (userToReject: User) => {
    const reason = window.prompt('Specify reason for rejection:');
    if (reason === null) return;

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
        await adminApi.rejectVendor(matchedVendor.id, reason || 'Compliance discrepancy');
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
      toast.success(`Vendor application for ${userToReject.email} rejected.`);
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
      toast.success(`Merchant status for ${userToSuspend.email} suspended.`);
    } catch (err: any) {
      toast.error(err.message || `Failed to suspend vendor.`);
    } finally {
      setIsActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={pageContainerStyles}>
        <div style={headerSectionStyles}>
          <div>
            <h2 style={pageTitleStyles}>User Directory</h2>
            <p style={pageSubtitleStyles}>Manage user accounts, roles, and merchant store verifications.</p>
          </div>
        </div>
        <div style={kpiGridStyles}>
          <Skeleton width="100%" height="90px" borderRadius="12px" />
          <Skeleton width="100%" height="90px" borderRadius="12px" />
          <Skeleton width="100%" height="90px" borderRadius="12px" />
          <Skeleton width="100%" height="90px" borderRadius="12px" />
        </div>
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="400px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyles}>
      {/* Page Header */}
      <div style={headerSectionStyles}>
        <div>
          <h2 style={pageTitleStyles}>User Directory</h2>
          <p style={pageSubtitleStyles}>
            Manage buyer accounts, platform administrators, and vendor merchant verifications.
          </p>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* KPI Overview Cards */}
      <div style={kpiGridStyles}>
        <div style={kpiCardStyles}>
          <div style={kpiIconWrapperStyles('#f0fdf4', '#16a34a')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div style={kpiLabelStyles}>Total Users</div>
            <div style={kpiValueStyles}>{stats.total}</div>
          </div>
        </div>

        <div style={kpiCardStyles}>
          <div style={kpiIconWrapperStyles('#eff6ff', '#2563eb')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div style={kpiLabelStyles}>Buyers</div>
            <div style={kpiValueStyles}>{stats.buyers}</div>
          </div>
        </div>

        <div style={kpiCardStyles}>
          <div style={kpiIconWrapperStyles('#fdf2f8', '#db2777')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <div style={kpiLabelStyles}>Registered Vendors</div>
            <div style={kpiValueStyles}>{stats.vendors}</div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING_VENDOR')}
          style={{
            ...kpiCardStyles,
            cursor: 'pointer',
            borderColor: stats.pendingVendors > 0 ? '#fed7aa' : '#e5e7eb',
            backgroundColor: stats.pendingVendors > 0 ? '#fff7ed' : '#ffffff',
          }}
        >
          <div style={kpiIconWrapperStyles('#fff7ed', '#ea580c')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ ...kpiLabelStyles, color: stats.pendingVendors > 0 ? '#c2410c' : '#6b7280' }}>
              Pending Approvals
            </div>
            <div style={{ ...kpiValueStyles, color: stats.pendingVendors > 0 ? '#c2410c' : '#1f2937' }}>
              {stats.pendingVendors}
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search Bar & Segmented Filter Tabs */}
      <div style={toolbarCardStyles}>
        <div style={toolbarTopRowStyles}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={searchContainerStyles}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: '12px' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or telephone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={searchInputFieldStyles}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                  fetchUsers(true);
                }}
                style={clearSearchBtnStyles}
              >
                ✕
              </button>
            )}
            <button type="submit" style={searchSubmitBtnStyles}>
              Search
            </button>
          </form>

          {/* Login Status Filter */}
          <div style={statusSelectGroupStyles}>
            <span style={filterSmallLabelStyles}>Login Status:</span>
            <select
              value={loginStatusFilter}
              onChange={e => setLoginStatusFilter(e.target.value as any)}
              style={dropdownSelectStyles}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended Accounts</option>
            </select>
          </div>
        </div>

        {/* Segmented Role Tabs */}
        <div style={tabBarStyles}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            style={tabBtnStyles(activeTab === 'ALL')}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('BUYER');
              setPage(1);
            }}
            style={tabBtnStyles(activeTab === 'BUYER')}
          >
            Buyers ({stats.buyers})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('VENDOR');
              setPage(1);
            }}
            style={tabBtnStyles(activeTab === 'VENDOR')}
          >
            Vendors ({stats.vendors})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PENDING_VENDOR');
              setPage(1);
            }}
            style={tabBtnStyles(activeTab === 'PENDING_VENDOR', stats.pendingVendors > 0)}
          >
            Pending Review
            {stats.pendingVendors > 0 && (
              <span style={pendingPillBadgeStyles}>{stats.pendingVendors}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ADMIN');
              setPage(1);
            }}
            style={tabBtnStyles(activeTab === 'ADMIN')}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Main Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Users Found"
          subtitle="Try adjusting your filter selection or search query."
        />
      ) : (
        <div style={tableContainerCardStyles}>
          <div style={{ overflowX: 'auto' }}>
            <table style={spaciousTableStyles}>
              <thead>
                <tr style={tableHeadRowStyles}>
                  <th style={tableHeadCellStyles}>User Profile</th>
                  <th style={tableHeadCellStyles}>Role</th>
                  <th style={tableHeadCellStyles}>Login Access</th>
                  <th style={tableHeadCellStyles}>Merchant Verification</th>
                  <th style={tableHeadCellStyles}>Date Registered</th>
                  <th style={{ ...tableHeadCellStyles, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const fullName =
                    u.first_name || u.last_name
                      ? `${u.first_name} ${u.last_name}`.trim()
                      : 'Unnamed User';
                  const initials = getInitials(u.first_name, u.last_name, u.email);
                  const avatarBg = getAvatarGradient(u.email);
                  const merchantStatus =
                    u.profile?.vendor_status ||
                    u.vendor_status ||
                    (u.role === 'VENDOR' ? 'PENDING' : 'N/A');

                  return (
                    <tr key={u.id} style={tableDataRowStyles}>
                      {/* User Profile Cell (Avatar + 2-line name & email) */}
                      <td style={tableDataCellStyles}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ ...avatarCircleStyles, background: avatarBg }}>
                            {initials}
                          </div>
                          <div>
                            <div style={userNameTextStyles}>{fullName}</div>
                            <div style={userEmailTextStyles}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={tableDataCellStyles}>
                        <span style={rolePillStyles(u.role)}>{u.role}</span>
                      </td>

                      {/* Login Status Badge */}
                      <td style={tableDataCellStyles}>
                        <div style={statusIndicatorWrapperStyles}>
                          <span style={statusDotStyles(u.status === 'ACTIVE')} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: u.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                            {u.status}
                          </span>
                        </div>
                      </td>

                      {/* Merchant Status Badge */}
                      <td style={tableDataCellStyles}>
                        {u.role === 'VENDOR' ? (
                          <span style={merchantBadgeStyles(merchantStatus)}>
                            {merchantStatus === 'APPROVED' && '✓ '}
                            {merchantStatus === 'PENDING' && '⏳ '}
                            {merchantStatus === 'REJECTED' && '✕ '}
                            {merchantStatus}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Date Joined */}
                      <td style={tableDataCellStyles}>
                        <span style={{ fontSize: '13px', color: '#4b5563' }}>
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tableDataCellStyles, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          style={inspectBtnStyles}
                        >
                          Inspect Account
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
            <div style={paginationFooterStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={paginationNavBtnStyles}
              >
                Previous
              </button>
              <span style={paginationTextStyles}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={paginationNavBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inspect User Modal (Modern & Spacious) */}
      {selectedUser && (
        <div style={modalBackdropOverlayStyles}>
          <div style={modalDialogCardStyles}>
            {/* Modal Header */}
            <div style={modalHeaderContainerStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    ...avatarCircleStyles,
                    width: '52px',
                    height: '52px',
                    fontSize: '18px',
                    background: getAvatarGradient(selectedUser.email),
                  }}
                >
                  {getInitials(selectedUser.first_name, selectedUser.last_name, selectedUser.email)}
                </div>
                <div>
                  <h3 style={modalUserFullNameStyles}>
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : 'Account Overview'}
                  </h3>
                  <p style={modalUserEmailStyles}>{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={modalCloseIconBtnStyles}
              >
                &times;
              </button>
            </div>

            {/* Organized Detail Sections */}
            <div style={modalBodyContentStyles}>
              {/* Section 1: Account & Profile Details */}
              <div style={infoSectionCardStyles}>
                <div style={infoSectionHeaderStyles}>Account & Contact Details</div>
                <div style={infoGridTwoColStyles}>
                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Account Role</span>
                    <div>
                      <span style={rolePillStyles(selectedUser.role)}>{selectedUser.role}</span>
                    </div>
                  </div>

                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Login Access Status</span>
                    <div style={statusIndicatorWrapperStyles}>
                      <span style={statusDotStyles(selectedUser.status === 'ACTIVE')} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: selectedUser.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>

                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Phone Number</span>
                    <span style={infoFieldValueStyles}>
                      {selectedUser.phone || selectedUser.profile?.phone_number || 'None provided'}
                    </span>
                  </div>

                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Email Verified</span>
                    <span style={infoFieldValueStyles}>
                      {selectedUser.is_email_verified ? '✓ Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Date Registered</span>
                    <span style={infoFieldValueStyles}>
                      {selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div style={infoFieldBlockStyles}>
                    <span style={infoFieldLabelStyles}>Last Activity</span>
                    <span style={infoFieldValueStyles}>
                      {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never logged in'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Merchant Store & Verification (if VENDOR) */}
              {selectedUser.role === 'VENDOR' && (
                <div style={infoSectionCardStyles}>
                  <div style={infoSectionHeaderStyles}>Merchant Store & Verification</div>
                  <div style={merchantReviewBoxStyles}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={infoFieldLabelStyles}>Current Store Status</span>
                      <span
                        style={merchantBadgeStyles(
                          selectedUser.profile?.vendor_status || selectedUser.vendor_status || 'PENDING'
                        )}
                      >
                        {selectedUser.profile?.vendor_status || selectedUser.vendor_status || 'PENDING'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                      {(selectedUser.profile?.vendor_status === 'PENDING' ||
                        selectedUser.vendor_status === 'PENDING' ||
                        !selectedUser.profile?.vendor_status) && (
                        <>
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() => handleApproveVendor(selectedUser)}
                            style={approveMerchantActionBtnStyles}
                          >
                            {isActionPending ? 'Processing...' : '✓ Approve Merchant Store'}
                          </button>
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() => handleRejectVendor(selectedUser)}
                            style={rejectMerchantActionBtnStyles}
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
                          style={suspendMerchantActionBtnStyles}
                        >
                          {isActionPending ? 'Processing...' : 'Suspend Merchant Store'}
                        </button>
                      )}

                      {(selectedUser.profile?.vendor_status === 'SUSPENDED' ||
                        selectedUser.vendor_status === 'SUSPENDED' ||
                        selectedUser.profile?.vendor_status === 'REJECTED') && (
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleApproveVendor(selectedUser)}
                          style={approveMerchantActionBtnStyles}
                        >
                          {isActionPending ? 'Processing...' : '✓ Re-activate Merchant Store'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          navigate('/vendors');
                        }}
                        style={openVendorDirectoryBtnStyles}
                      >
                        Open Vendors Directory →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Security & Login Controls */}
              {selectedUser.role !== 'ADMIN' && (
                <div style={securitySectionStyles}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>
                      Login Access Control
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {selectedUser.status === 'ACTIVE'
                        ? 'Prevent this user from logging into the platform.'
                        : 'Restore user login access to the platform.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => handleToggleLoginStatus(selectedUser)}
                    style={selectedUser.status === 'ACTIVE' ? suspendLoginBtnStyles : activateLoginBtnStyles}
                  >
                    {isActionPending
                      ? 'Updating...'
                      : selectedUser.status === 'ACTIVE'
                      ? 'Suspend Login Access'
                      : 'Restore Login Access'}
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
// Styling Tokens (Polished, Spacious, High-End Layout)
// ----------------------------------------------------------
const pageContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  maxWidth: '1380px',
  margin: '0 auto',
};

const headerSectionStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const pageTitleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '-0.5px',
  margin: 0,
};

const pageSubtitleStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  marginTop: '4px',
};

// KPI Cards Grid
const kpiGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
};

const kpiCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '18px 20px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const kpiIconWrapperStyles = (bg: string, color: string): React.CSSProperties => ({
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  backgroundColor: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const kpiLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const kpiValueStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#0f172a',
  marginTop: '2px',
};

// Toolbar & Segmented Tabs
const toolbarCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const toolbarTopRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const searchContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  flex: 1,
  maxWidth: '480px',
  overflow: 'hidden',
};

const searchInputFieldStyles: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  border: 'none',
  outline: 'none',
  fontSize: '13.5px',
  backgroundColor: 'transparent',
  color: '#0f172a',
};

const clearSearchBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '0 8px',
};

const searchSubmitBtnStyles: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  border: 'none',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

const statusSelectGroupStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterSmallLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#64748b',
};

const dropdownSelectStyles: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  color: '#0f172a',
  outline: 'none',
  cursor: 'pointer',
};

const tabBarStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '12px',
};

const tabBtnStyles = (isActive: boolean, hasHighlight = false): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: isActive ? 700 : 600,
  color: isActive ? '#ffffff' : hasHighlight ? '#c2410c' : '#475569',
  backgroundColor: isActive ? '#0f172a' : hasHighlight ? '#fff7ed' : '#f8fafc',
  border: isActive ? '1px solid #0f172a' : hasHighlight ? '1px solid #fed7aa' : '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const pendingPillBadgeStyles: React.CSSProperties = {
  backgroundColor: '#ea580c',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 800,
  padding: '1px 6px',
  borderRadius: '9999px',
};

// Table Styles
const tableContainerCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  overflow: 'hidden',
};

const spaciousTableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeadRowStyles: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};

const tableHeadCellStyles: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableDataRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.12s ease',
};

const tableDataCellStyles: React.CSSProperties = {
  padding: '16px 20px',
  verticalAlign: 'middle',
};

const avatarCircleStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '14px',
  flexShrink: 0,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const userNameTextStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#0f172a',
};

const userEmailTextStyles: React.CSSProperties = {
  fontSize: '12.5px',
  color: '#64748b',
  marginTop: '2px',
};

const rolePillStyles = (role: string): React.CSSProperties => {
  let bg = '#eff6ff';
  let color = '#1d4ed8';
  let border = '#bfdbfe';

  if (role === 'VENDOR') {
    bg = '#fff7ed';
    color = '#c2410c';
    border = '#fed7aa';
  } else if (role === 'ADMIN') {
    bg = '#faf5ff';
    color = '#7e22ce';
    border = '#e9d5ff';
  }

  return {
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    display: 'inline-block',
  };
};

const statusIndicatorWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const statusDotStyles = (isActive: boolean): React.CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: isActive ? '#22c55e' : '#ef4444',
  boxShadow: isActive ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : '0 0 0 3px rgba(239, 68, 68, 0.2)',
});

const merchantBadgeStyles = (status: string): React.CSSProperties => {
  let bg = '#fff7ed';
  let color = '#c2410c';
  let border = '#fed7aa';

  if (status === 'APPROVED') {
    bg = '#f0fdf4';
    color = '#15803d';
    border = '#bbf7d0';
  } else if (status === 'REJECTED' || status === 'SUSPENDED') {
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  } else if (status === 'N/A') {
    bg = '#f8fafc';
    color = '#64748b';
    border = '#e2e8f0';
  }

  return {
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    display: 'inline-block',
  };
};

const inspectBtnStyles: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  padding: '7px 14px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const paginationFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
};

const paginationNavBtnStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  padding: '7px 14px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
};

const paginationTextStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
};

// Modal Styles
const modalBackdropOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalDialogCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  maxWidth: '560px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  border: '1px solid #e2e8f0',
};

const modalHeaderContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 24px 20px',
  borderBottom: '1px solid #f1f5f9',
};

const modalUserFullNameStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#0f172a',
  margin: 0,
};

const modalUserEmailStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '2px 0 0 0',
};

const modalCloseIconBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  lineHeight: 1,
};

const modalBodyContentStyles: React.CSSProperties = {
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const infoSectionCardStyles: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px',
};

const infoSectionHeaderStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '12px',
};

const infoGridTwoColStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const infoFieldBlockStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const infoFieldLabelStyles: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#64748b',
};

const infoFieldValueStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
};

const merchantReviewBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '14px',
};

const approveMerchantActionBtnStyles: React.CSSProperties = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const rejectMerchantActionBtnStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#dc2626',
  border: '1px solid #f87171',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const suspendMerchantActionBtnStyles: React.CSSProperties = {
  backgroundColor: '#d97706',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const openVendorDirectoryBtnStyles: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
};

const securitySectionStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
};

const suspendLoginBtnStyles: React.CSSProperties = {
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const activateLoginBtnStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  border: '1px solid #bfdbfe',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};
