const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'admin', 'src', 'pages', 'DashboardOverviewPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Replace primaryCards definition
const targetCards = `  const primaryCards = [
    {
      label: revenueLabel,
      value: formatCurrency(data.revenue?.range_total),
      sub: \`Month: \${formatCurrency(data.revenue?.month)} · Today: \${formatCurrency(data.revenue?.today)}\`,
      icon: '💰',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      href: '/orders',
    },
    {
      label: 'Orders',
      value: \`\${orders.total} Total\`,
      sub: \`\${orders.in_fulfilment} in fulfilment · \${orders.completed} completed\`,
      icon: '📦',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      href: '/orders',
    },
    {
      label: 'Save2Own Capital',
      value: formatCurrency(data.save2own?.confirmed_amount),
      sub: \`\${data.save2own?.active_goals ?? 0} active goals · \${formatCurrency(data.save2own?.pending_amount)} pending\`,
      icon: '🎯',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      href: '/save2own',
    },
    {
      label: 'Registered Users',
      value: data.users?.total ?? 0,
      sub: \`+\${data.users?.new_today ?? 0} joined today (+\${data.users?.new_in_range ?? 0} in range)\`,
      icon: '👤',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      href: '/users',
    },
    {
      label: 'Vendors',
      value: data.vendors?.total ?? 0,
      sub: \`\${data.vendors?.pending ?? 0} pending review · \${data.vendors?.approved ?? 0} active\`,
      icon: '🏢',
      color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      href: '/vendors',
    },
    {
      label: 'Products Catalog',
      value: data.products?.total ?? 0,
      sub: 'All marketplace listings',
      icon: '🏷️',
      color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      href: '/products',
    },
  ];`;

const replaceCards = `  const primaryCards = [
    {
      label: 'Total Customers',
      value: data.users?.total ?? 0,
      sub: \`+\${data.users?.new_today ?? 0} joined today · \${data.users?.total ?? 0} registered\`,
      icon: '👥',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      href: '/users',
    },
    {
      label: 'Total Orders',
      value: \`\${orders.total} Orders\`,
      sub: \`\${orders.in_fulfilment} in fulfilment · \${orders.completed} completed\`,
      icon: '📦',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      href: '/orders',
    },
    {
      label: 'Pending Payments',
      value: \`\${data.payments_summary?.pending ?? 0} To Verify\`,
      sub: \`Bank transfers awaiting admin verification\`,
      icon: '⏳',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      href: '/payments?status=PENDING_VERIFICATION',
    },
    {
      label: 'Confirmed Payments',
      value: \`\${data.payments_summary?.successful ?? orders.completed} Verified\`,
      sub: \`\${formatCurrency(data.payments_summary?.verified_amount ?? data.revenue?.range_total)} collected\`,
      icon: '✅',
      color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      href: '/payments?status=PAID',
    },
    {
      label: revenueLabel,
      value: formatCurrency(data.revenue?.range_total),
      sub: \`Month: \${formatCurrency(data.revenue?.month)} · Today: \${formatCurrency(data.revenue?.today)}\`,
      icon: '💰',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      href: '/orders',
    },
    {
      label: 'Save2Own Goals',
      value: \`\${data.save2own?.total_goals ?? data.save2own?.active_goals ?? 0} Goals\`,
      sub: \`\${data.save2own?.active_goals ?? 0} active · \${formatCurrency(data.save2own?.confirmed_amount)} saved\`,
      icon: '🎯',
      color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      href: '/save2own',
    },
  ];`;

if (content.includes(targetCards)) {
  content = content.replace(targetCards, replaceCards);
  console.log('Patched primaryCards');
}

// 2. Add Operational Attention Required section right before KPI Cards Grid
const targetGridRender = `      {/* KPI Cards Grid */}
      <div style={gridStyles}>`;

const replaceGridRender = `      {/* Operational Attention Required Banner */}
      {((data.payments_summary?.pending ?? 0) > 0 || (data.vendors?.pending ?? 0) > 0 || (data.refunds?.pending ?? 0) > 0) && (
        <div style={operationalBannerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#92400e' }}>
                Operational Attention Required
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#b45309' }}>
                {data.payments_summary?.pending ?? 0} payment submissions awaiting verification · {data.vendors?.pending ?? 0} vendor applications pending review · {data.refunds?.pending ?? 0} pending refunds
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(data.payments_summary?.pending ?? 0) > 0 && (
              <a
                href="/payments?status=PENDING_VERIFICATION"
                style={actionNoticeBtnStyles('#b45309', '#fef3c7')}
              >
                Verify Payments ({data.payments_summary?.pending}) →
              </a>
            )}
            {(data.vendors?.pending ?? 0) > 0 && (
              <a
                href="/users"
                style={actionNoticeBtnStyles('#0369a1', '#e0f2fe')}
              >
                Review Vendors ({data.vendors?.pending}) →
              </a>
            )}
            {(data.refunds?.pending ?? 0) > 0 && (
              <a
                href="/refunds"
                style={actionNoticeBtnStyles('#991b1b', '#fee2e2')}
              >
                Review Refunds ({data.refunds?.pending}) →
              </a>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={gridStyles}>`;

if (content.includes(targetGridRender)) {
  content = content.replace(targetGridRender, replaceGridRender);
  console.log('Patched Grid Render with Operational Attention banner');
}

// 3. Add styling definitions at the end of the file
const stylingAddition = `
const operationalBannerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '12px',
  boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)',
};

const actionNoticeBtnStyles = (textColor: string, bgColor: string): React.CSSProperties => ({
  fontSize: '12px',
  fontWeight: 700,
  color: textColor,
  backgroundColor: bgColor,
  padding: '6px 14px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'opacity 150ms ease',
});
`;

content = content + stylingAddition;

fs.writeFileSync(pagePath, content, 'utf8');
console.log('DashboardOverviewPage.tsx successfully updated.');
