import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing async operations with loading, error, and data states
 *
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Whether to execute immediately on mount (default: false)
 * @returns {Object} { execute, loading, error, data, reset }
 *
 * @example
 * const { execute, loading, error, data } = useAsync(async (id) => {
 *   return await fetchUser(id);
 * });
 *
 * // Call when needed
 * await execute(userId);
 *
 * // Or auto-execute on mount
 * const { loading, data } = useAsync(fetchData, true);
 */
export function useAsync(asyncFunction, immediate = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
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
      execute();
    }
  }, [execute, immediate]);

  return { execute, loading, error, data, reset };
}
