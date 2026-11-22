const fs = require('fs');

const contextCode = `import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

  // Check if current route is a critical path (checkout, payment, auth) where pop-ups must be suppressed
  const isCriticalPath = useMemo(() => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/checkout') ||
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/reset-password')
    );
  }, [location.pathname]);

  // Recurring Pop-up Timer Engine
  useEffect(() => {
    if (!activePopupCampaign || isCriticalPath) {
      setIsPopupOpen(false);
      return;
    }

    const freqSeconds = activePopupCampaign.popup_frequency_seconds;
    const campaignId = activePopupCampaign.id;

    // Once per session check
    if (freqSeconds === 0) {
      try {
        const dismissed = JSON.parse(sessionStorage.getItem(DISMISSED_SESSION_KEY) || '[]');
        if (dismissed.includes(campaignId)) {
          return;
        }
      } catch {}
    }

    // Check last shown timestamp
    const checkAndTriggerPopup = () => {
      if (isCriticalPath || isPopupOpen) return;

      const now = Date.now();
      const lastShown = Number(sessionStorage.getItem(LAST_SHOWN_KEY) || '0');
      const intervalMs = (freqSeconds || 20) * 1000;

      if (now - lastShown >= intervalMs) {
        setIsPopupOpen(true);
        sessionStorage.setItem(LAST_SHOWN_KEY, String(now));
      }
    };

    // Initial delay trigger
    const initialDelay = Math.min((freqSeconds || 20) * 1000, 6000);
    const initialTimer = setTimeout(checkAndTriggerPopup, initialDelay);

    // Recurring interval
    const intervalMs = Math.max((freqSeconds || 20) * 1000, 5000);
    const intervalTimer = setInterval(checkAndTriggerPopup, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [activePopupCampaign, isCriticalPath, isPopupOpen]);

  const dismissPopup = useCallback(() => {
    setIsPopupOpen(false);
    sessionStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));

    if (activePopupCampaign) {
      try {
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
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
}
`;

fs.writeFileSync('frontend/src/contexts/PromotionContext.tsx', contextCode, 'utf8');
console.log('Created frontend/src/contexts/PromotionContext.tsx');
