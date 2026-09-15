import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Cart, CartItem, ProductSummary, ProductVariant } from '@/types';
import { cartApi } from '@/api/cart';
import { productsApi } from '@/api/products';
import { MOCK_PRODUCTS } from '@/api/homepage';
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
  if (meta && meta.productId) {
    return {
      id: meta.productId,
      name: meta.name,
      primary_image_url: meta.imageUrl,
      image_url: meta.imageUrl,
      slug: meta.slug,
    };
  }

  // 2. Check cached real backend products from sessionStorage
  try {
    const cachedReal = JSON.parse(sessionStorage.getItem('dovi_real_products_cache') || '[]');
    if (Array.isArray(cachedReal)) {
      if (variantId) {
        const byVar = cachedReal.find((p: any) => Array.isArray(p.variants) && p.variants.some((v: any) => v.id === variantId));
        if (byVar) return byVar;
      }
      if (productName) {
        const norm = productName.toLowerCase().trim();
        const byName = cachedReal.find((p: any) => p.name?.toLowerCase().trim() === norm);
        if (byName) return byName;
      }
      if (productId) {
        const byId = cachedReal.find((p: any) => p.id === productId);
        if (byId) return byId;
      }
    }
  } catch {}

  // 3. Check mock products
  if (variantId) {
    const byVar = MOCK_PRODUCTS.find(p => Array.isArray(p.variants) && p.variants.some(v => v.id === variantId));
    if (byVar) return byVar;
  }
  if (productName) {
    const norm = productName.toLowerCase().trim();
    const byName = MOCK_PRODUCTS.find(p => p.name?.toLowerCase().trim() === norm);
    if (byName) return byName;
  }
  if (productId) {
    const byId = MOCK_PRODUCTS.find(p => p.id === productId);
    if (byId) return byId;
  }

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

    const unitPrice =
      item.price ??
      item.unit_price ??
      matchedProduct?.price ??
      matchedProduct?.base_price ??
      item.product?.price ??
      item.product?.base_price ??
      '0';
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
    (sum, i) => sum + (parseFloat(String(i.unit_price)) || 0) * i.quantity,
    0
  );
  const subtotal = raw.subtotal !== undefined ? String(raw.subtotal) : subtotalNum.toFixed(2);
  const delivery = raw.delivery_estimate !== undefined ? raw.delivery_estimate : null;
  const deliveryNum = delivery ? parseFloat(String(delivery)) || 0 : 0;
  const total = raw.total !== undefined ? String(raw.total) : (subtotalNum + deliveryNum).toFixed(2);

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

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
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
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(() => loadGuestCart());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch / Sync cart
  const refreshCart = useCallback(async () => {
    if (!user) {
      const guest = loadGuestCart();
      setCart(guest);
      return;
    }

    setIsLoading(true);
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
      setIsLoading(true);

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

      // If user is authenticated and ID is a valid UUID, attempt backend addition
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
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
          window.dispatchEvent(new CustomEvent('cart:updated'));
          return;
        } catch (err: any) {
          console.warn('Backend cart addition failed, smoothly saving in client cart:', err);
          // Fall through to client cart storage
        } finally {
          setIsLoading(false);
        }
      }

      // Guest user OR non-UUID mock product OR backend failure fallback
      try {
        if (!productObj) {
          try {
            productObj = await productsApi.getById(productId);
          } catch {}
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
        const effectiveName = productObj?.name || 'Product';

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
            id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            product: productObj || { id: productId, name: effectiveName, price: effectivePrice },
            product_name: effectiveName,
            variant: variantId ? ({ id: variantId, name: variantName || 'Standard', sku: 'SKU' } as any) : null,
            variant_name: variantName,
            quantity,
            price: effectivePrice,
            unit_price: effectivePrice,
            line_total: String((parseFloat(String(effectivePrice)) || 0) * quantity),
            available_stock: 10,
            is_in_stock: true,
            image_url: effectiveImg,
          });
        }

        saveGuestCart(currentGuest);
        if (user) {
          setCart(prev => {
            const currentNonLocal = prev.items.filter(it => !it.id.startsWith('guest_'));
            return normalizeCart({ ...prev, items: [...currentNonLocal, ...currentGuest.items] });
          });
        } else {
          setCart(normalizeCart(currentGuest));
        }
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (err) {
        console.error('Failed to update client cart:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const updateQty = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      setIsLoading(true);

      const isGuestItem = itemId.startsWith('guest_') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

      if (user && !isGuestItem) {
        try {
          const updated = await cartApi.updateItem(itemId, quantity);
          const normalized = normalizeCart(updated);
          const remainingLocal = loadGuestCart().items;
          if (remainingLocal.length > 0) {
            setCart(normalizeCart({ ...normalized, items: [...normalized.items, ...remainingLocal] }));
          } else {
            setCart(normalized);
          }
          window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
          console.error('Failed to update cart item quantity:', err);
          throw err;
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Guest / Local item
      const currentGuest = loadGuestCart();
      const target = currentGuest.items.find(i => i.id === itemId);
      if (target) {
        target.quantity = quantity;
        saveGuestCart(currentGuest);
        if (user) {
          setCart(prev => {
            const updatedItems = prev.items.map(it =>
              it.id === itemId
                ? {
                    ...it,
                    quantity,
                    line_total: String((parseFloat(String(it.unit_price || 0)) || 0) * quantity),
                  }
                : it
            );
            return normalizeCart({ ...prev, items: updatedItems });
          });
        } else {
          setCart(normalizeCart(currentGuest));
        }
        window.dispatchEvent(new CustomEvent('cart:updated'));
      }
      setIsLoading(false);
    },
    [user]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setIsLoading(true);
      const isGuestItem = itemId.startsWith('guest_') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

      if (user && !isGuestItem) {
        try {
          const updated = await cartApi.removeItem(itemId);
          const normalized = normalizeCart(updated);
          const remainingLocal = loadGuestCart().items;
          if (remainingLocal.length > 0) {
            setCart(normalizeCart({ ...normalized, items: [...normalized.items, ...remainingLocal] }));
          } else {
            setCart(normalized);
          }
          window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
          console.error('Failed to remove cart item:', err);
          throw err;
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Guest / Local Cart
      const currentGuest = loadGuestCart();
      currentGuest.items = currentGuest.items.filter(i => i.id !== itemId);
      saveGuestCart(currentGuest);
      if (user) {
        setCart(prev => {
          const updatedItems = prev.items.filter(it => it.id !== itemId);
          return normalizeCart({ ...prev, items: updatedItems });
        });
      } else {
        setCart(normalizeCart(currentGuest));
      }
      window.dispatchEvent(new CustomEvent('cart:updated'));
      setIsLoading(false);
    },
    [user]
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
