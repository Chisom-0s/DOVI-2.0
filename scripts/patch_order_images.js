const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/api/orders.ts
const ordersTsPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'orders.ts');
let ordersContent = fs.readFileSync(ordersTsPath, 'utf8');

if (!ordersContent.includes('resolveOrderDisplay')) {
  ordersContent = "import { resolveOrderDisplay, resolveItemDisplay } from '@/utils/orderImageHelper';\n" + ordersContent;
}

// Replace productNames and productImages mapping for local orders
ordersContent = ordersContent.replace(
  `        const items = lo.items || [];
        const productNames = items
          .map((i: any) => i.product?.name || i.product_name || i.name)
          .filter(Boolean);
        const productImages = items
          .map((i: any) => i.product?.primary_image_url || i.product?.image_url || i.image_url)
          .filter(Boolean);`,
  `        const items = lo.items || [];
        const display = resolveOrderDisplay(lo);
        const productNames = display.allNames.length > 0 ? display.allNames : items.map((i: any) => i.product?.name || i.product_name || i.name).filter(Boolean);
        const productImages = display.allImages;`
);

// Replace productNames and productImages mapping for server results
ordersContent = ordersContent.replace(
  `          const items = r.items || [];
          const productNames = r.product_names || items.map((i: any) => i.product?.name || i.name).filter(Boolean);
          const productImages = r.product_images || items.map((i: any) => i.product?.primary_image_url || i.product?.image_url || i.image_url).filter(Boolean);`,
  `          const items = r.items || [];
          const display = resolveOrderDisplay(r);
          const productNames = display.allNames.length > 0 ? display.allNames : (r.product_names || items.map((i: any) => i.product?.name || i.name).filter(Boolean));
          const productImages = display.allImages;`
);

fs.writeFileSync(ordersTsPath, ordersContent, 'utf8');
console.log('orders.ts updated successfully.');

// 2. Update DashboardOverviewPage.tsx
const dashboardPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard', 'DashboardOverviewPage.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

if (!dashboardContent.includes('resolveOrderDisplay')) {
  dashboardContent = "import { resolveOrderDisplay } from '@/utils/orderImageHelper';\n" + dashboardContent;
}

// Replace thumbnail resolution
dashboardContent = dashboardContent.replace(
  `                const payBadge = getPaymentBadgeInfo(order.payment_status);
                const fulfillBadge = getFulfillmentBadgeInfo(order.status, order.fulfillment_status);
                const thumbUrl =
                  order.product_images?.[0] ||
                  order.items?.[0]?.product?.primary_image_url ||
                  order.items?.[0]?.product?.image_url;
                const productName =
                  order.product_names?.[0] ||
                  order.items?.[0]?.product?.name ||
                  \`Order #\${order.reference}\`;
                const extraItemsCount = (order.item_count || 1) - 1;`,
  `                const payBadge = getPaymentBadgeInfo(order.payment_status);
                const fulfillBadge = getFulfillmentBadgeInfo(order.status, order.fulfillment_status);
                const display = resolveOrderDisplay(order);
                const thumbUrl = display.primaryImageUrl;
                const productName = display.primaryProductName;
                const extraItemsCount = Math.max(0, (order.item_count || 1) - 1);`
);

// Replace thumbnail rendering
dashboardContent = dashboardContent.replace(
  `                      {/* Product Thumbnail */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f3f4f6',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={productName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        )}
                      </div>`,
  `                      {/* Product Thumbnail */}
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e5e7eb',
                          padding: '2px',
                        }}
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={productName}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              const fallback = parent?.querySelector('.fallback-bag-icon') as HTMLElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <svg
                          className="fallback-bag-icon"
                          style={{ display: thumbUrl ? 'none' : 'block' }}
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                      </div>`
);

fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');
console.log('DashboardOverviewPage.tsx updated successfully.');

// 3. Update OrderHistoryPage.tsx
const orderHistoryPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Orders', 'OrderHistoryPage.tsx');
let orderHistoryContent = fs.readFileSync(orderHistoryPath, 'utf8');

if (!orderHistoryContent.includes('resolveOrderDisplay')) {
  orderHistoryContent = "import { resolveOrderDisplay } from '@/utils/orderImageHelper';\n" + orderHistoryContent;
}

orderHistoryContent = orderHistoryContent.replace(
  `            {data.results.map((order) => {
              const thumbUrl =
                order.product_images?.[0] ||
                order.items?.[0]?.product?.primary_image_url ||
                order.items?.[0]?.product?.image_url;
              const productName =
                order.product_names?.[0] ||
                order.items?.[0]?.product?.name ||
                \`Order #\${order.reference}\`;`,
  `            {data.results.map((order) => {
              const display = resolveOrderDisplay(order);
              const thumbUrl = display.primaryImageUrl;
              const productName = display.primaryProductName;`
);

orderHistoryContent = orderHistoryContent.replace(
  `                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={productName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                      )}
                    </div>`,
  `                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        padding: '2px',
                      }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={productName}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            const fallback = parent?.querySelector('.fallback-bag-icon') as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <svg
                        className="fallback-bag-icon"
                        style={{ display: thumbUrl ? 'none' : 'block' }}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>`
);

fs.writeFileSync(orderHistoryPath, orderHistoryContent, 'utf8');
console.log('OrderHistoryPage.tsx updated successfully.');
