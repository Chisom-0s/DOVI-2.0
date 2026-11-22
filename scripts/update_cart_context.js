const fs = require('fs');

let code = fs.readFileSync('frontend/src/contexts/CartContext.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Import resolveProductSellingPrice
const targetImport = `import { getProductHomepagePlacement, isFlashSaleActiveNow, isDiscountActiveNow } from '@/services/homepagePlacementService';`;
const newImport = `import { getProductHomepagePlacement, isFlashSaleActiveNow, isDiscountActiveNow, resolveProductSellingPrice } from '@/services/homepagePlacementService';`;

if (code.includes(targetImport)) {
  code = code.replace(targetImport, newImport);
  console.log('Updated imports in CartContext.tsx');
} else {
  console.error('Failed to find targetImport in CartContext.tsx');
}

// 2. Fix normalizeCart discount pricing logic
const targetNormalizePricing = `    let unitPrice =
      item.price ??
      item.unit_price ??
      matchedProduct?.price ??
      matchedProduct?.base_price ??
      item.product?.price ??
      item.product?.base_price ??
      '0';

    // Verify flash sale pricing: If flash sale has expired, do not charge flash price!
    if (effectiveProdId) {
      const placement = getProductHomepagePlacement({ id: effectiveProdId, description: matchedProduct?.description });
      if (placement?.flash_sale && !isFlashSaleActiveNow(placement.flash_sale)) {
        if (placement.flash_sale.original_price != null && Number(placement.flash_sale.original_price) > 0) {
          unitPrice = String(placement.flash_sale.original_price);
        } else if (matchedProduct?.original_price) {
          unitPrice = String(matchedProduct.original_price);
        } else if (matchedProduct?.base_price) {
          unitPrice = String(matchedProduct.base_price);
        }
      } else if (placement?.discount_config && !isDiscountActiveNow(placement.discount_config)) {
        if (placement.discount_config.original_price != null && Number(placement.discount_config.original_price) > 0) {
          unitPrice = String(placement.discount_config.original_price);
        } else if (matchedProduct?.original_price) {
          unitPrice = String(matchedProduct.original_price);
        } else if (matchedProduct?.base_price) {
          unitPrice = String(matchedProduct.base_price);
        }
      }
    }`;

const newNormalizePricing = `    const rawPriceCandidate =
      item.price ??
      item.unit_price ??
      matchedProduct?.price ??
      matchedProduct?.base_price ??
      item.product?.price ??
      item.product?.base_price ??
      '0';

    const pricing = resolveProductSellingPrice({
      id: effectiveProdId,
      name: effectiveDisplayName,
      base_price: rawPriceCandidate,
      price: rawPriceCandidate,
      description: matchedProduct?.description,
    });

    let unitPrice = String(pricing.sellingPrice);`;

if (code.includes(targetNormalizePricing)) {
  code = code.replace(targetNormalizePricing, newNormalizePricing);
  console.log('Updated normalizeCart discount pricing in CartContext.tsx');
} else {
  console.error('Failed to find targetNormalizePricing in CartContext.tsx');
}

// 3. Update CartContextValue interface
const targetInterface = `interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;`;

const newInterface = `const SELECTED_CART_ITEMS_KEY = 'dovi_selected_cart_items';

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  selectedItemIds: Set<string>;
  selectedItems: CartItem[];
  toggleSelectItem: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  isItemSelected: (itemId: string) => boolean;
  removePurchasedItems: (purchasedItemIds: string[]) => Promise<void>;
  refreshCart: () => Promise<void>;`;

if (code.includes(targetInterface)) {
  code = code.replace(targetInterface, newInterface);
  console.log('Updated CartContextValue interface in CartContext.tsx');
} else {
  console.error('Failed to find targetInterface in CartContext.tsx');
}

// 4. Implement selection states and handlers inside CartProvider
const targetProviderStart = `export function CartProvider({ children }: { children: React.ReactNode }) {
  const syncDebounceTimers = useRef<Map<string, any>>(new Map());
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(() => loadGuestCart());
  const [isLoading, setIsLoading] = useState(false);`;

const newProviderStart = `export function CartProvider({ children }: { children: React.ReactNode }) {
  const syncDebounceTimers = useRef<Map<string, any>>(new Map());
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(() => loadGuestCart());
  const [isLoading, setIsLoading] = useState(false);

  // Selective Checkout State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_CART_ITEMS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set<string>();
  });

  // Keep selection synchronized when items enter/leave cart
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      setSelectedItemIds(new Set());
      try {
        localStorage.removeItem(SELECTED_CART_ITEMS_KEY);
      } catch {}
      return;
    }

    setSelectedItemIds(prev => {
      const currentCartIds = new Set(cart.items.map(i => i.id));
      // If no selection exists yet, select all by default
      if (prev.size === 0) {
        try {
          localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify(Array.from(currentCartIds)));
        } catch {}
        return currentCartIds;
      }
      // Retain existing valid selections
      const next = new Set<string>();
      for (const id of prev) {
        if (currentCartIds.has(id)) next.add(id);
      }
      try {
        localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, [cart?.items]);

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    if (!cart?.items) return;
    const all = new Set(cart.items.map(i => i.id));
    setSelectedItemIds(all);
    try {
      localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify(Array.from(all)));
    } catch {}
  }, [cart?.items]);

  const deselectAllItems = useCallback(() => {
    const empty = new Set<string>();
    setSelectedItemIds(empty);
    try {
      localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify([]));
    } catch {}
  }, []);

  const isItemSelected = useCallback((itemId: string) => {
    return selectedItemIds.has(itemId);
  }, [selectedItemIds]);

  const selectedItems = useMemo(() => {
    if (!cart?.items) return [];
    return cart.items.filter(i => selectedItemIds.has(i.id));
  }, [cart?.items, selectedItemIds]);

  const removePurchasedItems = useCallback(async (purchasedItemIds: string[]) => {
    if (!purchasedItemIds || purchasedItemIds.length === 0) return;
    const purchasedSet = new Set(purchasedItemIds);

    // 1. Optimistically update local cart state immediately
    setCart(prev => {
      const remainingItems = prev.items.filter(i => !purchasedSet.has(i.id));
      const nextCart = normalizeCart({ ...prev, items: remainingItems });
      saveGuestCart(nextCart);
      return nextCart;
    });

    // 2. Remove from selected items state
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      for (const id of purchasedItemIds) next.delete(id);
      try {
        localStorage.setItem(SELECTED_CART_ITEMS_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // 3. Delete each purchased item from backend if authenticated
    for (const itemId of purchasedItemIds) {
      if (!itemId.startsWith('temp_') && !itemId.startsWith('guest_')) {
        try {
          await cartApi.removeItem(itemId);
        } catch (err) {
          console.warn('Failed to remove purchased item from backend:', itemId, err);
        }
      }
    }
  }, []);`;

if (code.includes(targetProviderStart)) {
  code = code.replace(targetProviderStart, newProviderStart);
  console.log('Added selection state & handlers to CartProvider in CartContext.tsx');
} else {
  console.error('Failed to find targetProviderStart in CartContext.tsx');
}

// 5. Update CartContext.Provider value
const targetProviderValue = `    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart.item_count,
        refreshCart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        validateCart,
      }}
    >`;

const newProviderValue = `    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart.item_count,
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

if (code.includes(targetProviderValue)) {
  code = code.replace(targetProviderValue, newProviderValue);
  console.log('Updated CartContext.Provider value in CartContext.tsx');
} else {
  console.error('Failed to find targetProviderValue in CartContext.tsx');
}

fs.writeFileSync('frontend/src/contexts/CartContext.tsx', code, 'utf8');
console.log('CartContext.tsx successfully updated.');
