const fs = require('fs');
const path = require('path');

// 1. In src/api/orders.ts: remove unused resolveItemDisplay import
const ordersPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'orders.ts');
let orders = fs.readFileSync(ordersPath, 'utf8');
orders = orders.replace(
  "import { resolveOrderDisplay, resolveItemDisplay } from '@/utils/orderImageHelper';",
  "import { resolveOrderDisplay } from '@/utils/orderImageHelper';"
);
fs.writeFileSync(ordersPath, orders, 'utf8');
console.log('Fixed orders.ts');

// 2. In src/contexts/CartContext.tsx: remove unused imports
const cartCtxPath = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'CartContext.tsx');
let cartCtx = fs.readFileSync(cartCtxPath, 'utf8');
cartCtx = cartCtx.replace(
  "import { getProductHomepagePlacement, isFlashSaleActiveNow, isDiscountActiveNow, resolveProductSellingPrice } from '@/services/homepagePlacementService';",
  "import { resolveProductSellingPrice } from '@/services/homepagePlacementService';"
);
fs.writeFileSync(cartCtxPath, cartCtx, 'utf8');
console.log('Fixed CartContext.tsx');

// 3. In src/pages/Checkout/CheckoutSessionPage.tsx: replace clearCart with removePurchasedItems
const checkoutSessionPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Checkout', 'CheckoutSessionPage.tsx');
let checkoutSession = fs.readFileSync(checkoutSessionPath, 'utf8');
checkoutSession = checkoutSession.replace(
  `      // Clear shopping cart
      try {
        clearCart();
      } catch {}`,
  `      // Remove purchased items only from shopping cart
      try {
        const purchasedItems = (session?.cart_snapshot?.items || (session as any)?.items || []);
        const purchasedIds = purchasedItems.map((i: any) => i.id || i.product_id || (typeof i.product === 'object' ? i.product?.id : i.product)).filter(Boolean);
        if (purchasedIds.length > 0) {
          removePurchasedItems(purchasedIds);
        }
      } catch {}`
);
fs.writeFileSync(checkoutSessionPath, checkoutSession, 'utf8');
console.log('Fixed CheckoutSessionPage.tsx');

// 4. In src/pages/Products/Detail/ProductDetailPage.tsx: remove duplicate minWidth
const productDetailPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Products', 'Detail', 'ProductDetailPage.tsx');
let productDetail = fs.readFileSync(productDetailPath, 'utf8');
productDetail = productDetail.replace(
  `const cartBtnStyles: React.CSSProperties = {
  flex: '1 1 180px',
  minWidth: '160px',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  minWidth: '180px',
  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.28)',
};`,
  `const cartBtnStyles: React.CSSProperties = {
  flex: '1 1 180px',
  minWidth: '160px',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.28)',
};`
);
fs.writeFileSync(productDetailPath, productDetail, 'utf8');
console.log('Fixed ProductDetailPage.tsx');

// 5. In src/utils/toastDedupe.ts: remove unused originalSuccess
const toastDedupePath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'toastDedupe.ts');
let toastDedupe = fs.readFileSync(toastDedupePath, 'utf8');
toastDedupe = toastDedupe.replace(
  "const originalError = toast.error.bind(toast);\nconst originalSuccess = toast.success.bind(toast);",
  "const originalError = toast.error.bind(toast);"
);
fs.writeFileSync(toastDedupePath, toastDedupe, 'utf8');
console.log('Fixed toastDedupe.ts');
