import { useState } from 'react';
import useStore from '../store/useStore';
import Modal from './Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal - Application settings and preferences
 *
 * Features:
 * - Clear cached data (IndexedDB state persistence)
 * - Future: Theme settings, keyboard shortcuts, etc.
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(useStore as any).persist) {
      alert('Persistence is not enabled in this environment.');
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to clear all cached data?\n\n' +
        'This will:\n' +
        '• Clear saved project state\n' +
        '• Clear entity data (will reload from database)\n' +
        '• Reset UI preferences\n\n' +
        'Your projects and data in the database will NOT be affected.'
    );

    if (!confirmed) return;

    setIsClearing(true);

    try {
      // Clear Zustand persisted state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (useStore as any).persist.clearStorage();

      // Also clear any other localStorage items
      localStorage.removeItem('arcanum_last_project_id');

      alert('Cache cleared successfully! The app will now reload.');

      // Reload the page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
      setIsClearing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: 'var(--space-4)' }}>
        <section style={{ marginBottom: 'var(--space-6)' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              marginBottom: 'var(--space-2)',
              color: 'var(--text-primary)',
            }}
          >
            Storage & Cache
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)',
              lineHeight: 1.5,
            }}
          >
            Arcanum caches your project data locally for faster loading. Clear the cache if you
            experience sync issues or want to free up storage space.
          </p>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--danger, #ef4444)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isClearing ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              opacity: isClearing ? 0.6 : 1,
            }}
          >
            {isClearing ? 'Clearing...' : 'Clear All Cached Data'}
          </button>
        </section>

        <section style={{ marginBottom: 'var(--space-6)' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              marginBottom: 'var(--space-2)',
              color: 'var(--text-primary)',
            }}
          >
            About
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong>Arcanum</strong> - Historical research and knowledge management
            <br />
            <span style={{ fontStyle: 'italic' }}>collige et serva</span> (gather and preserve)
          </p>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: 'var(--space-3) var(--space-5)',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
