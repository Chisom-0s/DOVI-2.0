const fs = require('fs');

// 1. Update CheckoutPage.tsx
let cp = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
cp = cp.replace(/\r\n/g, '\n');

cp = cp.replace(
  '  const { cart, isLoading: cartLoading } = useCart();',
  '  const { cart, isLoading: cartLoading, selectedItemIds } = useCart();'
);

const oldEffectiveItems = `  // Items from cart (strictly cart-based checkout, no direct-buy bypass)
  const effectiveItems: CartItem[] = useMemo(() => {
    return cart?.items || [];
  }, [cart?.items]);`;

const newEffectiveItems = `  // Selected items from cart (strictly selective checkout — unselected items remain in cart)
  const effectiveItems: CartItem[] = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) return [];
    if (!selectedItemIds || selectedItemIds.size === 0) return cart.items;
    const filtered = cart.items.filter((i) => selectedItemIds.has(i.id));
    return filtered.length > 0 ? filtered : cart.items;
  }, [cart?.items, selectedItemIds]);`;

cp = cp.replace(oldEffectiveItems, newEffectiveItems);
fs.writeFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', cp, 'utf8');
console.log('CheckoutPage.tsx updated successfully.');

// 2. Update CheckoutSessionPage.tsx
let cs = fs.readFileSync('frontend/src/pages/Checkout/CheckoutSessionPage.tsx', 'utf8');
cs = cs.replace(/\r\n/g, '\n');

cs = cs.replace(
  '  const { clearCart } = useCart();',
  '  const { removePurchasedItems } = useCart();'
);

const oldClear = `      // Clear cart
      clearCart();`;

const newClear = `      // Remove ONLY the purchased cart items, preserving unselected products
      if (session?.cart_snapshot?.items && session.cart_snapshot.items.length > 0) {
        const purchasedIds = session.cart_snapshot.items.map((i: any) => i.id);
        await removePurchasedItems(purchasedIds);
      }`;

cs = cs.replace(oldClear, newClear);
fs.writeFileSync('frontend/src/pages/Checkout/CheckoutSessionPage.tsx', cs, 'utf8');
console.log('CheckoutSessionPage.tsx updated successfully.');
