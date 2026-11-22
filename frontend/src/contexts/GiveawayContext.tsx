import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { LaunchGiveawayPromotion, GiveawayClaim } from '@/types';
import {
  fetchAuthoritativeGiveawayPromotion,
  checkCustomerGiveawayEligibility,
  reserveGiveawayGift,
  releaseGiveawayReservation,
  DEFAULT_LAUNCH_GIVEAWAY_PROMOTION,
  computeGiveawayStatus,
} from '@/services/giveawayService';
import { useAuth } from './AuthContext';

interface GiveawayContextType {
  promotion: LaunchGiveawayPromotion;
  isLoading: boolean;
  isActive: boolean;
  isOutOfStock: boolean;
  isExpired: boolean;
  checkEligibility: (productSubtotal: number) => { eligible: boolean; reason?: string };
  claimGift: (orderReference: string, productSubtotal: number) => Promise<{ success: boolean; claim?: GiveawayClaim; error?: string }>;
  releaseGift: (orderReference: string, reason?: string) => Promise<boolean>;
  refreshPromotion: () => Promise<void>;
}

const GiveawayContext = createContext<GiveawayContextType | null>(null);

export function GiveawayProvider({ children }: { children: React.ReactNode }) {
  const [promotion, setPromotion] = useState<LaunchGiveawayPromotion>(DEFAULT_LAUNCH_GIVEAWAY_PROMOTION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const loadPromo = useCallback(async () => {
    try {
      const p = await fetchAuthoritativeGiveawayPromotion();
      setPromotion(p);
    } catch {
      setPromotion(DEFAULT_LAUNCH_GIVEAWAY_PROMOTION);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromo();

    const handler = (e: any) => {
      if (e.detail) {
        setPromotion(e.detail);
      } else {
        loadPromo();
      }
    };

    window.addEventListener('dovi-giveaway-updated', handler);
    return () => window.removeEventListener('dovi-giveaway-updated', handler);
  }, [loadPromo]);

  const status = computeGiveawayStatus(promotion);
  const isActive = status === 'ACTIVE';
  const isOutOfStock = status === 'OUT_OF_STOCK' || promotion.available_stock <= 0;
  const isExpired = status === 'EXPIRED';

  const checkEligibility = useCallback(
    (productSubtotal: number) => {
      return checkCustomerGiveawayEligibility({
        productSubtotal,
        customerId: user?.id,
        customerPhone: user?.phone_number || undefined,
        promo: promotion,
      });
    },
    [promotion, user]
  );

  const claimGift = useCallback(
    async (orderReference: string, productSubtotal: number) => {
      const res = await reserveGiveawayGift({
        orderReference,
        productSubtotal,
        customerId: user?.id,
        customerName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email,
        customerEmail: user?.email,
        customerPhone: user?.phone_number || undefined,
      });
      if (res.success) {
        await loadPromo();
      }
      return res;
    },
    [user, loadPromo]
  );

  const releaseGift = useCallback(
    async (orderReference: string, reason = 'Customer cancelled or changed cart') => {
      const ok = await releaseGiveawayReservation({
        orderReference,
        reason,
      });
      if (ok) {
        await loadPromo();
      }
      return ok;
    },
    [loadPromo]
  );

  return (
    <GiveawayContext.Provider
      value={{
        promotion,
        isLoading,
        isActive,
        isOutOfStock,
        isExpired,
        checkEligibility,
        claimGift,
        releaseGift,
        refreshPromotion: loadPromo,
      }}
    >
      {children}
    </GiveawayContext.Provider>
  );
}

export function useGiveaway(): GiveawayContextType {
  const context = useContext<GiveawayContextType | null>(GiveawayContext);
  if (!context) {
    throw new Error('useGiveaway must be used within a GiveawayProvider');
  }
  return context;
}
