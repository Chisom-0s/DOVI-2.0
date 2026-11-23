const fs = require('fs');

const path = 'frontend/src/pages/Checkout/CheckoutPage.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Add totalDiscountSavings calculation
const savingsCalcCode = `  const totalDiscountSavings = useMemo(() => {
    return effectiveItems.reduce((acc, it) => {
      const orig = Number(it.product?.original_price || (it as any).original_price || 0);
      const curr = Number(it.unit_price || 0);
      if (orig > curr) {
        return acc + (orig - curr) * (it.quantity || 1);
      }
      return acc;
    }, 0);
  }, [effectiveItems]);\n\n  const deliveryFee =`;

content = content.replace('  const deliveryFee =', savingsCalcCode);

// 2. In Step 2 Ordered Products list, render original price and discount savings
const itemDetailsTarget = `                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        {item.variant ? \` · Variant: \${typeof item.variant === 'object' ? (item.variant as any).name : item.variant}\` : ''}
                      </div>`;

const itemDetailsReplacement = `                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                        {(item.product?.original_price || (item as any).original_price) && Number(item.product?.original_price || (item as any).original_price) > Number(item.unit_price) && (
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                            {formatCurrency(item.product?.original_price || (item as any).original_price)}
                          </span>
                        )}
                        {(item.product?.original_price || (item as any).original_price) && Number(item.product?.original_price || (item as any).original_price) > Number(item.unit_price) && (
                          <span style={{ color: '#15803d', fontWeight: 700, backgroundColor: '#dcfce7', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
                            Save {formatCurrency((Number(item.product?.original_price || (item as any).original_price) - Number(item.unit_price)) * (item.quantity || 1))}
                          </span>
                        )}
                        {item.variant ? \` · Variant: \${typeof item.variant === 'object' ? (item.variant as any).name : item.variant}\` : ''}
                      </div>`;

if (content.includes(itemDetailsTarget)) {
  content = content.replace(itemDetailsTarget, itemDetailsReplacement);
}

// 3. In Price Breakdown, display Total Savings row
const summarySubtotalTarget = `          {/* Product Subtotal */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Product Subtotal</span>
            <span style={summaryValStyles}>{formatCurrency(computedSubtotal)}</span>
          </div>`;

const summarySubtotalReplacement = `          {/* Product Subtotal */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Product Subtotal</span>
            <span style={summaryValStyles}>{formatCurrency(computedSubtotal)}</span>
          </div>

          {/* Product Discount Savings */}
          {totalDiscountSavings > 0 && (
            <div style={{ ...summaryRowStyles, color: '#15803d' }}>
              <span style={{ color: '#15803d', fontWeight: 600 }}>Discount Savings</span>
              <span style={{ ...summaryValStyles, color: '#15803d', fontWeight: 700 }}>
                -{formatCurrency(totalDiscountSavings)}
              </span>
            </div>
          )}`;

if (content.includes(summarySubtotalTarget) && !content.includes('Discount Savings')) {
  content = content.replace(summarySubtotalTarget, summarySubtotalReplacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Added discount savings display to CheckoutPage.tsx');
