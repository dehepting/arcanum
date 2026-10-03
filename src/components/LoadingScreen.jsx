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

    // Wait for Zustand persist middleware to finish hydrating from IndexedDB
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated (synchronous hydration)
    if (useStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
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
