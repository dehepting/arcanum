import { useState, useEffect } from 'react';
import useStore from '../store/useStore';

/**
 * LoadingScreen - Waits for Zustand store to hydrate from IndexedDB
 *
 * Displays loading message while state is being restored from persistent storage.
 * Prevents rendering the app before state is fully loaded to avoid flash of empty state.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - App to render after hydration completes
 */
export default function LoadingScreen({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // If persist is not available (test mode), skip hydration
    if (!useStore.persist) {
      setIsHydrated(true);
      return;
    }

    // Set a timeout fallback in case hydration hangs
    const timeout = setTimeout(() => {
      console.warn('Hydration timeout - proceeding anyway');
      setIsHydrated(true);
    }, 2000); // 2 second timeout

    // Check if already hydrated (might be synchronous)
    if (useStore.persist.hasHydrated()) {
      clearTimeout(timeout);
      setIsHydrated(true);
      return;
    }

    // Wait for hydration to complete
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      clearTimeout(timeout);
      setIsHydrated(true);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  if (!isHydrated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 'var(--space-4)',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-default)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
          Restoring your work...
        </p>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return children;
}
