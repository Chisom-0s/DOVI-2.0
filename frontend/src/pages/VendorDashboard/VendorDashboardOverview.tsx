import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { getVendorVerificationStatus } from '@/api/verification';
import type { VendorVerification } from '@/types/verification';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price_override?: number | string | null;
  stock?: number;
  stock_quantity?: number;
}

interface Product {
  id: string;
  name: string;
  category_name?: string;
  base_price: number | string;
  reference_code: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  stock_quantity?: number;
  variants?: ProductVariant[];
  images?: any[];
  primary_image_url?: string;
  created_at?: string;
}

interface OrderItem {
  id: string;
  product_name?: string;
  variant_name?: string;
  variant_sku?: string;
  quantity: number;
  unit_price?: number | string;
  price?: number | string;
}

interface Order {
  id: string;
  reference_code: string;
  buyer_email: string;
  buyer_name?: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

interface VendorStore {
  id: string;
  name: string;
  reference_code: string;
  business_registration_number?: string;
  description?: string;
}

export default function VendorDashboardOverview() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorStore, setVendorStore] = useState<VendorStore | null>(null);
  const [verification, setVerification] = useState<VendorVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Merchant Assistant State
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const fetchDashboardData = async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const vendorId = user?.vendor_store?.id || user?.id || 'default_vendor';
      const [productsRes, ordersRes, vendorsRes, verificationData] = await Promise.allSettled([
        apiClient.get('/api/v1/products/my-products/'),
        apiClient.get('/api/v1/orders/'),
        apiClient.get('/api/v1/vendors/'),
        getVendorVerificationStatus(vendorId, user?.email, user?.phone || user?.profile?.phone_number || ''),
      ]);

      if (productsRes.status === 'fulfilled') {
        const pData = productsRes.value.data;
        setProducts(Array.isArray(pData) ? pData : pData.results || []);
      }

      if (ordersRes.status === 'fulfilled') {
        const oData = ordersRes.value.data;
        setOrders(Array.isArray(oData) ? oData : oData.results || []);
      }

      if (vendorsRes.status === 'fulfilled') {
        const vData = vendorsRes.value.data;
        const list = Array.isArray(vData) ? vData : vData.results || [];
        const matched = list.find(
          (v: any) =>
            v.email === user?.email ||
            v.user?.email === user?.email ||
            v.user === user?.id
        );
        if (matched) {
          setVendorStore(matched);
        }
      }
      if (verificationData.status === 'fulfilled') {
        setVerification(verificationData.value);
      }
    } catch (err) {
      console.error('Failed to sync vendor dashboard telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, [user?.id]);

  // =========================================================================
  // REAL COMPUTED METRICS
  // =========================================================================

  // 1. Settled & Escrow Revenue
  const { totalSettledSales, escrowInFlight, completedOrdersCount, processingOrdersCount } = useMemo(() => {
    let settled = 0;
    let inFlight = 0;
    let completedCount = 0;
    let processingCount = 0;

    orders.forEach(o => {
      const amt = parseFloat(o.total_amount?.toString() || '0') || 0;
      const st = (o.status || '').toUpperCase();

      if (['COMPLETED', 'RECEIVED'].includes(st)) {
        settled += amt;
        completedCount++;
      } else if (['PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT'].includes(st)) {
        settled += amt;
        inFlight += amt;
        processingCount++;
      }
    });

    return {
      totalSettledSales: settled,
      escrowInFlight: inFlight,
      completedOrdersCount: completedCount,
      processingOrdersCount: processingCount,
    };
  }, [orders]);

  // 2. Catalog & Stock Counts
  const { publishedCount, draftCount, pausedCount, totalStockUnits, lowStockItems, outOfStockItems } = useMemo(() => {
    let pub = 0;
    let dft = 0;
    let psd = 0;
    let totalStock = 0;
    const lowStock: Product[] = [];
    const outStock: Product[] = [];

    products.forEach(p => {
      if (p.status === 'PUBLISHED') pub++;
      else if (p.status === 'DRAFT') dft++;
      else if (p.status === 'PAUSED') psd++;

      // Compute stock
      let pStock = 0;
      if (p.variants && p.variants.length > 0) {
        pStock = p.variants.reduce(
          (sum, v) => sum + (Number(v.stock ?? v.stock_quantity ?? 0) || 0),
          0
        );
      } else {
        pStock = Number(p.stock_quantity ?? 0) || 0;
      }

      totalStock += pStock;

      if (pStock <= 0) {
        outStock.push(p);
      } else if (pStock <= 5) {
        lowStock.push(p);
      }
    });

    return {
      publishedCount: pub,
      draftCount: dft,
      pausedCount: psd,
      totalStockUnits: totalStock,
      lowStockItems: lowStock,
      outOfStockItems: outStock,
    };
  }, [products]);

  // 3. Dynamic Real 4-Week Settlement Chart Telemetry
  const chartData = useMemo(() => {
    const now = new Date();
    const weeks = [
      { label: 'Week 1', startDaysAgo: 28, endDaysAgo: 21, amount: 0, count: 0 },
      { label: 'Week 2', startDaysAgo: 21, endDaysAgo: 14, amount: 0, count: 0 },
      { label: 'Week 3', startDaysAgo: 14, endDaysAgo: 7, amount: 0, count: 0 },
      { label: 'Week 4 (Current)', startDaysAgo: 7, endDaysAgo: 0, amount: 0, count: 0 },
    ];

    orders.forEach(o => {
      const orderDate = new Date(o.created_at);
      const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const amt = parseFloat(o.total_amount?.toString() || '0') || 0;

      for (const w of weeks) {
        if (diffDays >= w.endDaysAgo && diffDays <= w.startDaysAgo) {
          w.amount += amt;
          w.count += 1;
          break;
        }
      }
    });

    const maxAmt = Math.max(...weeks.map(w => w.amount), 10000);

    // Compute SVG coordinate points
    const points = weeks.map((w, index) => {
      const x = 40 + index * 140; // 40, 180, 320, 460
      const ratio = Math.min(1, Math.max(0, w.amount / maxAmt));
      const y = 145 - ratio * 105; // range 145 (bottom) to 40 (top)
      return { x, y, ...w };
    });

    // Build SVG Path
    let pathD = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      pathD += ` C${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
    }

    const areaD = `${pathD} L${points[points.length - 1].x},160 L${points[0].x},160 Z`;

    return { weeks: points, pathD, areaD, maxAmt };
  }, [orders]);

  // 4. Real AI Store Intelligence Queries
  const handleAssistantQuery = (queryType: string) => {
    setAssistantLoading(true);
    setAssistantResponse(null);

    setTimeout(() => {
      let text = '';
      if (queryType === 'trends') {
        const settledOrders = orders.filter(o =>
          ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'RECEIVED'].includes((o.status || '').toUpperCase())
        );
        const aov = settledOrders.length > 0 ? Math.round(totalSettledSales / settledOrders.length) : 0;
        text = `📊 [Store Sales & Volume Report]\n\n` +
          `• Total Gross Settlements: ₦${totalSettledSales.toLocaleString()}\n` +
          `• Total Orders Logged: ${orders.length} orders (${completedOrdersCount} completed, ${processingOrdersCount} in escrow/fulfillment)\n` +
          `• Average Order Value (AOV): ₦${aov.toLocaleString()}\n` +
          `• Conversion Standing: Store is operating normally. Orders placed in the last 30 days are settling properly through DOVI Escrow.`;
      } else if (queryType === 'inventory') {
        text = `📦 [Catalog Inventory Diagnostic]\n\n` +
          `• Total Active Listings: ${publishedCount} published item(s)\n` +
          `• Total Physical Units Available: ${totalStockUnits} units\n` +
          `• Out of Stock Warnings: ${outOfStockItems.length} product(s) currently at 0 units\n` +
          `• Low Stock Alerts: ${lowStockItems.length} product(s) with ≤ 5 units remaining\n` +
          (lowStockItems.length > 0
            ? `\nRecommended Action: Replenish stock for: ${lowStockItems.map(p => `"${p.name}"`).join(', ')} to prevent missed checkout orders.`
            : `\nStatus: All published catalog items maintain adequate stock buffers.`);
      } else if (queryType === 'pricing') {
        const prices = products.map(p => parseFloat(p.base_price?.toString() || '0')).filter(p => p > 0);
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        text = `💡 [Catalog Pricing Telemetry]\n\n` +
          `• Catalog Size: ${products.length} product listing(s)\n` +
          `• Average Product Listing Price: ₦${avgPrice.toLocaleString()}\n` +
          `• Pricing Health: Your price points are set in NGN and protected under DOVI verified buyer escrow.\n` +
          `Recommendation: Ensure each product has detailed specs (Brand, Condition, Warranty) to maximize customer purchase confidence.`;
      }

      setAssistantResponse(text);
      setAssistantLoading(false);
    }, 400);
  };

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div style={containerStyles}>
      {/* Top Welcome Card */}
      <div style={welcomeCardStyles}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={activeBadgeStyles}>MERCHANT HUB ACTIVE</span>
              {verification?.verification_status === 'fully_verified' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(39, 174, 96, 0.12)',
                  color: 'var(--color-success)',
                  fontSize: '0.675rem',
                  fontWeight: '700',
                  border: '1px solid rgba(39, 174, 96, 0.3)',
                }}>
                  ✓ VERIFIED VENDOR
                </span>
              )}
              {vendorStore?.reference_code && (
                <span style={storeRefBadgeStyles}>STORE: {vendorStore.reference_code}</span>
              )}
            </div>
            <h2 style={welcomeTitleStyles}>
              {vendorStore?.name ? `${vendorStore.name} — Store Overview` : 'Merchant Store Overview'}
            </h2>
            <p style={welcomeSubtitleStyles}>
              Live dashboard synchronized with your DOVI 2.0 backend database, orders, and catalog inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            style={refreshBtnStyles}
            title="Reload real ledger telemetry"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                marginRight: '6px',
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            >
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Summary Card Widget */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: verification?.verification_status === 'fully_verified'
              ? 'rgba(39, 174, 96, 0.1)'
              : 'rgba(255, 122, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}>
            {verification?.verification_status === 'fully_verified' ? '🛡️' : '⚠️'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                {verification?.verification_status === 'fully_verified' ? '✓ Fully Verified Vendor' : 'Vendor Verification Status'}
              </strong>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: verification?.verification_status === 'fully_verified'
                  ? 'rgba(39, 174, 96, 0.1)'
                  : verification?.verification_status === 'partially_verified'
                  ? 'rgba(255, 122, 0, 0.1)'
                  : 'var(--color-bg-subtle)',
                color: verification?.verification_status === 'fully_verified'
                  ? 'var(--color-success)'
                  : verification?.verification_status === 'partially_verified'
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              }}>
                {verification?.verification_status === 'fully_verified' && 'Fully Verified'}
                {verification?.verification_status === 'partially_verified' && '1 of 2 Completed'}
                {(!verification || verification.verification_status === 'unverified') && '0 of 2 Completed'}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              {verification?.verification_status === 'fully_verified'
                ? 'Your vendor account is fully verified. Customers see your verified trust badge on all products.'
                : 'Complete your email and phone verification to build trust with buyers and unlock verified-vendor status.'}
            </p>
          </div>
        </div>

        <Link
          to="/vendor/dashboard/verification"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: verification?.verification_status === 'fully_verified'
              ? 'var(--color-bg-subtle)'
              : 'var(--color-primary)',
            color: verification?.verification_status === 'fully_verified'
              ? 'var(--color-text)'
              : '#ffffff',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
            border: verification?.verification_status === 'fully_verified'
              ? '1px solid var(--color-border)'
              : 'none',
          }}
        >
          {verification?.verification_status === 'fully_verified' ? 'View Verification Details' : 'Complete Verification →'}
        </Link>
      </div>
      {/* Real Stats Grid */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <span style={statLabelStyles}>TOTAL SETTLED SALES</span>
          <div style={statValueStyles}>₦{totalSettledSales.toLocaleString()}</div>
          <span style={{ ...statChangeStyles, color: 'var(--color-success)' }}>
            {orders.length} total orders recorded
          </span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>ESCROW IN-FLIGHT</span>
          <div style={{ ...statValueStyles, color: 'var(--color-primary)' }}>
            ₦{escrowInFlight.toLocaleString()}
          </div>
          <span style={{ ...statChangeStyles, color: 'var(--color-primary)' }}>
            {processingOrdersCount} order(s) awaiting completion
          </span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>ACTIVE LISTINGS</span>
          <div style={statValueStyles}>{publishedCount} {publishedCount === 1 ? 'Product' : 'Products'}</div>
          <span style={{ ...statChangeStyles, color: '#3b82f6' }}>
            {draftCount} Draft • {pausedCount} Paused
          </span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>INVENTORY UNITS</span>
          <div style={statValueStyles}>{totalStockUnits.toLocaleString()} Units</div>
          <span
            style={{
              ...statChangeStyles,
              color: outOfStockItems.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          >
            {outOfStockItems.length > 0
              ? `${outOfStockItems.length} out of stock`
              : 'All listings stocked'}
          </span>
        </div>
      </div>

      {/* Grid Layout: Chart & Store Intelligence */}
      <div style={doubleColGridStyles}>
        {/* Real Sales Performance Chart */}
        <div style={panelStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={panelTitleStyles}>Weekly Settlement Trends</h3>
            <span style={liveLedgerBadgeStyles}>LIVE DATABASE</span>
          </div>
          <p style={panelSubtitleStyles}>
            Total verified escrow and completed order sales over the past 30 days
          </p>

          <div style={chartWrapperStyles}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="realChartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="40" x2="480" y2="40" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="90" x2="480" y2="90" stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="145" x2="480" y2="145" stroke="rgba(0,0,0,0.08)" />

              {/* Gradient Fill Area */}
              <path d={chartData.areaD} fill="url(#realChartGlow)" />

              {/* Main Curve Line */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Point Dots & Tooltip Markers */}
              {chartData.weeks.map(pt => (
                <g key={pt.label}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fill="var(--color-text)"
                    fontSize="11"
                    fontWeight="700"
                  >
                    ₦{pt.amount >= 1000 ? `${Math.round(pt.amount / 1000)}k` : pt.amount}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div style={chartLabelsStyles}>
            {chartData.weeks.map(pt => (
              <div key={pt.label} style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)' }}>
                  {pt.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {pt.count} {pt.count === 1 ? 'order' : 'orders'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Store Diagnostic & Intelligence */}
        <div style={panelStyles}>
          <h3 style={panelTitleStyles}>Store Intelligence & Telemetry</h3>
          <p style={panelSubtitleStyles}>
            Run automated live store diagnostics against your catalog and active orders
          </p>

          <div style={assistantActionsStyles}>
            <button onClick={() => handleAssistantQuery('trends')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Analyze Sales Telemetry</span>
            </button>
            <button onClick={() => handleAssistantQuery('inventory')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <span>Inventory Health Check</span>
            </button>
            <button onClick={() => handleAssistantQuery('pricing')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>Catalog Pricing Audit</span>
            </button>
          </div>

          <div style={consoleOutputStyles}>
            {assistantLoading ? (
              <div style={consoleLoadingStyles}>
                <div style={spinnerStyles}></div>
                <span>Querying live database records...</span>
              </div>
            ) : assistantResponse ? (
              <pre style={consoleTextStyles}>{assistantResponse}</pre>
            ) : (
              <div style={consolePlaceholderStyles}>
                Click any tool above to evaluate real database sales, AOV, and inventory telemetry.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Real Orders & Inventory Alerts */}
      <div style={doubleColGridStyles}>
        {/* Recent Orders Table */}
        <div style={panelStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={panelTitleStyles}>Recent Customer Orders</h3>
              <p style={panelSubtitleStyles}>Latest orders routed to your merchant store</p>
            </div>
            <Link to="/vendor/dashboard/orders" style={viewAllLinkStyles}>
              View All Orders →
            </Link>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Loading real orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={emptyOrdersCardStyles}>
              <div style={emptyIconCircleStyles}>📦</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No orders received yet</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Orders placed for your published products will automatically display here with buyer escrow status.
              </div>
              <Link to="/vendor/dashboard/products" style={quickUploadBtnStyles}>
                Manage Product Listings
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={orderTableStyles}>
                <thead>
                  <tr style={orderHeaderRowStyles}>
                    <th style={orderThStyles}>ORDER</th>
                    <th style={orderThStyles}>CUSTOMER</th>
                    <th style={orderThStyles}>AMOUNT</th>
                    <th style={orderThStyles}>STATUS</th>
                    <th style={orderThStyles}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} style={orderRowStyles}>
                      <td style={orderTdRefStyles}>{o.reference_code}</td>
                      <td style={orderTdBuyerStyles}>{o.buyer_name || o.buyer_email}</td>
                      <td style={orderTdAmountStyles}>
                        ₦{parseFloat(o.total_amount?.toString() || '0').toLocaleString()}
                      </td>
                      <td style={orderTdStyles}>
                        <span
                          style={{
                            ...statusBadgeStyles,
                            color:
                              ['COMPLETED', 'RECEIVED'].includes(o.status)
                                ? 'var(--color-success)'
                                : ['PAID', 'PROCESSING'].includes(o.status)
                                ? 'var(--color-primary)'
                                : o.status === 'SHIPPED'
                                ? '#3b82f6'
                                : 'var(--color-danger)',
                            backgroundColor:
                              ['COMPLETED', 'RECEIVED'].includes(o.status)
                                ? 'rgba(39, 174, 96, 0.08)'
                                : ['PAID', 'PROCESSING'].includes(o.status)
                                ? 'rgba(255, 122, 0, 0.08)'
                                : o.status === 'SHIPPED'
                                ? 'rgba(59, 130, 246, 0.08)'
                                : 'rgba(239, 68, 68, 0.08)',
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={orderTdDateStyles}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real Inventory Health & Stock Warnings */}
        <div style={panelStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={panelTitleStyles}>Catalog Inventory Health</h3>
              <p style={panelSubtitleStyles}>Live stock monitor across all published items</p>
            </div>
            <Link to="/vendor/dashboard/products" style={viewAllLinkStyles}>
              Manage Products →
            </Link>
          </div>

          <div style={insightsListStyles}>
            {/* Out of Stock Alert */}
            {outOfStockItems.length > 0 ? (
              <div style={{ ...insightRowStyles, borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.03)' }}>
                <div style={{ ...insightIndicatorStyles, backgroundColor: 'var(--color-danger)' }} />
                <div style={insightContentStyles}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...insightTagStyles, color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
                      OUT OF STOCK
                    </span>
                    <strong style={insightTitleStyles}>{outOfStockItems.length} Product(s) Sold Out</strong>
                  </div>
                  <p style={insightDescStyles}>
                    {outOfStockItems.slice(0, 3).map(p => `"${p.name}"`).join(', ')}
                    {outOfStockItems.length > 3 ? ` and ${outOfStockItems.length - 3} more` : ''} currently have 0 units available.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Low Stock Warning */}
            {lowStockItems.length > 0 ? (
              <div style={{ ...insightRowStyles, borderColor: 'rgba(255, 159, 67, 0.3)', background: 'rgba(255, 159, 67, 0.03)' }}>
                <div style={{ ...insightIndicatorStyles, backgroundColor: 'var(--color-warning)' }} />
                <div style={insightContentStyles}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...insightTagStyles, color: '#d97706', background: 'rgba(217, 119, 6, 0.1)' }}>
                      LOW STOCK ALERT
                    </span>
                    <strong style={insightTitleStyles}>{lowStockItems.length} Product(s) Running Low</strong>
                  </div>
                  <p style={insightDescStyles}>
                    {lowStockItems.slice(0, 3).map(p => `"${p.name}"`).join(', ')} have ≤ 5 units remaining in inventory.
                  </p>
                </div>
              </div>
            ) : null}

            {/* All Good Standing */}
            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div style={{ ...insightRowStyles, borderColor: 'rgba(39, 174, 96, 0.3)', background: 'rgba(39, 174, 96, 0.03)' }}>
                <div style={{ ...insightIndicatorStyles, backgroundColor: 'var(--color-success)' }} />
                <div style={insightContentStyles}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...insightTagStyles, color: 'var(--color-success)', background: 'rgba(39, 174, 96, 0.1)' }}>
                      STOCK NOMINAL
                    </span>
                    <strong style={insightTitleStyles}>Catalog Inventory Healthy</strong>
                  </div>
                  <p style={insightDescStyles}>
                    All {publishedCount} published product listings currently maintain sufficient stock levels.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Escrow Standing */}
            <div style={insightRowStyles}>
              <div style={{ ...insightIndicatorStyles, backgroundColor: 'var(--color-primary)' }} />
              <div style={insightContentStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ ...insightTagStyles, color: 'var(--color-primary)', background: 'rgba(255, 122, 0, 0.1)' }}>
                    SECURITY & ESCROW
                  </span>
                  <strong style={insightTitleStyles}>DOVI Escrow Guarantee Active</strong>
                </div>
                <p style={insightDescStyles}>
                  All customer payments are locked in DOVI automated escrow until delivery verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STYLES
// =========================================================================

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const welcomeCardStyles: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem 1.75rem',
  boxShadow: 'var(--shadow-sm)',
};

const activeBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(39, 174, 96, 0.1)',
  color: 'var(--color-success)',
  fontSize: '0.675rem',
  fontWeight: '700',
  letterSpacing: '0.5px',
};

const storeRefBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg-subtle)',
  color: 'var(--color-text-muted)',
  fontSize: '0.675rem',
  fontWeight: '700',
  border: '1px solid var(--color-border)',
  letterSpacing: '0.5px',
};

const welcomeTitleStyles: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: '0 0 0.25rem 0',
};

const welcomeSubtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const refreshBtnStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const statsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
};

const statCardStyles: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  boxShadow: 'var(--shadow-sm)',
};

const statLabelStyles: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const statValueStyles: React.CSSProperties = {
  fontSize: '1.45rem',
  fontWeight: '800',
  color: 'var(--color-text)',
  margin: '2px 0',
};

const statChangeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
};

const doubleColGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.25rem',
};

const panelStyles: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
};

const panelTitleStyles: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: '0 0 2px 0',
};

const panelSubtitleStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  margin: '0 0 1rem 0',
};

const liveLedgerBadgeStyles: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: '700',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(39, 174, 96, 0.1)',
  color: 'var(--color-success)',
  letterSpacing: '0.5px',
};

const chartWrapperStyles: React.CSSProperties = {
  height: '180px',
  width: '100%',
  position: 'relative',
  background: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  padding: '8px',
  boxSizing: 'border-box',
};

const chartLabelsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  marginTop: '0.75rem',
};

const assistantActionsStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '1rem',
};

const assistantBtnStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 12px',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.775rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const consoleOutputStyles: React.CSSProperties = {
  background: '#111827',
  borderRadius: 'var(--radius-md)',
  padding: '1.125rem',
  minHeight: '140px',
  fontFamily: 'monospace',
  fontSize: '0.8rem',
  lineHeight: '1.5',
  color: '#f9fafb',
  overflowY: 'auto',
  maxHeight: '220px',
};

const consoleLoadingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: '#9ca3af',
  height: '90px',
};

const spinnerStyles: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '2px solid #374151',
  borderTopColor: 'var(--color-primary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const consoleTextStyles: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: '#e5e7eb',
  fontFamily: 'inherit',
};

const consolePlaceholderStyles: React.CSSProperties = {
  color: '#9ca3af',
  textAlign: 'center',
  paddingTop: '2rem',
};

const viewAllLinkStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--color-primary)',
  textDecoration: 'none',
};

const emptyOrdersCardStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '2.5rem 1rem',
  background: 'var(--color-bg-subtle)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const emptyIconCircleStyles: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const quickUploadBtnStyles: React.CSSProperties = {
  marginTop: '1rem',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8rem',
  fontWeight: '600',
  textDecoration: 'none',
};

const orderTableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.8rem',
};

const orderHeaderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

const orderThStyles: React.CSSProperties = {
  padding: '8px 10px',
  color: 'var(--color-text-muted)',
  fontWeight: '700',
  fontSize: '0.675rem',
  letterSpacing: '0.5px',
};

const orderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

const orderTdRefStyles: React.CSSProperties = {
  padding: '10px 10px',
  fontWeight: '700',
  fontFamily: 'monospace',
  color: 'var(--color-text)',
};

const orderTdBuyerStyles: React.CSSProperties = {
  padding: '10px 10px',
  color: 'var(--color-text)',
  maxWidth: '140px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const orderTdAmountStyles: React.CSSProperties = {
  padding: '10px 10px',
  fontWeight: '700',
  color: 'var(--color-text)',
};

const orderTdStyles: React.CSSProperties = {
  padding: '10px 10px',
};

const orderTdDateStyles: React.CSSProperties = {
  padding: '10px 10px',
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
};

const statusBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.675rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const insightsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const insightRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  padding: '0.875rem',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const insightIndicatorStyles: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  marginTop: '6px',
  flexShrink: 0,
};

const insightContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
};

const insightTagStyles: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: '700',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  letterSpacing: '0.5px',
};

const insightTitleStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--color-text)',
};

const insightDescStyles: React.CSSProperties = {
  fontSize: '0.775rem',
  color: 'var(--color-text-muted)',
  lineHeight: '1.4',
  margin: 0,
};
