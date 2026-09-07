import { useEffect, useState, useCallback } from 'react';
import { usePromptEngine } from '@/contexts/PromptEngineContext';

const PWA_INSTALLED_KEY = 'dovi_pwa_installed';

export function usePWAInstall() {
  const { registerEligibility, acceptPrompt, dismissPrompt } = usePromptEngine();
  const [pwaState, setPwaState] = useState<'UNAVAILABLE' | 'AVAILABLE' | 'INSTALLED'>('UNAVAILABLE');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  
  // Detect iOS Safari
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|opera|opios|ucbrowser/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);
  }, []);

  // Listen to beforeinstallprompt event
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
        
      if (isStandalone) {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        setPwaState('INSTALLED');
        registerEligibility('pwa', false);
        return true;
      }
      return false;
    };

    if (checkStandalone()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (localStorage.getItem(PWA_INSTALLED_KEY) !== 'true') {
        setPwaState('AVAILABLE');
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      setPwaState('INSTALLED');
      acceptPrompt('pwa');
      registerEligibility('pwa', false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [acceptPrompt, registerEligibility]);

  // Report eligibility to the Engine
  useEffect(() => {
    if (pwaState === 'INSTALLED') {
      registerEligibility('pwa', false);
    } else if (pwaState === 'AVAILABLE' || isIOS) {
      registerEligibility('pwa', true);
    } else {
      registerEligibility('pwa', false);
    }
  }, [pwaState, isIOS, registerEligibility]);

  const triggerInstall = useCallback(async () => {
    if (isIOS) return;

    if (!deferredPrompt) {
      console.warn('Programmatic installation is unavailable');
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        setPwaState('INSTALLED');
        acceptPrompt('pwa');
      } else {
        dismissPrompt('pwa');
      }
    } catch (err) {
      console.error('Error during PWA installation prompt:', err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS, acceptPrompt, dismissPrompt]);

  return {
    pwaState,
    isIOS,
    triggerInstall
  };
}
