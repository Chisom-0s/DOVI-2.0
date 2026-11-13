import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// SmartsuppChat Component
// Integrates Smartsupp Live Chat widget with:
// - Exact project key: e9146c760832a54792657588a0c209aa694d26da
// - Guaranteed clearance above Dovi's 64px fixed bottom navigation
// - Prevents any overlap between the "Chat with Chichi" widget and Account tab
// - Dynamic MutationObserver & window resize support
// - User identity syncing with Smartsupp session
// ============================================================

const DEFAULT_KEY = 'e9146c760832a54792657588a0c209aa694d26da';

export default function SmartsuppChat() {
  const { user } = useAuth();
  const scriptInjected = useRef(false);
  const smartsuppKey = (import.meta.env.VITE_SMARTSUPP_KEY || DEFAULT_KEY).trim();

  // Helper to determine optimal offsets for current viewport
  const getResponsiveOffsets = () => {
    if (typeof window === 'undefined') return { x: 24, y: 24 };
    const isMobile = window.innerWidth < 768;
    // On mobile (<768px), float 88px from bottom to completely clear
    // Dovi's 64px bottom nav bar, ensuring the Account tab is 100% accessible
    return {
      x: isMobile ? 16 : 24,
      y: isMobile ? 88 : 24,
    };
  };

  // 1. Initialize Smartsupp script & responsive layout
  useEffect(() => {
    if (!smartsuppKey || typeof window === 'undefined') return;

    const { x, y } = getResponsiveOffsets();

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = smartsuppKey;
    window._smartsupp.orientation = 'right';
    window._smartsupp.offsetX = x;
    window._smartsupp.offsetY = y;
    window._smartsupp.zIndex = 99990;

    if (!window.smartsupp) {
      const queueFunc: any = function () {
        // eslint-disable-next-line prefer-rest-params
        queueFunc._.push(arguments);
      };
      queueFunc._ = [];
      window.smartsupp = queueFunc;
    }

    // Configure brand primary color
    window.smartsupp('theme:color', '#ff7a00');

    // Only inject script if not already present
    if (!scriptInjected.current && !document.querySelector('script[src*="smartsuppchat.com"]')) {
      const doc = document;
      const script = doc.createElement('script');
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.src = 'https://www.smartsuppchat.com/loader.js?';

      const firstScript = doc.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        doc.head.appendChild(script);
      }
      scriptInjected.current = true;
    }

    // 2. DOM Enforcement: Direct style application on Smartsupp iframe/container
    // Guarantees the button is positioned above the Account tab on mobile
    let isChatOpen = false;

    const applyOptimalPosition = () => {
      const isMobile = window.innerWidth < 768;
      const targetBottom = isMobile ? '88px' : '24px';
      const targetRight = isMobile ? '16px' : '24px';

      const smartsuppElements = document.querySelectorAll<HTMLElement>(
        '#chat-application-iframe, iframe[id*="chat-application"], iframe[id*="smartsupp"], iframe[title*="Smartsupp"], #smartsupp-widget-container'
      );

      smartsuppElements.forEach((el) => {
        if (!el) return;
        if (isChatOpen) {
          // When open, allow full-screen / expanded messenger dimensions
          el.removeAttribute('data-chat-closed');
          el.setAttribute('data-chat-open', 'true');
        } else {
          // When closed, lock to optimal floating coordinates above bottom nav
          el.removeAttribute('data-chat-open');
          el.setAttribute('data-chat-closed', 'true');
          el.style.setProperty('bottom', targetBottom, 'important');
          el.style.setProperty('right', targetRight, 'important');
        }
      });
    };

    // Listen to Smartsupp API events
    try {
      if (typeof window.smartsupp === 'function') {
        window.smartsupp('on', 'chat:open', () => {
          isChatOpen = true;
          applyOptimalPosition();
        });
        window.smartsupp('on', 'chat:close', () => {
          isChatOpen = false;
          applyOptimalPosition();
        });
      }
    } catch {
      // Event subscription fallback
    }

    // Set up MutationObserver to detect when Smartsupp injects or updates its iframe
    const observer = new MutationObserver(() => {
      applyOptimalPosition();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.addEventListener('resize', applyOptimalPosition, { passive: true });
    window.addEventListener('orientationchange', applyOptimalPosition, { passive: true });

    // Initial positioning
    applyOptimalPosition();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', applyOptimalPosition);
      window.removeEventListener('orientationchange', applyOptimalPosition);
    };
  }, [smartsuppKey]);

  // 3. Sync authenticated user identity with Smartsupp
  useEffect(() => {
    if (!smartsuppKey || typeof window === 'undefined' || typeof window.smartsupp !== 'function') return;

    try {
      if (user) {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        window.smartsupp('name', fullName);
        window.smartsupp('email', user.email);
        window.smartsupp('variables', {
          userId: { value: user.id, label: 'User ID' },
          role: { value: user.role, label: 'Account Role' },
          phone: { value: user.phone || 'N/A', label: 'Phone' },
        });
      } else {
        window.smartsupp('name', '');
        window.smartsupp('email', '');
      }
    } catch {
      // Ignore if smartsupp is not ready
    }
  }, [user, smartsuppKey]);

  return null;
}
