const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/Cart/CartPage.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Destructure selection helpers from useCart
const oldUseCart = `  const { cart, isLoading, updateQty, removeItem, clearCart, validateCart } = useCart();`;
const newUseCart = `  const {
    cart,
    isLoading,
    updateQty,
    removeItem,
    clearCart,
    validateCart,
    selectedItemIds,
    selectedItems,
    toggleSelectItem,
    selectAllItems,
    deselectAllItems,
    isItemSelected,
  } = useCart();`;

code = code.replace(oldUseCart, newUseCart);

// 2. Subtotal and minimum calculations based strictly on selectedItems
const oldSubtotals = `  const productSubtotal = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) return 0;
    return cart.items.reduce((sum, item) => {
      const price = parseFloat(String(item.unit_price || item.price || 0)) || 0;
      return sum + price * Math.max(1, item.quantity || 1);
    }, 0);
  }, [cart?.items]);

  const displaySubtotal = productSubtotal > 0
    ? productSubtotal
    : (parseFloat(String(cart?.subtotal || 0)) || 0);

  const meetsMinimum = useMemo(() => {
    if (!minSettings.enabled) return true;
    return displaySubtotal >= minSettings.minimum_amount;
  }, [minSettings.enabled, minSettings.minimum_amount, displaySubtotal]);

  const amountRemaining = useMemo(() => {
    if (!minSettings.enabled) return 0;
    return Math.max(0, minSettings.minimum_amount - displaySubtotal);
  }, [minSettings.enabled, minSettings.minimum_amount, displaySubtotal]);`;

const newSubtotals = `  // Selected items subtotal & units count
  const selectedSubtotal = useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) return 0;
    return selectedItems.reduce((sum, item) => {
      const price = parseFloat(String(item.unit_price || item.price || 0)) || 0;
      return sum + price * Math.max(1, item.quantity || 1);
    }, 0);
  }, [selectedItems]);

  const selectedCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [selectedItems]);

  const displaySubtotal = selectedSubtotal;

  const meetsMinimum = useMemo(() => {
    if (!minSettings.enabled) return true;
    if (selectedItems.length === 0) return false;
    return displaySubtotal >= minSettings.minimum_amount;
  }, [minSettings.enabled, minSettings.minimum_amount, displaySubtotal, selectedItems.length]);

  const amountRemaining = useMemo(() => {
    if (!minSettings.enabled) return 0;
    return Math.max(0, minSettings.minimum_amount - displaySubtotal);
  }, [minSettings.enabled, minSettings.minimum_amount, displaySubtotal]);`;

code = code.replace(oldSubtotals, newSubtotals);

// 3. Update handleProceedToCheckout
const oldProceed = `    if (!meetsMinimum) {
      toast.error(
        \`Minimum product subtotal of ₦\${minSettings.minimum_amount.toLocaleString()} required to checkout. Please add ₦\${amountRemaining.toLocaleString()} more to proceed.\`
      );
      return;
    }`;

const newProceed = `    if (selectedItems.length === 0) {
      toast.error('Please select at least one product from your cart to proceed to checkout.');
      return;
    }

    if (!meetsMinimum) {
      toast.error(
        \`Minimum product subtotal of ₦\${minSettings.minimum_amount.toLocaleString()} required to checkout. Please select ₦\${amountRemaining.toLocaleString()} more in products to proceed.\`
      );
      return;
    }`;

code = code.replace(oldProceed, newProceed);

// 4. Add Select All / Deselect All Bar before items list
const targetLayoutGrid = `      <div className="cart-layout-grid">
        {/* Cart Items List */}
        <div style={itemsColStyles}>`;

const newLayoutGrid = `      {/* Selection Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          <input
            type="checkbox"
            checked={cart.items.length > 0 && selectedItemIds.size === cart.items.length}
            onChange={(e) => {
              if (e.target.checked) selectAllItems();
              else deselectAllItems();
            }}
            style={{
              width: '20px',
              height: '20px',
              accentColor: '#ff7a00',
              cursor: 'pointer',
            }}
          />
          <span>
            Select All ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
          </span>
        </label>

        <div style={{ fontSize: '13px' }}>
          {selectedItemIds.size === 0 ? (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>0 items selected</span>
          ) : (
            <span style={{ color: '#16a34a', fontWeight: 700 }}>
              ✓ {selectedItemIds.size} of {cart.items.length} items selected ({selectedCount} units)
            </span>
          )}
        </div>
      </div>

      <div className="cart-layout-grid">
        {/* Cart Items List */}
        <div style={itemsColStyles}>`;

code = code.replace(targetLayoutGrid, newLayoutGrid);

// 5. Add checkbox to cart item card
const targetItemStart = `            return (
              <div key={item.id} style={itemCardStyles} className="cart-item-row">
                {/* Product Image */}`;

const newItemStart = `            const isChecked = isItemSelected(item.id);
            return (
              <div
                key={item.id}
                style={{
                  ...itemCardStyles,
                  opacity: isChecked ? 1 : 0.65,
                  transition: 'opacity 0.2s ease, border-color 0.2s ease',
                  borderColor: isChecked ? 'var(--color-border)' : '#e2e8f0',
                }}
                className="cart-item-row"
              >
                {/* Checkbox column */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelectItem(item.id)}
                    aria-label={\`Select \${displayName} for checkout\`}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#ff7a00',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                </div>

                {/* Product Image */}`;

code = code.replace(targetItemStart, newItemStart);

// 6. Update Order Summary column with selection messages and button labels
const targetSummarySubtotal = `          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Subtotal</span>
            <span style={{ ...summaryValueStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
              {formatPrice(displaySubtotal)}
            </span>
          </div>`;

const newSummarySubtotal = `          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Selected Subtotal</span>
            <span style={{ ...summaryValueStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
              {formatPrice(displaySubtotal)}
            </span>
          </div>

          {selectedItems.length === 0 && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#991b1b',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '10px',
                marginBottom: '10px',
              }}
            >
              ⚠️ Please select at least one product above to proceed to checkout.
            </div>
          )}`;

code = code.replace(targetSummarySubtotal, newSummarySubtotal);

// 7. Update checkout button disable condition & label
const targetCheckoutBtn = `          <button
            onClick={handleProceedToCheckout}
            disabled={!cart || !Array.isArray(cart.items) || cart.items.length === 0 || validating || !meetsMinimum}
            style={{
              ...checkoutBtnStyles,
              opacity: (!cart || !Array.isArray(cart.items) || cart.items.length === 0 || validating || !meetsMinimum) ? 0.5 : 1,
              cursor: (!cart || !Array.isArray(cart.items) || cart.items.length === 0 || validating || !meetsMinimum) ? 'not-allowed' : 'pointer',
              backgroundColor: !meetsMinimum ? '#9ca3af' : 'var(--color-primary)',
            }}
          >
            {validating
              ? 'Validating...'
              : !meetsMinimum
              ? \`Minimum \${formatPrice(minSettings.minimum_amount)} Required\`
              : 'Proceed to Checkout'}
          </button>`;

const newCheckoutBtn = `          <button
            onClick={handleProceedToCheckout}
            disabled={!cart || !Array.isArray(cart.items) || selectedItems.length === 0 || validating || !meetsMinimum}
            style={{
              ...checkoutBtnStyles,
              opacity: (!cart || !Array.isArray(cart.items) || selectedItems.length === 0 || validating || !meetsMinimum) ? 0.5 : 1,
              cursor: (!cart || !Array.isArray(cart.items) || selectedItems.length === 0 || validating || !meetsMinimum) ? 'not-allowed' : 'pointer',
              backgroundColor: (selectedItems.length === 0 || !meetsMinimum) ? '#9ca3af' : 'var(--color-primary)',
            }}
          >
            {validating
              ? 'Validating...'
              : selectedItems.length === 0
              ? 'Select Products to Checkout'
              : !meetsMinimum
              ? \`Add \${formatPrice(amountRemaining)} More to Checkout\`
              : \`Proceed to Checkout (\${selectedCount} \${selectedCount === 1 ? 'item' : 'items'})\`}
          </button>`;

code = code.replace(targetCheckoutBtn, newCheckoutBtn);

// 8. Update responsive styles for .cart-item-row
const oldMedia = `        @media (min-width: 600px) {
          .cart-item-row {
            grid-template-columns: 80px 1fr auto auto !important;
            grid-template-rows: auto !important;
            align-items: center !important;
            gap: var(--space-4) !important;
            padding: var(--space-4) !important;
          }
          .cart-item-row .cart-item-qty {
            grid-column: auto !important;
            grid-row: auto !important;
            align-items: center !important;
          }
          .cart-item-row .cart-item-total {
            grid-column: auto !important;
          }
        }
        /* Mobile: qty + total span full width in a flex row */
        @media (max-width: 599px) {
          .cart-item-qty-total {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
          }
        }`;

const newMedia = `        @media (min-width: 600px) {
          .cart-item-row {
            grid-template-columns: 28px 80px 1fr auto auto !important;
            grid-template-rows: auto !important;
            align-items: center !important;
            gap: var(--space-3) !important;
            padding: var(--space-4) !important;
          }
          .cart-item-row .cart-item-qty {
            grid-column: auto !important;
            grid-row: auto !important;
            align-items: center !important;
          }
          .cart-item-row .cart-item-total {
            grid-column: auto !important;
          }
        }
        /* Mobile: qty + total span full width in a flex row */
        @media (max-width: 599px) {
          .cart-item-row {
            grid-template-columns: 28px 70px 1fr !important;
            gap: var(--space-2) !important;
            padding: var(--space-3) !important;
          }
          .cart-item-qty-total {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
          }
        }`;

code = code.replace(oldMedia, newMedia);

fs.writeFileSync('frontend/src/pages/Cart/CartPage.tsx', code, 'utf8');
console.log('CartPage.tsx updated successfully.');
