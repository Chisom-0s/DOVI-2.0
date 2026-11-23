const fs = require('fs');
const path = require('path');

const checkoutTsPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'checkout.ts');
let content = fs.readFileSync(checkoutTsPath, 'utf8');

if (!content.includes('resolveItemDisplay')) {
  content = "import { resolveItemDisplay } from '@/utils/orderImageHelper';\n" + content;
}

// 1. In overlay.cart_snapshot mapping (approx line 422)
content = content.replace(
  `          items: (overlay.cart_snapshot?.items || []).map((ci, idx) => ({
            id: ci.id || \`oi_\${idx}\`,
            product: ci.product || {
              id: String(ci.product_id || \`prod_\${idx}\`),
              name: ci.product_name || 'Product',
              price: String(ci.unit_price || ci.price || '0'),
              primary_image_url: ci.image_url || null,`,
  `          items: (overlay.cart_snapshot?.items || []).map((ci, idx) => {
            const itemDisplay = resolveItemDisplay(ci);
            return {
            id: ci.id || \`oi_\${idx}\`,
            product: ci.product || {
              id: String(ci.product_id || \`prod_\${idx}\`),
              name: ci.product_name || itemDisplay.name || 'Product',
              price: String(ci.unit_price || ci.price || '0'),
              primary_image_url: ci.image_url || itemDisplay.imageUrl || null,`
);
// fix the closing bracket for map
content = content.replace(
  `              stock_quantity: 10,
              status: 'ACTIVE',
            },
            variant: ci.variant,
            quantity: ci.quantity,
            unit_price: String(ci.unit_price || ci.price || '0'),
            line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
          })),
          delivery_address:`,
  `              stock_quantity: 10,
              status: 'ACTIVE',
            },
            variant: ci.variant,
            quantity: ci.quantity,
            unit_price: String(ci.unit_price || ci.price || '0'),
            line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
          };
          }),
          delivery_address:`
);

// 2. In second overlay map (approx line 513)
content = content.replace(
  `          items: (overlay.cart_snapshot.items || []).map((ci, idx) => ({
            id: ci.id || \`oi_\${idx}\`,
            product: ci.product || {
              id: String(ci.product_id || \`prod_\${idx}\`),
              name: ci.product_name || 'Product',
              price: String(ci.unit_price || ci.price || '0'),
              primary_image_url: ci.image_url || null,`,
  `          items: (overlay.cart_snapshot.items || []).map((ci, idx) => {
            const itemDisplay = resolveItemDisplay(ci);
            return {
            id: ci.id || \`oi_\${idx}\`,
            product: ci.product || {
              id: String(ci.product_id || \`prod_\${idx}\`),
              name: ci.product_name || itemDisplay.name || 'Product',
              price: String(ci.unit_price || ci.price || '0'),
              primary_image_url: ci.image_url || itemDisplay.imageUrl || null,`
);
content = content.replace(
  `              stock_quantity: 10,
              status: 'ACTIVE',
            },
            variant: ci.variant,
            quantity: ci.quantity,
            unit_price: String(ci.unit_price || ci.price || '0'),
            line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
          })),
          delivery_address: overlay.delivery_address || resolvedAddress,`,
  `              stock_quantity: 10,
              status: 'ACTIVE',
            },
            variant: ci.variant,
            quantity: ci.quantity,
            unit_price: String(ci.unit_price || ci.price || '0'),
            line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
          };
          }),
          delivery_address: overlay.delivery_address || resolvedAddress,`
);

// 3. In manual quote order creation (approx line 643)
content = content.replace(
  `      items: rawItems.map((ci: any, idx: number) => ({
        id: ci.id || \`oi_\${idx}\`,
        product: ci.product || {
          id: String(ci.product_id || \`prod_\${idx}\`),
          name: ci.product_name || ci.name || 'Product',
          price: String(ci.unit_price || ci.price || '0'),
          primary_image_url: ci.image_url || null,`,
  `      items: rawItems.map((ci: any, idx: number) => {
        const itemDisplay = resolveItemDisplay(ci);
        return {
        id: ci.id || \`oi_\${idx}\`,
        product: ci.product || {
          id: String(ci.product_id || \`prod_\${idx}\`),
          name: ci.product_name || ci.name || itemDisplay.name || 'Product',
          price: String(ci.unit_price || ci.price || '0'),
          primary_image_url: ci.image_url || itemDisplay.imageUrl || null,`
);
content = content.replace(
  `        stock_quantity: 10,
        status: 'ACTIVE',
      },
      variant: typeof ci.variant === 'object' ? ci.variant : null,
      quantity: ci.quantity,
      unit_price: String(ci.unit_price || ci.price || '0'),
      line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
    })),
    delivery_address: resolvedAddress,`,
  `        stock_quantity: 10,
        status: 'ACTIVE',
      },
      variant: typeof ci.variant === 'object' ? ci.variant : null,
      quantity: ci.quantity,
      unit_price: String(ci.unit_price || ci.price || '0'),
      line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
    };
    }),
    delivery_address: resolvedAddress,`
);

fs.writeFileSync(checkoutTsPath, content, 'utf8');
console.log('checkout.ts updated.');
