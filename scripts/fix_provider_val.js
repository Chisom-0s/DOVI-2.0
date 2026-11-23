const fs = require('fs');

let code = fs.readFileSync('frontend/src/contexts/CartContext.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

const targetValue = `    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        refreshCart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        validateCart,
      }}
    >`;

const newValue = `    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        selectedItemIds,
        selectedItems,
        toggleSelectItem,
        selectAllItems,
        deselectAllItems,
        isItemSelected,
        removePurchasedItems,
        refreshCart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        validateCart,
      }}
    >`;

if (code.includes(targetValue)) {
  code = code.replace(targetValue, newValue);
  fs.writeFileSync('frontend/src/contexts/CartContext.tsx', code, 'utf8');
  console.log('Successfully updated CartContext.Provider value');
} else {
  console.error('Target value still not found');
}
