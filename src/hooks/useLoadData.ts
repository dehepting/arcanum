import { useState, useEffect, DependencyList } from 'react';
import { logger } from '@/utils/logger';

/**
 * useLoadData options
 */
export interface UseLoadDataOptions {
  skip?: boolean;
}

/**
 * useLoadData hook return type
 */
export interface UseLoadDataReturn<TData> {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for loading data with loading/error states
 *
 * @param loadFn - Async function that loads the data
 * @param deps - Dependencies that trigger reload
 * @param options - Options: { skip: boolean }
 * @returns Data, loading state, error, and reload function
 *
 * @example
 * const { data: claims, loading } = useLoadData(
 *   () => getClaims(artifactId),
 *   [artifactId]
 * );
 */
export function useLoadData<TData>(
  loadFn: () => Promise<TData>,
  deps: DependencyList = [],
  options: UseLoadDataOptions = {}
): UseLoadDataReturn<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options.skip) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await loadFn();
        setData(result);
      } catch (err) {
        logger.error('Failed to load data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, options.skip]);

  const reload = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadFn();
      setData(result);
    } catch (err) {
      logger.error('Failed to reload data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, reload };
}
