import { useState, useEffect, ReactNode } from 'react';
import useStore from '../store/useStore';

interface LoadingScreenProps {
  children: ReactNode;
}

/**
 * LoadingScreen - Waits for Zustand store to hydrate from IndexedDB
 *
 * Displays loading message while state is being restored from persistent storage.
 * Prevents rendering the app before state is fully loaded to avoid flash of empty state.
 */
export default function LoadingScreen({ children }: LoadingScreenProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // If persist is not available (test mode), skip hydration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(useStore as any).persist) {
      setIsHydrated(true);
      return;
    }

    // Set a timeout fallback in case hydration hangs
    const timeout = setTimeout(() => {
      console.warn('Hydration timeout - proceeding anyway');
      setIsHydrated(true);
    }, 2000); // 2 second timeout

    // Check if already hydrated (might be synchronous)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((useStore as any).persist.hasHydrated()) {
      clearTimeout(timeout);
      setIsHydrated(true);
      return;
    }

    // Wait for hydration to complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (useStore as any).persist.onFinishHydration(() => {
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
