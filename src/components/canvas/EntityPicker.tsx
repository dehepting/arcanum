import { useState, useEffect, useRef, useMemo, type ChangeEvent, type MouseEvent } from 'react';
import useStore from '../../store/useStore';
import './EntityPicker.css';

interface EntityWithType {
  id: string;
  name: string;
  entityType: 'person' | 'event' | 'theory' | 'place' | 'artifact';
  icon: string;
  color: string;
  [key: string]: any;
}

interface EntitySelection {
  entityId: string;
  entityType: string;
  entityName: string;
}

interface EntityPickerProps {
  onSelect: (selection: EntitySelection) => void;
  onClose: () => void;
}

export default function EntityPicker({ onSelect, onClose }: EntityPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);

  // All entities combined with their type (memoized for performance)
  const allEntities = useMemo<EntityWithType[]>(
    () => [
      ...people.map((e) => ({ ...e, entityType: 'person' as const, icon: '👤', color: 'blue' })),
      ...events.map((e) => ({ ...e, entityType: 'event' as const, icon: '📅', color: 'red' })),
      ...theories.map((e) => ({
        ...e,
        entityType: 'theory' as const,
        icon: '💡',
        color: 'yellow',
      })),
      ...places.map((e) => ({ ...e, entityType: 'place' as const, icon: '📍', color: 'green' })),
      ...artifacts.map((e) => ({
        ...e,
        entityType: 'artifact' as const,
        icon: '🏺',
        color: 'violet',
      })),
    ],
    [people, events, theories, places, artifacts]
  );

  // Filter entities based on search (memoized for performance)
  const filteredEntities = useMemo(
    () =>
      searchQuery
        ? allEntities.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : allEntities,
    [allEntities, searchQuery]
  );

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelect = (entity: EntityWithType) => {
    onSelect({
      entityId: entity.id,
      entityType: entity.entityType,
      entityName: entity.name,
    });
    onClose();
  };

  return (
    <div className="entity-picker-overlay" onClick={onClose}>
      <div className="entity-picker" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="entity-picker-header">
          <input
            ref={inputRef}
            type="text"
            className="entity-picker-search"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
          <button className="entity-picker-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="entity-picker-results">
          {filteredEntities.length === 0 ? (
            <div className="entity-picker-empty">No entities found</div>
          ) : (
            filteredEntities.slice(0, 50).map((entity) => (
              <div
                key={`${entity.entityType}-${entity.id}`}
                className="entity-picker-item"
                onClick={() => handleSelect(entity)}
              >
                <span className="entity-picker-icon">{entity.icon}</span>
                <div className="entity-picker-info">
                  <div className="entity-picker-name">{entity.name}</div>
                  <div className="entity-picker-type">{entity.entityType}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
