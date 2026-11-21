import { useState, useEffect, useRef, useCallback } from 'react';
import { adminCache } from '@/services/adminCache';

export interface UseAdminDataOptions<T> {
  ttl?: number;
  staleTtl?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
}

export interface UseAdminDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isRevalidating: boolean;
  error: any;
  mutate: (newData: T | ((prev: T | null) => T), shouldRevalidate?: boolean) => void;
  refetch: (force?: boolean) => Promise<T | null>;
}

export function useAdminData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAdminDataOptions<T> = {}
): UseAdminDataResult<T> {
  const { ttl, staleTtl, enabled = true, onSuccess, onError } = options;

  // Check cache synchronously on initial render
  const cached = enabled ? adminCache.get<T>(key) : null;

  const [data, setData] = useState<T | null>(cached ? cached.data : null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && !cached);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(enabled && Boolean(cached?.isStale));
  const [error, setError] = useState<any>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeFetch = useCallback(
    async (force = false): Promise<T | null> => {
      if (!enabled) return null;

      const currentCached = adminCache.get<T>(key);
      const hasValidData = currentCached !== null;

      if (!hasValidData || force) {
        if (!hasValidData) {
          setIsLoading(true);
        } else {
          setIsRevalidating(true);
        }
      } else if (currentCached.isStale) {
        setIsRevalidating(true);
      }

      setError(null);

      try {
        const result = await adminCache.fetchWithCache<T>(
          key,
          () => fetcherRef.current(),
          { ttl, staleTtl, force }
        );

        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setIsRevalidating(false);
          onSuccessRef.current?.(result);
        }
        return result;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err);
          setIsLoading(false);
          setIsRevalidating(false);
          onErrorRef.current?.(err);
        }
        return null;
      }
    },
    [key, enabled, ttl, staleTtl]
  );

  // Revalidate or fetch when key or enabled changes
  useEffect(() => {
    if (!enabled) return;

    const currentCached = adminCache.get<T>(key);
    if (currentCached) {
      setData(currentCached.data);
      setIsLoading(false);
      if (currentCached.isStale) {
        // Revalidate in background
        void executeFetch(true);
      }
    } else {
      void executeFetch(false);
    }

    // Subscribe to cache invalidation events for this key
    const unsubscribe = adminCache.subscribe(key, () => {
      if (isMountedRef.current && enabled) {
        const updated = adminCache.get<T>(key);
        if (updated) {
          setData(updated.data);
        } else {
          void executeFetch(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [key, enabled, executeFetch]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T), shouldRevalidate = false) => {
      setData((prev) => {
        const next = typeof newData === 'function' ? (newData as (prev: T | null) => T)(prev) : newData;
        adminCache.set(key, next, ttl, staleTtl);
        return next;
      });

      if (shouldRevalidate) {
        void executeFetch(true);
      }
    },
    [key, ttl, staleTtl, executeFetch]
  );

  const refetch = useCallback(
    (force = true) => {
      return executeFetch(force);
    },
    [executeFetch]
  );

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    mutate,
    refetch,
  };
}
