import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Cart } from '@/types';
import { cartApi } from '@/api/cart';
import { useAuth } from './AuthContext';

// ----------------------------------------------------------
// CartContext — synced with backend on every change
// NEVER computes totals locally. All figures from API.
// ----------------------------------------------------------

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<Cart | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch cart from API
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch cart on mount and when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    setIsLoading(true);
    try {
      const data = await cartApi.addItem({
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      setCart(data);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQty = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } catch (err) {
      console.error('Failed to update cart item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      const data = await cartApi.removeItem(itemId);
      setCart(data);
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await cartApi.clear();
      setCart(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateCart = useCallback(async (): Promise<Cart | null> => {
    setIsLoading(true);
    try {
      const data = await cartApi.validate();
      setCart(data);
      return data;
    } catch (err) {
      console.error('Failed to validate cart:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const itemCount = cart?.item_count ?? 0;

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
