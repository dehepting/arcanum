interface ModeBannerProps {
  message: string;
  variant?: 'primary' | 'secondary';
  onCancel?: () => void;
}

/**
 * ModeBanner - Reusable banner for map mode indicators
 * Used for location placement, pin placement, and overlay/georeferencing modes
 */
export default function ModeBanner({ message, variant = 'primary', onCancel }: ModeBannerProps) {
  const isPrimary = variant === 'primary';

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: isPrimary ? 'var(--accent)' : 'var(--accent-2)',
        color: isPrimary ? '#fff' : '#0e0f12',
        padding: '10px 16px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        fontWeight: isPrimary ? 'normal' : 500,
      }}
    >
      <span>{message}</span>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
