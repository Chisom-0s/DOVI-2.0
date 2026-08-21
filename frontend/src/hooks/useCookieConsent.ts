import { useEffect, useState, useCallback } from 'react';

export type CookieConsentStatus = 'UNKNOWN' | 'ACCEPTED' | 'DECLINED';

export interface CookieConsentRecord {
  status: 'accepted' | 'declined';
  timestamp: string;
  version: string;
}

const STORAGE_KEY = 'dovi_cookie_consent';
const CURRENT_VERSION = '1.0';

export function useCookieConsent() {
  const [cookieState, setCookieState] = useState<CookieConsentStatus>('UNKNOWN');

  // Load state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookieConsentRecord;
        if (parsed.status === 'accepted') {
          setCookieState('ACCEPTED');
        } else if (parsed.status === 'declined') {
          setCookieState('DECLINED');
        }
      }
    } catch (e) {
      console.error('Failed to parse cookie consent record:', e);
    }
  }, []);

  const saveConsent = useCallback((status: 'accepted' | 'declined') => {
    const record: CookieConsentRecord = {
      status,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      setCookieState(status === 'accepted' ? 'ACCEPTED' : 'DECLINED');
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
    }
  }, []);

  const acceptCookies = useCallback(() => {
    saveConsent('accepted');
  }, [saveConsent]);

  const declineCookies = useCallback(() => {
    saveConsent('declined');
  }, [saveConsent]);

  return {
    cookieState,
    acceptCookies,
    declineCookies,
  };
}
