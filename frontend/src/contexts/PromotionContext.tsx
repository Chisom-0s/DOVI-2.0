import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { PromotionalCampaign } from '@/types';
import {
  fetchAuthoritativeCampaigns,
  computeCampaignStatus,
  DEFAULT_CAMPAIGN,
} from '@/services/promotionService';

interface PromotionContextType {
  campaigns: PromotionalCampaign[];
  isLoading: boolean;
  activeBannerCampaign: PromotionalCampaign | null;
  activePopupCampaign: PromotionalCampaign | null;
  isPopupOpen: boolean;
  dismissPopup: () => void;
  rearmPopup: () => void;
  refreshCampaigns: () => Promise<void>;
}

const PromotionContext = createContext<PromotionContextType | null>(null);

const LAST_SHOWN_KEY = 'dovi_last_promo_popup_ms';
const DISMISSED_SESSION_KEY = 'dovi_dismissed_session_popups';

export function PromotionProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([DEFAULT_CAMPAIGN]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAuthoritativeCampaigns();
      setCampaigns(data);
    } catch {
      setCampaigns([DEFAULT_CAMPAIGN]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handler = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCampaigns(e.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener('dovi-campaigns-updated', handler);
    return () => window.removeEventListener('dovi-campaigns-updated', handler);
  }, [loadData]);

  // Compute active eligible campaigns sorted by priority
  const eligibleActiveCampaigns = useMemo(() => {
    return campaigns
      .map((c) => ({ ...c, status: computeCampaignStatus(c) }))
      .filter((c) => c.status === 'ACTIVE')
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [campaigns]);

  // Top priority banner campaign
  const activeBannerCampaign = useMemo(() => {
    return eligibleActiveCampaigns.find((c) => c.placements?.homepage_banner) || null;
  }, [eligibleActiveCampaigns]);

  // Top priority popup campaign
  const activePopupCampaign = useMemo(() => {
    return eligibleActiveCampaigns.find((c) => c.placements?.recurring_popup) || null;
  }, [eligibleActiveCampaigns]);

  // Check if current route is a critical path (checkout, payment, cart, auth) where pop-ups must be suppressed
  const isCriticalPath = useMemo(() => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/checkout') ||
      p.startsWith('/cart') ||
      p.startsWith('/payment') ||
      p.includes('payment') ||
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/reset-password')
    );
  }, [location.pathname]);

  // Recurring Pop-up Timer Engine with Admin Frequency Controls
  useEffect(() => {
    if (!activePopupCampaign || isCriticalPath) {
      setIsPopupOpen(false);
      return;
    }

    const campaignId = activePopupCampaign.id;
    const config = (activePopupCampaign as any).giveaway_config || (activePopupCampaign as any);

    // Safeguard 1: Permanent stop if customer already claimed the giveaway
    const stopOnClaim = config.stop_permanently_on_claim !== false;
    if (stopOnClaim) {
      try {
        const hasClaimed = localStorage.getItem('dovi_giveaway_claimed') === 'true';
        if (hasClaimed) return;
      } catch {}
    }

    // Safeguard 2: Display limit per customer
    const displayLimit = Number(config.display_limit_per_customer ?? 0);
    if (displayLimit > 0) {
      try {
        const count = Number(localStorage.getItem(`dovi_promo_display_count_${campaignId}`) || '0');
        if (count >= displayLimit) return;
      } catch {}
    }

    // Safeguard 3: Close suppression window
    try {
      const suppressUntil = Number(localStorage.getItem(`dovi_promo_suppress_until_${campaignId}`) || '0');
      if (Date.now() < suppressUntil) return;
    } catch {}

    const firstDelaySec = Math.max(5, Number(config.first_display_delay_seconds ?? 60));
    const repeatFrequencyHours = Math.max(1, Number(config.repeat_frequency_hours ?? 24));
    const repeatIntervalMs = repeatFrequencyHours * 3600 * 1000;

    const checkAndTriggerPopup = () => {
      if (isCriticalPath || isPopupOpen) return;

      const now = Date.now();
      const lastShown = Number(sessionStorage.getItem(LAST_SHOWN_KEY) || '0');

      if (now - lastShown >= repeatIntervalMs) {
        setIsPopupOpen(true);
        sessionStorage.setItem(LAST_SHOWN_KEY, String(now));

        // Increment display count
        try {
          const currentCount = Number(localStorage.getItem(`dovi_promo_display_count_${campaignId}`) || '0');
          localStorage.setItem(`dovi_promo_display_count_${campaignId}`, String(currentCount + 1));

          // Increment overall impressions
          const impressions = Number(localStorage.getItem('dovi_promo_impressions') || '0');
          localStorage.setItem('dovi_promo_impressions', String(impressions + 1));

          // Unique reach tracker
          let visitorId = localStorage.getItem('dovi_visitor_id');
          if (!visitorId) {
            visitorId = 'v_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('dovi_visitor_id', visitorId);
          }
          const reachedVisitors = JSON.parse(localStorage.getItem('dovi_promo_reached_visitors') || '[]');
          if (!reachedVisitors.includes(visitorId)) {
            reachedVisitors.push(visitorId);
            localStorage.setItem('dovi_promo_reached_visitors', JSON.stringify(reachedVisitors));
          }
        } catch {}
      }
    };

    // First display delay: Never display immediately upon page load (default: 60s)
    const initialTimer = setTimeout(checkAndTriggerPopup, firstDelaySec * 1000);

    // Recurring interval if user stays on the page
    const intervalTimer = setInterval(checkAndTriggerPopup, repeatIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [activePopupCampaign, isCriticalPath, isPopupOpen]);

  const dismissPopup = useCallback(() => {
    setIsPopupOpen(false);
    const now = Date.now();
    sessionStorage.setItem(LAST_SHOWN_KEY, String(now));

    if (activePopupCampaign) {
      const config = (activePopupCampaign as any).giveaway_config || (activePopupCampaign as any);
      const closeSuppressionHours = Math.max(1, Number(config.close_suppression_hours ?? config.repeat_frequency_hours ?? 24));
      const suppressUntil = now + closeSuppressionHours * 3600 * 1000;

      try {
        localStorage.setItem(`dovi_promo_suppress_until_${activePopupCampaign.id}`, String(suppressUntil));
        const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISSED_SESSION_KEY) || '[]');
        if (!dismissed.includes(activePopupCampaign.id)) {
          dismissed.push(activePopupCampaign.id);
          sessionStorage.setItem(DISMISSED_SESSION_KEY, JSON.stringify(dismissed));
        }
      } catch {}
    }
  }, [activePopupCampaign]);

  const rearmPopup = useCallback(() => {
    sessionStorage.removeItem(LAST_SHOWN_KEY);
    sessionStorage.removeItem(DISMISSED_SESSION_KEY);
  }, []);

  return (
    <PromotionContext.Provider
      value={{
        campaigns,
        isLoading,
        activeBannerCampaign,
        activePopupCampaign,
        isPopupOpen,
        dismissPopup,
        rearmPopup,
        refreshCampaigns: loadData,
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotion(): PromotionContextType {
  const context = useContext<PromotionContextType | null>(PromotionContext);
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
}
