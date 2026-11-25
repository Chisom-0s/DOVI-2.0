import { useEffect, useState } from 'react';

let sharedNow = new Date();
const listeners = new Set<(now: Date) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  sharedNow = new Date();
  listeners.forEach((fn) => fn(sharedNow));
}

/**
 * useSharedClock — Singleton 1-second synchronized clock hook.
 * Replaces N individual setInterval instances with a single shared timer.
 * Automatically sleeps when no components are listening.
 */
export function useSharedClock(enabled = true): Date {
  const [now, setNow] = useState<Date>(() => sharedNow);

  useEffect(() => {
    if (!enabled) return;
    listeners.add(setNow);
    if (!timer) {
      timer = setInterval(tick, 1000);
    }
    return () => {
      listeners.delete(setNow);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, [enabled]);

  return now;
}
