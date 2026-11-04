import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// SmartsuppChat Component
// Integrates Smartsupp Live Chat widget asynchronously:
// - Loads only if VITE_SMARTSUPP_KEY is defined in .env
// - Dynamically injects script into document head/body
// - Automatically syncs authenticated user details (name, email, role, id)
// - Clears user details on logout
// ============================================================
export default function SmartsuppChat() {
  const { user } = useAuth();
  const scriptInjected = useRef(false);
  const smartsuppKey = (import.meta.env.VITE_SMARTSUPP_KEY || '').trim();

  // 1. Initialize Smartsupp script once when key exists
  useEffect(() => {
    if (!smartsuppKey || typeof window === 'undefined') return;

    if (!scriptInjected.current && !window._smartsupp) {
      window._smartsupp = window._smartsupp || {};
      window._smartsupp.key = smartsuppKey;

      if (!window.smartsupp) {
        const queueFunc: any = function () {
          // eslint-disable-next-line prefer-rest-params
          queueFunc._.push(arguments);
        };
        queueFunc._ = [];
        window.smartsupp = queueFunc;
      }

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
  }, [smartsuppKey]);

  // 2. Sync user profile when user authentication state changes
  useEffect(() => {
    if (!smartsuppKey || typeof window === 'undefined' || !window.smartsupp) return;

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
  }, [user, smartsuppKey]);

  return null;
}
