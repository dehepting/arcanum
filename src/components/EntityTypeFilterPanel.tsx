import type { ChangeEvent } from 'react';

interface EntityTypeFilters {
  place: boolean;
  person: boolean;
  event: boolean;
  theory: boolean;
  artifact: boolean;
}

interface EntityTypeFilterPanelProps {
  filters: EntityTypeFilters;
  onFilterChange: (type: string, checked: boolean) => void;
}

interface EntityTypeConfig {
  type: string;
  icon: string;
  label: string;
  color: string;
}

/**
 * EntityTypeFilterPanel - Reusable filter panel for showing/hiding entity types on map
 * Extracted from MapView.jsx to improve modularity and readability
 */
export default function EntityTypeFilterPanel({
  filters,
  onFilterChange,
}: EntityTypeFilterPanelProps) {
  const entityTypes: EntityTypeConfig[] = [
    { type: 'place', icon: '📍', label: 'Places', color: '#e8b86d' },
    { type: 'person', icon: '👤', label: 'People', color: '#60a5fa' },
    { type: 'event', icon: '📅', label: 'Events', color: '#f87171' },
    { type: 'theory', icon: '💡', label: 'Theories', color: '#c084fc' },
    { type: 'artifact', icon: '🏺', label: 'Artifacts', color: '#34d399' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minWidth: '180px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '8px',
          color: 'var(--text)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Show on Map
      </div>
      {entityTypes.map(({ type, icon, label, color }) => (
        <label
          key={type}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text)',
          }}
        >
          <input
            type="checkbox"
            checked={filters[type as keyof EntityTypeFilters]}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onFilterChange(type, e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ flex: 1 }}>{label}</span>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: color,
              border: '1px solid #0e0f12',
            }}
          />
        </label>
      ))}
    </div>
  );
}
