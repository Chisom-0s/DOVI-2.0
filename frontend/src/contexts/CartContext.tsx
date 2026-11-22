import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import type { Cart, CartItem, ProductSummary, ProductVariant } from '@/types';
import { cartApi } from '@/api/cart';
import { SEED_REAL_PRODUCTS } from '@/api/homepage';
import { resolveProductSellingPrice } from '@/services/homepagePlacementService';
import { notificationsApi } from '@/api/notifications';
import { useAuth } from './AuthContext';

// Local storage key for guest users & cart metadata registry
const GUEST_CART_KEY = 'dovi_guest_cart';
const CART_META_REGISTRY_KEY = 'dovi_cart_product_registry';

export interface CartProductMeta {
  productId: string;
  name?: string;
  imageUrl?: string;
  slug?: string;
  variantId?: string;
}

export function saveCartItemMeta(meta: CartProductMeta): void {
  if (!meta.productId && !meta.variantId) return;
  try {
    const existing = JSON.parse(localStorage.getItem(CART_META_REGISTRY_KEY) || '{}');
    if (meta.variantId) {
      existing[`var_${meta.variantId}`] = meta;
    }
    if (meta.productId) {
      existing[`prod_${meta.productId}`] = meta;
    }
    if (meta.name) {
      existing[`name_${meta.name.toLowerCase().trim()}`] = meta;
    }
    localStorage.setItem(CART_META_REGISTRY_KEY, JSON.stringify(existing));
  } catch {}
}

export function getCartItemMeta(variantId?: string, productName?: string, productId?: string): CartProductMeta | null {
  try {
    const registry = JSON.parse(localStorage.getItem(CART_META_REGISTRY_KEY) || '{}');
    if (variantId && registry[`var_${variantId}`]) {
      return registry[`var_${variantId}`];
    }
    if (productId && registry[`prod_${productId}`]) {
      return registry[`prod_${productId}`];
    }
    if (productName && registry[`name_${productName.toLowerCase().trim()}`]) {
      return registry[`name_${productName.toLowerCase().trim()}`];
    }
  } catch {}
  return null;
}

export function findKnownProduct(variantId?: string, productName?: string, productId?: string): any | null {
  // 1. Check local cart product registry
  const meta = getCartItemMeta(variantId, productName, productId);
  if (meta && meta.productId && meta.imageUrl) {
    return {
      id: meta.productId,
      name: meta.name,
      primary_image_url: meta.imageUrl,
      image_url: meta.imageUrl,
      slug: meta.slug,
    };
  }

  // Helper searcher
  const searchList = (list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    if (productId) {
      const byId = list.find((p: any) => p && (p.id === productId || p.uuid === productId));
      if (byId) return byId;
    }
    if (variantId) {
      const byVar = list.find((p: any) => p && Array.isArray(p.variants) && p.variants.some((v: any) => v && v.id === variantId));
      if (byVar) return byVar;
    }
    if (productName) {
      const norm = productName.toLowerCase().trim();
      const byName = list.find((p: any) => p && p.name && p.name.toLowerCase().trim() === norm);
      if (byName) return byName;
    }
    return null;
  };

  // 2. Check cached real backend products from sessionStorage
  try {
    const fromSession = JSON.parse(sessionStorage.getItem('dovi_real_products_cache') || '[]');
    const hit = searchList(fromSession);
    if (hit) return hit;
  } catch {}

  // 3. Check cached real backend products from localStorage
  try {
    const fromLocal = JSON.parse(localStorage.getItem('dovi_real_products_cache') || '[]');
    const hit = searchList(fromLocal);
    if (hit) return hit;
  } catch {}

  // 4. Check SEED_REAL_PRODUCTS catalog
  const hitSeed = searchList(SEED_REAL_PRODUCTS);
  if (hitSeed) return hitSeed;

  return null;
}

export function normalizeCart(raw: any): Cart {
  if (!raw) {
    return {
      id: 'guest',
      items: [],
      item_count: 0,
      subtotal: '0.00',
      delivery_estimate: null,
      total: '0.00',
      is_valid: true,
      validation_errors: [],
    };
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: CartItem[] = rawItems.map((item: any) => {
    const varId = typeof item.variant === 'object' && item.variant !== null ? item.variant.id : item.variant;
    const prodName = item.product_name || (typeof item.product === 'object' ? item.product?.name : item.name);
    const givenProdId = (item.product && typeof item.product === 'object' && item.product.id !== item.id) 
      ? item.product.id 
      : (item.product_id && item.product_id !== item.id ? item.product_id : undefined);

    const matchedProduct = findKnownProduct(varId, prodName, givenProdId);

    const effectiveProdId = matchedProduct?.id || givenProdId || '';
    const effectiveImg = 
      item.image_url || 
      matchedProduct?.primary_image_url || 
      matchedProduct?.image_url || 
      (typeof item.product === 'object' ? (item.product?.primary_image_url || item.product?.image_url) : null) || 
      null;
    const effectiveDisplayName = prodName || matchedProduct?.name || 'Product';

    const rawPriceCandidate =
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

    let unitPrice = String(pricing.sellingPrice);
    const qty = Number(item.quantity) || 1;
    const numPrice = parseFloat(String(unitPrice)) || 0;
    const lineTotal = (numPrice * qty).toFixed(2);
    const stock =
      (item.available_stock !== undefined && item.available_stock !== null && Number(item.available_stock) > 0)
        ? Number(item.available_stock)
        : (item.stock !== undefined && item.stock !== null && Number(item.stock) > 0)
        ? Number(item.stock)
        : (matchedProduct?.stock_quantity !== undefined && matchedProduct?.stock_quantity !== null && Number(matchedProduct.stock_quantity) > 0)
        ? Number(matchedProduct.stock_quantity)
        : 10;
    const inStock = item.is_in_stock !== undefined ? Boolean(item.is_in_stock) : true;

    // Resolve product object or reconstruct — ensuring product.id is the REAL product UUID (never cart item id!)
    const productObj: ProductSummary =
      typeof item.product === 'object' && item.product !== null && item.product.id !== item.id
        ? {
            ...item.product,
            id: effectiveProdId || item.product.id,
            primary_image_url: effectiveImg || item.product.primary_image_url,
            image_url: effectiveImg || item.product.image_url,
          }
        : {
            id: effectiveProdId,
            name: effectiveDisplayName,
            slug: matchedProduct?.slug || item.product_slug || '',
            base_price: String(unitPrice),
            price: String(unitPrice),
            primary_image_url: effectiveImg,
            image_url: effectiveImg || undefined,
            images: effectiveImg ? [{ image_url: effectiveImg }] : [],
            stock_quantity: stock,
            vendor_name: item.vendor_name || matchedProduct?.vendor_name || 'Verified Vendor',
            vendor: item.vendor || matchedProduct?.vendor || item.vendor_name || '',
            average_rating: matchedProduct?.average_rating || 4.9,
            review_count: matchedProduct?.review_count || 10,
            status: 'PUBLISHED' as any,
          };

    return {
      id: String(item.id || `item_${Math.random().toString(36).substring(2, 9)}`),
      product: productObj,
      product_id: effectiveProdId,
      product_name: effectiveDisplayName,
      variant:
        typeof item.variant === 'object' && item.variant !== null
          ? item.variant
          : item.variant
          ? ({ id: item.variant, name: item.variant_name || 'Selected Option', sku: item.variant_sku || 'SKU' } as ProductVariant)
          : null,
      variant_name: item.variant_name || (typeof item.variant === 'object' ? item.variant?.name : undefined),
      variant_sku: item.variant_sku || (typeof item.variant === 'object' ? item.variant?.sku : undefined),
      quantity: qty,
      unit_price: String(unitPrice),
      price: String(unitPrice),
      line_total: lineTotal,
      available_stock: stock,
      is_in_stock: inStock,
      image_url: effectiveImg || undefined,
    };
  });

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalNum = items.reduce(
    (sum, i) => {
      const p = parseFloat(String(i.unit_price ?? (i as any).price ?? 0)) || 0;
      return sum + p * Math.max(1, i.quantity || 1);
    },
    0
  );

  // If cart has items and their computed subtotal > 0, always use the computed subtotal.
  // Never let a stale or 0.00 raw.subtotal override positive item subtotals.
  const subtotal = subtotalNum > 0
    ? subtotalNum.toFixed(2)
    : (raw && raw.subtotal !== undefined && raw.subtotal !== null ? String(raw.subtotal) : '0.00');

  const delivery = raw && raw.delivery_estimate !== undefined ? raw.delivery_estimate : null;
  const deliveryNum = delivery ? parseFloat(String(delivery)) || 0 : 0;
  const calculatedTotal = (subtotalNum + deliveryNum).toFixed(2);
  const total = subtotalNum > 0
    ? calculatedTotal
    : (raw && raw.total !== undefined && raw.total !== null ? String(raw.total) : calculatedTotal);

  return {
    id: raw.id || 'cart',
    items,
    item_count: raw.item_count ?? count,
    subtotal,
    delivery_estimate: delivery ? String(delivery) : null,
    total,
    is_valid: raw.is_valid !== undefined ? Boolean(raw.is_valid) : items.length > 0,
    validation_errors: raw.validation_errors || [],
  };
}

function loadGuestCart(): Cart {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (stored) {
      return normalizeCart(JSON.parse(stored));
    }
  } catch {}
  return normalizeCart(null);
}

function saveGuestCart(cart: Cart): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {}
}

export interface AddToCartOptions {
  product?: ProductSummary | any;
  variantId?: string;
  variantName?: string;
  price?: number | string;
  imageUrl?: string;
  image_url?: string;
  name?: string;
}

const SELECTED_CART_ITEMS_KEY = 'dovi_selected_cart_items';

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
  refreshCart: () => Promise<void>;
  addToCart: (
    productOrId: string | ProductSummary | any,
    quantity?: number,
    optionsOrVariantId?: string | AddToCartOptions,
    extraOptions?: AddToCartOptions
  ) => Promise<void>;
  updateQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<Cart | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
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
  }, []);

  // Fetch / Sync cart
  const refreshCart = useCallback(async () => {
    if (!user) {
      const guest = loadGuestCart();
      setCart(guest);
      return;
    }

    // Only set full loading state on first mount if we don't have any items rendered
    if (cart.items.length === 0) setIsLoading(true);
    try {
      // 1. If we have any items in guest storage, attempt to merge valid UUID items into backend
      const guest = loadGuestCart();
      const nonBackendItems: CartItem[] = [];
      if (guest.items.length > 0) {
        for (const gItem of guest.items) {
          const pId = gItem.product?.id || gItem.product_id || '';
          const isUuid = Boolean(pId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pId);
          if (isUuid) {
            try {
              await cartApi.addItem({
                product_id: pId,
                variant_id: typeof gItem.variant === 'string' ? gItem.variant : gItem.variant?.id,
                quantity: gItem.quantity,
              });
            } catch {
              nonBackendItems.push(gItem);
            }
          } else {
            nonBackendItems.push(gItem);
          }
        }
        if (nonBackendItems.length > 0) {
          saveGuestCart({ ...guest, items: nonBackendItems });
        } else {
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }

      // 2. Fetch authoritative cart from backend
      const data = await cartApi.get();
      const backendCart = normalizeCart(data);
      const remainingLocal = loadGuestCart().items;
      if (remainingLocal.length > 0) {
        const mergedItems = [...backendCart.items];
        const getVariantId = (v: any) => (typeof v === 'object' && v !== null ? v.id : v);
        for (const locItem of remainingLocal) {
          if (
            !mergedItems.some(
              bi =>
                bi.id === locItem.id ||
                (bi.product?.id === locItem.product?.id && getVariantId(bi.variant) === getVariantId(locItem.variant))
            )
          ) {
            mergedItems.push(locItem);
          }
        }
        setCart(normalizeCart({ ...backendCart, items: mergedItems }));
      } else {
        setCart(backendCart);
      }
    } catch (err) {
      console.error('Failed to sync backend cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load & user change listener
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Global cart updated event listener
  useEffect(() => {
    const handleCartUpdated = () => {
      refreshCart();
    };
    window.addEventListener('cart:updated', handleCartUpdated);
    return () => window.removeEventListener('cart:updated', handleCartUpdated);
  }, [refreshCart]);

  const addToCart = useCallback(
    async (
      productOrId: string | ProductSummary | any,
      quantity = 1,
      optionsOrVariantId?: string | AddToCartOptions,
      extraOptions?: AddToCartOptions
    ) => {
      let productId = '';
      let productObj: any = null;
      let variantId: string | undefined = undefined;
      let variantName: string | undefined = undefined;
      let priceOverride: number | string | undefined = undefined;
      let imageUrl: string | undefined = undefined;
      let customName: string | undefined = undefined;

      // Parse first argument
      if (typeof productOrId === 'string') {
        productId = productOrId;
      } else if (productOrId && typeof productOrId === 'object') {
        productId = productOrId.id;
        productObj = productOrId;
      }

      // Parse options argument
      const opt = typeof optionsOrVariantId === 'object' ? optionsOrVariantId : extraOptions;
      if (typeof optionsOrVariantId === 'string') {
        variantId = optionsOrVariantId;
      }
      if (opt) {
        variantId = opt.variantId ?? variantId;
        variantName = opt.variantName ?? variantName;
        priceOverride = opt.price ?? priceOverride;
        imageUrl = opt.imageUrl ?? opt.image_url ?? imageUrl;
        customName = opt.name ?? customName;
        if (opt.product) {
          productObj = opt.product;
        }
      }

      // Persist metadata mapping immediately so any future cart sync resolves product & image
      const effImg = imageUrl || productObj?.primary_image_url || productObj?.image_url;
      const effName = customName || productObj?.name;
      if (productId || variantId) {
        saveCartItemMeta({
          productId,
          variantId,
          name: effName,
          imageUrl: effImg,
          slug: productObj?.slug,
        });
      }

      const effectivePrice =
        priceOverride ??
        productObj?.price ??
        productObj?.base_price ??
        0;
      const effectiveImg =
        imageUrl ??
        productObj?.primary_image_url ??
        productObj?.image_url ??
        '/logo.jpg?v=2';
      const effectiveName = productObj?.name || effName || 'Product';
      const unitNum = parseFloat(String(effectivePrice)) || 0;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      const tempId = isUuid
        ? `temp_${productId}_${variantId || 'base'}`
        : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Snapshot for optimistic rollback if backend fails
      const previousCart = cart;

      // 1. IMMEDIATE OPTIMISTIC STATE UPDATE (0ms latency — instant visual feedback)
      setCart(prev => {
        const nextItems = [...prev.items];
        const existingIdx = nextItems.findIndex(
          i =>
            (i.product?.id === productId || i.id === productId || i.product_id === productId) &&
            (!variantId || (typeof i.variant === 'string' ? i.variant === variantId : i.variant?.id === variantId))
        );

        if (existingIdx >= 0) {
          const existing = nextItems[existingIdx];
          const newQty = existing.quantity + quantity;
          nextItems[existingIdx] = {
            ...existing,
            quantity: newQty,
            line_total: (unitNum * newQty).toFixed(2),
          };
        } else {
          nextItems.push({
            id: tempId,
            product: productObj || { id: productId, name: effectiveName, price: effectivePrice },
            product_name: effectiveName,
            variant: variantId ? ({ id: variantId, name: variantName || 'Standard', sku: 'SKU' } as any) : null,
            variant_name: variantName,
            quantity,
            price: effectivePrice,
            unit_price: effectivePrice,
            line_total: (unitNum * quantity).toFixed(2),
            available_stock: productObj?.stock_quantity ?? 10,
            is_in_stock: true,
            image_url: effectiveImg,
          });
        }
        return normalizeCart({ ...prev, items: nextItems });
      });

      // 2. Synchronize guest storage if guest / mock product
      if (!user || !isUuid) {
        const currentGuest = loadGuestCart();
        const existingIdx = currentGuest.items.findIndex(
          i =>
            (i.product?.id === productId || i.id === productId) &&
            (!variantId || (typeof i.variant === 'string' ? i.variant === variantId : i.variant?.id === variantId))
        );
        if (existingIdx >= 0) {
          currentGuest.items[existingIdx].quantity += quantity;
        } else {
          currentGuest.items.push({
            id: tempId,
            product: productObj || { id: productId, name: effectiveName, price: effectivePrice },
            product_name: effectiveName,
            variant: variantId ? ({ id: variantId, name: variantName || 'Standard', sku: 'SKU' } as any) : null,
            variant_name: variantName,
            quantity,
            price: effectivePrice,
            unit_price: effectivePrice,
            line_total: String((unitNum * quantity).toFixed(2)),
            available_stock: productObj?.stock_quantity ?? 10,
            is_in_stock: true,
            image_url: effectiveImg,
          });
        }
        saveGuestCart(currentGuest);
      }

      // 3. Authenticated user: Background sync with authoritative backend
      if (user && isUuid) {
        try {
          const updated = await cartApi.addItem({
            product_id: productId,
            variant_id: variantId,
            quantity,
          });
          const normalized = normalizeCart(updated);
          const remainingLocal = loadGuestCart().items;
          if (remainingLocal.length > 0) {
            const merged = [...normalized.items];
            for (const loc of remainingLocal) {
              if (!merged.some(m => m.id === loc.id || m.product?.id === loc.product?.id)) {
                merged.push(loc);
              }
            }
            setCart(normalizeCart({ ...normalized, items: merged }));
          } else {
            setCart(normalized);
          }
        } catch (err: any) {
          console.warn('Backend cart addition failed, smoothly maintaining client cart:', err);
          if (err?.response?.status === 400 || err?.response?.status === 409) {
            setCart(previousCart);
            toast.error(err?.response?.data?.detail || err?.message || 'Could not add to cart.');
            throw err;
          }
        }
      }

      try {
        void notificationsApi.create(
          'Item Added to Cart',
          `${effectiveName} was added to your cart.`,
          'INFO'
        ).catch(() => {});
      } catch {}
    },
    [user, cart]
  );

  const updateQty = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;

      // Find current item to check stock limits immediately
      const currentItem = cart.items.find(i => i.id === itemId);
      const stock = currentItem?.available_stock ?? (currentItem as any)?.stock;
      if (stock !== undefined && stock !== null && Number(stock) > 0 && quantity > Number(stock)) {
        toast.error(`Only ${stock} unit${Number(stock) > 1 ? 's' : ''} available in stock.`);
        return;
      }

      // Snapshot for optimistic rollback if backend rejects
      const previousCart = cart;

      // 1. Immediate optimistic UI state update (0ms perceived latency!)
      setCart(prev => {
        const updatedItems = prev.items.map(it => {
          if (it.id !== itemId) return it;
          const unit = parseFloat(String(it.unit_price ?? it.price ?? '0')) || 0;
          return {
            ...it,
            quantity,
            line_total: (unit * quantity).toFixed(2),
          };
        });
        return normalizeCart({ ...prev, items: updatedItems });
      });

      const isGuestItem = itemId.startsWith('guest_') || itemId.startsWith('temp_') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

      // Local / Guest item persistence
      if (!user || isGuestItem) {
        const currentGuest = loadGuestCart();
        const target = currentGuest.items.find(i => i.id === itemId);
        if (target) {
          target.quantity = quantity;
          saveGuestCart(currentGuest);
        }
        return;
      }

      // 2. Authenticated user: Background sync with debounce to prevent network congestion on rapid taps
      const existingTimer = syncDebounceTimers.current.get(itemId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        syncDebounceTimers.current.delete(itemId);
        try {
          const updated = await cartApi.updateItem(itemId, quantity);
          const normalized = normalizeCart(updated);
          const remainingLocal = loadGuestCart().items;
          if (remainingLocal.length > 0) {
            setCart(normalizeCart({ ...normalized, items: [...normalized.items, ...remainingLocal] }));
          } else {
            setCart(normalized);
          }
        } catch (err: any) {
          console.error('Failed to sync cart item quantity with server:', err);
          setCart(previousCart);
          toast.error(err?.message || 'Could not update quantity. Please try again.');
        }
      }, 250);

      syncDebounceTimers.current.set(itemId, timer);
    },
    [cart, user]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const previousCart = cart;

      // 1. Immediate optimistic UI update (0ms latency)
      setCart(prev => normalizeCart({ ...prev, items: prev.items.filter(it => it.id !== itemId) }));

      const isGuestItem = itemId.startsWith('guest_') || itemId.startsWith('temp_') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

      if (!user || isGuestItem) {
        const currentGuest = loadGuestCart();
        currentGuest.items = currentGuest.items.filter(i => i.id !== itemId);
        saveGuestCart(currentGuest);
        return;
      }

      try {
        const updated = await cartApi.removeItem(itemId);
        const normalized = normalizeCart(updated);
        const remainingLocal = loadGuestCart().items;
        if (remainingLocal.length > 0) {
          setCart(normalizeCart({ ...normalized, items: [...normalized.items, ...remainingLocal] }));
        } else {
          setCart(normalized);
        }
      } catch (err) {
        console.error('Failed to remove cart item:', err);
        setCart(previousCart);
        toast.error('Could not remove item.');
      }
    },
    [cart, user]
  );

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    localStorage.removeItem(GUEST_CART_KEY);

    if (user) {
      try {
        await cartApi.clear();
      } catch (err) {
        console.error('Failed to clear cart:', err);
      } finally {
        setCart(normalizeCart(null));
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setIsLoading(false);
      }
      return;
    }

    // Guest Cart
    setCart(normalizeCart(null));
    window.dispatchEvent(new CustomEvent('cart:updated'));
    setIsLoading(false);
  }, [user]);

  const validateCart = useCallback(async (): Promise<Cart | null> => {
    if (!user) {
      return loadGuestCart();
    }
    try {
      const data = await cartApi.validate();
      const normalized = normalizeCart(data);
      setCart(normalized);
      return normalized;
    } catch (err) {
      console.warn('Failed to validate cart from API, keeping current cart:', err);
      return null;
    }
  }, [user]);

  const itemCount = useMemo(() => {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cart]);

  return (
    <CartContext.Provider
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
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext<CartContextValue | null>(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return context;
}
