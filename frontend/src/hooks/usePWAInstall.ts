import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export type PWAInstallStatus = 'UNAVAILABLE' | 'AVAILABLE' | 'DISMISSED' | 'INSTALLED';

const PWA_INSTALLED_KEY = 'dovi_pwa_installed';
const DISMISSED_AT_KEY = 'dovi_pwa_install_dismissed_at';
const SHOWN_THIS_SESSION_KEY = 'dovi_pwa_shown_this_session';
const PAGE_VIEWS_KEY = 'dovi_pwa_page_views';

// Configurations
const PWA_INSTALL_COOLDOWN_DAYS = 3;
const PWA_INSTALL_DELAY_MS = 30000; // 30 seconds delay on mount
const MIN_PAGE_VIEWS = 2; // minimum 2 page views required

export function usePWAInstall() {
  const location = useLocation();
  const [pwaState, setPwaState] = useState<PWAInstallStatus>('UNAVAILABLE');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track mount timestamp
  const mountTimeRef = useRef<number>(Date.now());
  const delayElapsedRef = useRef<boolean>(false);

  // Check if current display mode is standalone (app is installed and active)
  const checkStandalone = useCallback(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
      
    if (isStandalone) {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      setPwaState('INSTALLED');
      return true;
    }
    
    if (localStorage.getItem(PWA_INSTALLED_KEY) === 'true') {
      setPwaState('INSTALLED');
      return true;
    }
    return false;
  }, []);

  // Track page views in sessionStorage
  useEffect(() => {
    try {
      const views = parseInt(sessionStorage.getItem(PAGE_VIEWS_KEY) || '0', 10);
      sessionStorage.setItem(PAGE_VIEWS_KEY, (views + 1).toString());
    } catch (e) {
      console.error('Failed to update session page views:', e);
    }
  }, [location.pathname]);

  // Check if current route is blacklisted
  const isRouteBlacklisted = useCallback((path: string) => {
    const blacklist = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/checkout',
      '/payment'
    ];
    return blacklist.some(blacklisted => path.startsWith(blacklisted));
  }, []);

  // Detect iOS Safari
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|opera|opios|ucbrowser/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);
  }, []);

  // Listen to beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      
      // If we are not already installed, set state to AVAILABLE
      if (localStorage.getItem(PWA_INSTALLED_KEY) !== 'true') {
        setPwaState('AVAILABLE');
        console.log('PWA installation is AVAILABLE (beforeinstallprompt captured)');
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      setPwaState('INSTALLED');
      setShowInstallPrompt(false);
      console.log('PWA appinstalled event triggered - Dovi is now installed!');
      // Track analytics
      logAnalytics('pwa_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial checks
    checkStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkStandalone]);

  // Monitor document focused inputs & modals in real time
  useEffect(() => {
    const monitorState = () => {
      // 1. Check if user is typing
      const activeEl = document.activeElement;
      const userIsTyping = !!(activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      ));
      setIsTyping(userIsTyping);

      // 2. Check if another modal is open
      // In Dovi, modals have zIndex: 999 or position: fixed with overlay style.
      // We exclude our own prompt overlay which has class '.dovi-pwa-backdrop'
      const overlays = Array.from(document.querySelectorAll('div'));
      const activeOverlays = overlays.some(el => {
        // Exclude the backdrop of our own install prompt or cookie banner
        if (el.classList.contains('dovi-pwa-backdrop') || el.classList.contains('dovi-cookie-backdrop')) {
          return false;
        }
        
        const style = el.style;
        // Check inline position: fixed and high z-index (modal layout behavior)
        const isFixed = style.position === 'fixed' || style.position === 'absolute';
        const isHighZIndex = style.zIndex === '999' || style.zIndex === '400' || style.zIndex === '300';
        const hasOverlayBackground = style.backgroundColor && (style.backgroundColor.includes('rgba(0, 0, 0') || style.backgroundColor.includes('rgba(0,0,0'));
        
        return isFixed && (isHighZIndex || hasOverlayBackground);
      });
      setIsModalOpen(activeOverlays);
    };

    // Monitor via interval and event listeners
    const interval = setInterval(monitorState, 500);
    window.addEventListener('focusin', monitorState);
    window.addEventListener('click', monitorState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focusin', monitorState);
      window.removeEventListener('click', monitorState);
    };
  }, []);

  // Cooldown validation
  const checkCooldown = useCallback(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_AT_KEY);
      if (!dismissedAt) return true;

      const diffTime = Date.now() - parseInt(dismissedAt, 10);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= PWA_INSTALL_COOLDOWN_DAYS;
    } catch (e) {
      console.error('Failed to parse cooldown timestamp:', e);
      return true;
    }
  }, []);

  // Check general eligibility and control prompt visibility
  useEffect(() => {
    // 1. Initial 30-second delay check
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < PWA_INSTALL_DELAY_MS && !delayElapsedRef.current) {
      const timer = setTimeout(() => {
        delayElapsedRef.current = true;
      }, PWA_INSTALL_DELAY_MS - elapsed);
      setShowInstallPrompt(false);
      return () => clearTimeout(timer);
    }

    // 2. Main checks
    const installed = localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
    if (installed) {
      setShowInstallPrompt(false);
      return;
    }

    // Is iOS, or beforeinstallprompt event is caught (meaning PWA is installable)
    const isPWAInstallable = pwaState === 'AVAILABLE' || isIOS;
    if (!isPWAInstallable) {
      setShowInstallPrompt(false);
      return;
    }

    // Cooldown verification (Wait 3 days after clicking "Maybe Later")
    if (!checkCooldown()) {
      setShowInstallPrompt(false);
      return;
    }

    // Session-level check: do not show if shown during the current tab session
    const shownThisSession = sessionStorage.getItem(SHOWN_THIS_SESSION_KEY) === 'true';
    if (shownThisSession) {
      setShowInstallPrompt(false);
      return;
    }

    // Minimum page views verification
    let views = 0;
    try {
      views = parseInt(sessionStorage.getItem(PAGE_VIEWS_KEY) || '0', 10);
    } catch {}
    if (views < MIN_PAGE_VIEWS) {
      setShowInstallPrompt(false);
      return;
    }

    // Blacklist paths check (checkout, auth pages, etc.)
    if (isRouteBlacklisted(location.pathname)) {
      setShowInstallPrompt(false);
      return;
    }

    // Interruption controls: do not show if user is typing or if another modal is open
    if (isTyping || isModalOpen) {
      setShowInstallPrompt(false);
      return;
    }

    // If all conditions pass, make the prompt visible!
    setShowInstallPrompt(true);
  }, [pwaState, isIOS, location.pathname, isTyping, isModalOpen, checkCooldown, isRouteBlacklisted]);

  // Trigger actual installation
  const triggerInstall = useCallback(async () => {
    logAnalytics('pwa_install_clicked');
    
    if (isIOS) {
      // iOS is handled by displaying instructions, which is controlled in UI component.
      return;
    }

    if (!deferredPrompt) {
      console.warn('Programmatic installation is unavailable (deferredPrompt is null)');
      return;
    }

    try {
      // Show native prompt
      deferredPrompt.prompt();
      
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`User choice result: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        setPwaState('INSTALLED');
        setShowInstallPrompt(false);
        logAnalytics('pwa_install_accepted');
      } else {
        logAnalytics('pwa_install_dismissed');
        // If they dismiss the browser prompt, apply cooldown as well
        dismissInstall();
      }
    } catch (err) {
      console.error('Error during PWA installation prompt:', err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS]);

  // Handle "Maybe Later" click
  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_AT_KEY, Date.now().toString());
      sessionStorage.setItem(SHOWN_THIS_SESSION_KEY, 'true');
      setShowInstallPrompt(false);
      setPwaState('DISMISSED');
      logAnalytics('pwa_prompt_maybe_later');
    } catch (e) {
      console.error('Failed to persist dismissal cooldown:', e);
    }
  }, []);

  // Helper for structured analytics logging
  const logAnalytics = (eventName: string) => {
    console.log(`[DOVI Analytics] Event logged: ${eventName}`);
    // If there is any global analytics endpoint, we can hook it here.
    if ((window as any).DoviAnalytics) {
      try {
        (window as any).DoviAnalytics.track(eventName);
      } catch (err) {
        console.error('Failed to log event to DoviAnalytics:', err);
      }
    }
  };

  // Trigger event when prompt renders for analytics
  useEffect(() => {
    if (showInstallPrompt) {
      logAnalytics('pwa_prompt_shown');
    }
  }, [showInstallPrompt]);

  return {
    pwaState,
    isIOS,
    showInstallPrompt,
    triggerInstall,
    dismissInstall,
  };
}
