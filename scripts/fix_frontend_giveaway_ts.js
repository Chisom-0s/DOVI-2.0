const fs = require('fs');

// 1. Fix frontend/src/contexts/GiveawayContext.tsx
let ctx = fs.readFileSync('frontend/src/contexts/GiveawayContext.tsx', 'utf8').replace(/\r\n/g, '\n');
ctx = ctx.replace('customerPhone: user?.phone_number,', 'customerPhone: user?.phone_number || undefined,');
ctx = ctx.replace('customerPhone: user?.phone_number,', 'customerPhone: user?.phone_number || undefined,');
ctx = ctx.replace('export function useGiveaway() {', 'export function useGiveaway(): GiveawayContextType {');
fs.writeFileSync('frontend/src/contexts/GiveawayContext.tsx', ctx, 'utf8');
console.log('Fixed GiveawayContext.tsx');

// 2. Fix frontend/src/components/home/GiveawayBanner.tsx
let banner = fs.readFileSync('frontend/src/components/home/GiveawayBanner.tsx', 'utf8').replace(/\r\n/g, '\n');
banner = banner.replace("import React from 'react';\n", "");
fs.writeFileSync('frontend/src/components/home/GiveawayBanner.tsx', banner, 'utf8');
console.log('Fixed GiveawayBanner.tsx');

// 3. Fix frontend/src/pages/Checkout/CheckoutPage.tsx
let checkout = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8').replace(/\r\n/g, '\n');
checkout = checkout.replace(
  'cart_snapshot: finalSnapshot,',
  'cart_snapshot: finalSnapshot as any,'
);
fs.writeFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', checkout, 'utf8');
console.log('Fixed CheckoutPage.tsx');
