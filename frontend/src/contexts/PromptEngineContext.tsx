import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- Configuration ---
export const PROMPT_CONFIG = {
  vendorVerification: { enabled: true, priority: 1, initialDelaySeconds: 5, cooldownHours: 12 },
  cookie: { enabled: true, priority: 2 },
  notification: { enabled: true, priority: 3, cooldownHours: 72 },
  pwa: { enabled: true, priority: 4, initialDelaySeconds: 10, cooldownHours: 12, maxPromptCountPerSession: 1 },
  community: { enabled: true, priority: 5, cooldownHours: 72, initialDelaySeconds: 30 },
  mobileApp: { enabled: true, priority: 6, cooldownHours: 24 }
};

export type PromptType = 'vendorVerification' | 'cookie' | 'notification' | 'pwa' | 'community' | 'mobileApp';

export interface PromptState {
  status: 'UNKNOWN' | 'ACCEPTED' | 'DECLINED' | 'INSTALLED' | 'BLOCKED';
  lastShownAt?: number;
  nextEligibleAt?: number;
  promptCount: number;
  customData?: Record<string, any>;
}

export type PromptDataMap = Record<PromptType, PromptState>;

export interface PromptEngineContextType {
  activePrompt: PromptType | null;
  getPromptState: (type: PromptType) => PromptState;
  updatePromptState: (type: PromptType, updates: Partial<PromptState>) => void;
  dismissPrompt: (type: PromptType) => void;
  acceptPrompt: (type: PromptType) => void;
  registerEligibility: (type: PromptType, isEligible: boolean) => void;
  evaluatePrompts: () => void;
  sessionViews: number;
}

const PromptEngineContext = createContext<PromptEngineContextType | undefined>(undefined);

const STORAGE_KEY = 'dovi_smart_prompts_state';
const SESSION_VIEWS_KEY = 'dovi_smart_prompts_session_views';

const defaultPromptState: PromptState = {
  status: 'UNKNOWN',
  promptCount: 0
};

export const PromptEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [activePrompt, setActivePrompt] = useState<PromptType | null>(null);
  const [eligibilityMap, setEligibilityMap] = useState<Record<PromptType, boolean>>({
    vendorVerification: false,
    cookie: false,
    notification: false,
    pwa: false,
    community: false,
    mobileApp: false
  });
  
  const [sessionViews, setSessionViews] = useState(0);

  // Load state from localStorage
  const loadState = useCallback((): PromptDataMap => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load prompt state', e);
    }
    return {
      vendorVerification: { ...defaultPromptState },
      cookie: { ...defaultPromptState },
      notification: { ...defaultPromptState },
      pwa: { ...defaultPromptState },
      community: { ...defaultPromptState },
      mobileApp: { ...defaultPromptState }
    };
  }, []);

  const [promptStates, setPromptStates] = useState<PromptDataMap>(loadState());

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promptStates));
  }, [promptStates]);

  // Track session views
  useEffect(() => {
    try {
      const views = parseInt(sessionStorage.getItem(SESSION_VIEWS_KEY) || '0', 10) + 1;
      sessionStorage.setItem(SESSION_VIEWS_KEY, views.toString());
      setSessionViews(views);
    } catch (e) {
      console.error('Session storage error', e);
    }
  }, []);

  const getPromptState = useCallback((type: PromptType) => {
    return promptStates[type] || defaultPromptState;
  }, [promptStates]);

  const updatePromptState = useCallback((type: PromptType, updates: Partial<PromptState>) => {
    setPromptStates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...updates
      }
    }));
  }, []);

  const registerEligibility = useCallback((type: PromptType, isEligible: boolean) => {
    setEligibilityMap(prev => {
      if (prev[type] === isEligible) return prev;
      return { ...prev, [type]: isEligible };
    });
  }, []);

  // Core Evaluation Logic
  const evaluatePrompts = useCallback(() => {
    const now = Date.now();
    
    // Ordered by priority
    const priorityList: PromptType[] = ['vendorVerification', 'cookie', 'notification', 'pwa', 'community', 'mobileApp'];
    
    for (const type of priorityList) {
      const config = PROMPT_CONFIG[type];
      if (!config.enabled) continue;
      if (!eligibilityMap[type]) continue; // Component says it's not eligible (e.g. unsupported, already installed)

      const state = promptStates[type];
      
      // If already resolved, skip
      if (['ACCEPTED', 'INSTALLED', 'BLOCKED'].includes(state.status)) {
        continue;
      }
      
      // If cookie is declined, we still consider it resolved (doesn't show again)
      if (type === 'cookie' && state.status === 'DECLINED') {
        continue;
      }

      // Check cooldown
      if (state.nextEligibleAt && now < state.nextEligibleAt) {
        continue;
      }

      // If we reach here, this is the highest priority eligible prompt
      setActivePrompt(type);
      return;
    }

    // If no prompts are eligible, clear active prompt
    setActivePrompt(null);
  }, [eligibilityMap, promptStates]);

  // Re-evaluate when eligibility or state changes
  useEffect(() => {
    evaluatePrompts();
  }, [evaluatePrompts]);

  const dismissPrompt = useCallback((type: PromptType) => {
    const config = PROMPT_CONFIG[type];
    const cooldownMs = (config as any).cooldownHours ? (config as any).cooldownHours * 60 * 60 * 1000 : 0;
    
    // For PWA, progressively increase cooldown based on promptCount
    let finalCooldownMs = cooldownMs;
    if (type === 'pwa' && promptStates.pwa.promptCount > 0) {
      if (promptStates.pwa.promptCount === 1) finalCooldownMs = 24 * 60 * 60 * 1000; // 24 hours
      else if (promptStates.pwa.promptCount === 2) finalCooldownMs = 3 * 24 * 60 * 60 * 1000; // 3 days
      else finalCooldownMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    updatePromptState(type, {
      status: 'DECLINED',
      lastShownAt: Date.now(),
      nextEligibleAt: Date.now() + finalCooldownMs,
      promptCount: promptStates[type].promptCount + 1
    });
    setActivePrompt(null);
  }, [promptStates, updatePromptState]);

  const acceptPrompt = useCallback((type: PromptType) => {
    updatePromptState(type, {
      status: type === 'pwa' || type === 'mobileApp' ? 'INSTALLED' : 'ACCEPTED',
      lastShownAt: Date.now(),
      promptCount: promptStates[type].promptCount + 1
    });
    setActivePrompt(null);
  }, [promptStates, updatePromptState]);

  return (
    <PromptEngineContext.Provider value={{
      activePrompt,
      getPromptState,
      updatePromptState,
      dismissPrompt,
      acceptPrompt,
      registerEligibility,
      evaluatePrompts,
      sessionViews
    }}>
      {children}
    </PromptEngineContext.Provider>
  );
};

export const usePromptEngine = (): PromptEngineContextType => {
  const context = useContext(PromptEngineContext);
  if (!context) {
    throw new Error('usePromptEngine must be used within a PromptEngineProvider');
  }
  return context as PromptEngineContextType;
};
