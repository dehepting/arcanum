import { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import './EntityPicker.css';

export default function EntityPicker({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);

  // All entities combined with their type
  const allEntities = [
    ...people.map((e) => ({ ...e, entityType: 'person', icon: '👤', color: 'blue' })),
    ...events.map((e) => ({ ...e, entityType: 'event', icon: '📅', color: 'red' })),
    ...theories.map((e) => ({ ...e, entityType: 'theory', icon: '💡', color: 'yellow' })),
    ...places.map((e) => ({ ...e, entityType: 'place', icon: '📍', color: 'green' })),
    ...artifacts.map((e) => ({ ...e, entityType: 'artifact', icon: '🏺', color: 'violet' })),
  ];

  // Filter entities based on search
  const filteredEntities = searchQuery
    ? allEntities.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allEntities;

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelect = (entity) => {
    onSelect({
      entityId: entity.id,
      entityType: entity.entityType,
      entityName: entity.name,
    });
    onClose();
  };

  return (
    <div className="entity-picker-overlay" onClick={onClose}>
      <div className="entity-picker" onClick={(e) => e.stopPropagation()}>
        <div className="entity-picker-header">
          <input
            ref={inputRef}
            type="text"
            className="entity-picker-search"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
