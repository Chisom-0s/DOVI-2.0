const fs = require('fs');
const path = require('path');

const usersPagePath = path.join(__dirname, '..', 'admin', 'src', 'pages', 'UsersPage.tsx');
let content = fs.readFileSync(usersPagePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Patch pagination and stats
const targetState = `  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);`;

const replaceState = `  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDbCount, setTotalDbCount] = useState(0);
  const [dbUsers, setDbUsers] = useState<User[]>([]);`;

if (content.includes(targetState)) {
  content = content.replace(targetState, replaceState);
  console.log('Patched pagination state');
}

// 2. Patch fetchUsers to populate totalDbCount and dbUsers
const targetFetch = `      setUsers(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);`;

const replaceFetch = `      setUsers(res.results || []);
      setTotalDbCount(typeof res.count === 'number' ? res.count : (res.results?.length || 0));
      setTotalPages(Math.ceil((res.count || res.results?.length || 1) / 20) || 1);
      try {
        const stored = localStorage.getItem('dovi_admin_users_db');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) setDbUsers(parsed);
        }
      } catch {}`;

if (content.includes(targetFetch)) {
  content = content.replace(targetFetch, replaceFetch);
  console.log('Patched fetchUsers');
}

// 3. Patch stats calculation
const targetStats = `  // KPI Statistics Summary
  const stats = useMemo(() => {
    const total = users.length;
    const buyers = users.filter(u => u.role === 'BUYER').length;
    const vendors = users.filter(u => u.role === 'VENDOR').length;
    const pendingVendors = users.filter(
      u => u.role === 'VENDOR' && (u.profile?.vendor_status === 'PENDING' || u.vendor_status === 'PENDING' || !u.profile?.vendor_status)
    ).length;
    return { total, buyers, vendors, pendingVendors };
  }, [users]);`;

const replaceStats = `  // Authoritative KPI Statistics Summary
  const stats = useMemo(() => {
    const source = dbUsers.length > 0 ? dbUsers : users;
    const total = Math.max(totalDbCount, source.length);
    const buyers = source.filter((u) => u.role === 'BUYER').length;
    const vendors = source.filter((u) => u.role === 'VENDOR').length;
    const admins = source.filter((u) => u.role === 'ADMIN').length;
    const active = source.filter((u) => u.status === 'ACTIVE' || (u.is_active !== false && u.status !== 'SUSPENDED')).length;
    const suspended = source.filter((u) => u.status === 'SUSPENDED' || u.is_active === false).length;
    const pendingVendors = source.filter(
      (u) =>
        u.role === 'VENDOR' &&
        (u.profile?.vendor_status === 'PENDING' || u.vendor_status === 'PENDING' || !u.profile?.vendor_status)
    ).length;
    return { total, buyers, vendors, admins, active, suspended, pendingVendors };
  }, [users, dbUsers, totalDbCount]);`;

if (content.includes(targetStats)) {
  content = content.replace(targetStats, replaceStats);
  console.log('Patched stats calculation');
}

// 4. Patch KPI Cards to include Active and Suspended accounts
const targetKpi = `{/* KPI Overview Cards */}
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
      </div>`;

const replaceKpi = `{/* Authoritative KPI Overview Cards */}
      <div style={{ ...kpiGridStyles, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
            <div style={kpiLabelStyles}>Total Customers</div>
            <div style={kpiValueStyles}>{stats.total}</div>
          </div>
        </div>

        <div
          onClick={() => setLoginStatusFilter(loginStatusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          style={{
            ...kpiCardStyles,
            cursor: 'pointer',
            borderColor: loginStatusFilter === 'ACTIVE' ? '#10b981' : '#e5e7eb',
            backgroundColor: loginStatusFilter === 'ACTIVE' ? '#f0fdf4' : '#ffffff',
          }}
        >
          <div style={kpiIconWrapperStyles('#ecfdf5', '#059669')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={kpiLabelStyles}>Active Accounts</div>
            <div style={{ ...kpiValueStyles, color: '#059669' }}>{stats.active}</div>
          </div>
        </div>

        <div
          onClick={() => setLoginStatusFilter(loginStatusFilter === 'SUSPENDED' ? 'ALL' : 'SUSPENDED')}
          style={{
            ...kpiCardStyles,
            cursor: 'pointer',
            borderColor: loginStatusFilter === 'SUSPENDED' ? '#ef4444' : '#e5e7eb',
            backgroundColor: loginStatusFilter === 'SUSPENDED' ? '#fef2f2' : '#ffffff',
          }}
        >
          <div style={kpiIconWrapperStyles('#fff1f2', '#e11d48')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div>
            <div style={kpiLabelStyles}>Suspended</div>
            <div style={{ ...kpiValueStyles, color: stats.suspended > 0 ? '#e11d48' : '#6b7280' }}>
              {stats.suspended}
            </div>
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
            <div style={kpiLabelStyles}>Vendors</div>
            <div style={kpiValueStyles}>{stats.vendors}</div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab(activeTab === 'PENDING_VENDOR' ? 'ALL' : 'PENDING_VENDOR')}
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
              Pending Review
            </div>
            <div style={{ ...kpiValueStyles, color: stats.pendingVendors > 0 ? '#c2410c' : '#1f2937' }}>
              {stats.pendingVendors}
            </div>
          </div>
        </div>
      </div>`;

if (content.includes(targetKpi)) {
  content = content.replace(targetKpi, replaceKpi);
  console.log('Patched KPI cards');
}

// 5. Patch Table Headers
const targetHeaders = `<th style={tableHeadCellStyles}>User Profile</th>
                  <th style={tableHeadCellStyles}>Role</th>
                  <th style={tableHeadCellStyles}>Login Access</th>
                  <th style={tableHeadCellStyles}>Merchant Verification</th>
                  <th style={tableHeadCellStyles}>Date Registered</th>
                  <th style={{ ...tableHeadCellStyles, textAlign: 'right' }}>Actions</th>`;

const replaceHeaders = `<th style={tableHeadCellStyles}>Customer</th>
                  <th style={tableHeadCellStyles}>Phone Number</th>
                  <th style={tableHeadCellStyles}>Role</th>
                  <th style={tableHeadCellStyles}>Account Status</th>
                  <th style={tableHeadCellStyles}>Orders</th>
                  <th style={tableHeadCellStyles}>Date Registered</th>
                  <th style={{ ...tableHeadCellStyles, textAlign: 'right' }}>Actions</th>`;

if (content.includes(targetHeaders)) {
  content = content.replace(targetHeaders, replaceHeaders);
  console.log('Patched Table Headers');
}

// 6. Patch Table Row Cells
const targetRowCells = `{/* Role Badge */}
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {u.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handlePromote(u)}
                              title="Promote to Administrator"
                              style={quickPromoteBtnStyles}
                            >
                              🛡️ Promote
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Details"
                            style={quickEditBtnStyles}
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            style={inspectBtnStyles}
                          >
                            Inspect
                          </button>
                        </div>
                      </td>`;

const replaceRowCells = `{/* Phone Number */}
                      <td style={tableDataCellStyles}>
                        <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>
                          {u.phone || u.profile?.phone_number || '—'}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td style={tableDataCellStyles}>
                        <span style={rolePillStyles(u.role)}>{u.role}</span>
                      </td>

                      {/* Account Status Badge */}
                      <td style={tableDataCellStyles}>
                        <div style={statusIndicatorWrapperStyles}>
                          <span style={statusDotStyles(u.status === 'ACTIVE')} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: u.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                            {u.status || (u.is_active ? 'ACTIVE' : 'SUSPENDED')}
                          </span>
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td style={tableDataCellStyles}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: (u.orders_count || 0) > 0 ? '#e0f2fe' : '#f1f5f9',
                            color: (u.orders_count || 0) > 0 ? '#0369a1' : '#64748b',
                          }}
                        >
                          {u.orders_count !== undefined ? u.orders_count : 0} orders
                        </span>
                      </td>

                      {/* Date Joined */}
                      <td style={tableDataCellStyles}>
                        <span style={{ fontSize: '13px', color: '#4b5563' }}>
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tableDataCellStyles, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleLoginStatus(u)}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid',
                              cursor: 'pointer',
                              borderColor: u.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0',
                              color: u.status === 'ACTIVE' ? '#b91c1c' : '#15803d',
                              backgroundColor: u.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4',
                            }}
                            title={u.status === 'ACTIVE' ? 'Suspend account login access' : 'Reactivate account'}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Details"
                            style={quickEditBtnStyles}
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            style={inspectBtnStyles}
                          >
                            View
                          </button>
                        </div>
                      </td>`;

if (content.includes(targetRowCells)) {
  content = content.replace(targetRowCells, replaceRowCells);
  console.log('Patched Table Row Cells');
}

fs.writeFileSync(usersPagePath, content, 'utf8');
console.log('UsersPage.tsx successfully updated.');
