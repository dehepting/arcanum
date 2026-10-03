import { useState, useCallback, useEffect } from 'react';

/**
 * useAsync hook return type
 */
export interface UseAsyncReturn<TData, TArgs extends unknown[]> {
  execute: (...args: TArgs) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook for managing async operations with loading, error, and data states
 *
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately on mount (default: false)
 * @returns State and control functions for the async operation
 *
 * @example
 * const { execute, loading, error, data } = useAsync(async (id: string) => {
 *   return await fetchUser(id);
 * });
 *
 * // Call when needed
 * await execute(userId);
 *
 * // Or auto-execute on mount
 * const { loading, data } = useAsync(fetchData, true);
 */
export function useAsync<TData, TArgs extends unknown[]>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  immediate = false
): UseAsyncReturn<TData, TArgs> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as TArgs));
    }
  }, [execute, immediate]);

  return { execute, loading, error, data, reset };
}
