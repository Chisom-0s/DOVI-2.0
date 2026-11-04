import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// SmartsuppChat Component
// Integrates Smartsupp Live Chat widget with:
// - Exact project key: e9146c760832a54792657588a0c209aa694d26da
// - Dynamic responsive positioning across mobile, tablet & desktop
// - Automatic clearance above Dovi's fixed mobile bottom navigation
// - Dovi brand orange accent (#ff7a00)
// - Seamless user session identification (name, email, role, phone)
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
    // On mobile (<768px), float 82px from bottom to clear Dovi's 64px bottom nav bar
    return {
      x: isMobile ? 16 : 24,
      y: isMobile ? 82 : 24,
    };
  };

  // 1. Initialize Smartsupp script & responsive layout
  useEffect(() => {
    if (!smartsuppKey || typeof window === 'undefined') return;

    const { x, y } = getResponsiveOffsets();

    if (!scriptInjected.current && !window._smartsupp) {
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

    // 2. Window resize & orientation listener to maintain perfect responsive positioning
    const handleViewportChange = () => {
      const offsets = getResponsiveOffsets();
      if (typeof window.smartsupp === 'function') {
        try {
          window.smartsupp('offset:x', offsets.x);
          window.smartsupp('offset:y', offsets.y);
        } catch {
          // Ignore if loader hasn't initialized API yet
        }
      }
    };

    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('orientationchange', handleViewportChange, { passive: true });

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
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
