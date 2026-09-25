import { useState, useEffect } from 'react';

/**
 * Custom hook for loading data with loading/error states
 *
 * @param {Function} loadFn - Async function that loads the data
 * @param {Array} deps - Dependencies that trigger reload
 * @param {Object} options - Options: { skip: boolean }
 * @returns {Object} { data, loading, error, reload }
 *
 * @example
 * const { data: claims, loading } = useLoadData(
 *   () => getClaims(artifactId),
 *   [artifactId]
 * );
 */
export function useLoadData(loadFn, deps = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error('Failed to load data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadFn();
      setData(result);
    } catch (err) {
      console.error('Failed to reload data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, reload };
}
