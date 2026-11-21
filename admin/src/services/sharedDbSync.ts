/**
 * DOVI Shared DB Sync Utility
 * 
 * Provides deduplicated, memoized fetching of the local dev shared database (/__dovi_delivery_db__).
 * Prevents multiple services from hammering the endpoint on every route change or API call.
 */

let cachedDb: any = null;
let lastSyncTimestamp = 0;
let inFlightSync: Promise<any> | null = null;
const SYNC_CACHE_TTL = 60 * 1000; // 60 seconds

export async function fetchSharedDbOnce(force = false): Promise<any> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return null;
  }

  const now = Date.now();
  if (!force && cachedDb && now - lastSyncTimestamp < SYNC_CACHE_TTL) {
    return cachedDb;
  }

  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    try {
      const res = await fetch('/__dovi_delivery_db__', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        cachedDb = await res.json();
        lastSyncTimestamp = Date.now();
        return cachedDb;
      }
    } catch {
      // Non-fatal, return null or fallback
    } finally {
      inFlightSync = null;
    }

    lastSyncTimestamp = Date.now(); // throttle subsequent calls even on failure
    return cachedDb;
  })();

  return inFlightSync;
}

export function invalidateSharedDbCache(): void {
  lastSyncTimestamp = 0;
  cachedDb = null;
}
