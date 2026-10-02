import { useState, useRef, useEffect } from 'react';
import { getEntityType } from '../lib/entityTypes';

/**
 * Reusable entity type section for EntityExplorer sidebar
 * Eliminates duplication of People, Events, Theories, Places, Artifacts sections
 *
 * @param {string} type - Entity type ('person', 'event', etc.)
 * @param {Array} entities - Filtered entities to display
 * @param {boolean} isExpanded - Whether section is expanded
 * @param {Function} onToggle - Toggle expand/collapse
 * @param {Function} onEntityClick - Handle entity click
 * @param {Function} onEntityDoubleClick - Handle entity double-click for rename
 * @param {Function} onEntityRename - Handle entity rename save
 * @param {Function} onLoadMore - Handle load more button click
 * @param {Function} onCreateNew - Handle create new entity button click
 * @param {string} editingEntityId - ID of entity currently being renamed
 * @param {string} editingEntityName - Current value of rename input
 * @param {Function} onEditingNameChange - Handle rename input change
 * @param {number} totalCount - Total count (for display in header)
 * @param {number} limit - Current limit (for "Load More" logic)
 * @param {boolean} hasMore - Whether there are more entities to load
 */
export default function EntityTypeSection({
  type,
  entities = [],
  isExpanded,
  onToggle,
  onEntityClick,
  onEntityDoubleClick,
  onEntityRename,
  onLoadMore,
  onCreateNew,
  editingEntityId,
  editingEntityName,
  onEditingNameChange,
  totalCount = 0,
  limit = 10,
  hasMore = false,
}) {
  const config = getEntityType(type);
  const inputRef = useRef(null);

  // Auto-focus rename input
  useEffect(() => {
    if (editingEntityId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingEntityId]);

  const handleKeyDown = (e, entityId) => {
    if (e.key === 'Enter') {
      onEntityRename(entityId);
    } else if (e.key === 'Escape') {
      onEntityRename(null); // Cancel rename
    }
  };

  return (
    <div className="explorer-section">
      {/* Section Header */}
      <div className="section-header" onClick={onToggle}>
        <span className="section-icon">{isExpanded ? '▾' : '▸'}</span>
        <span className="section-title">{config.labelPlural}</span>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="section-content">
          {/* Entity Type Toggle */}
          <div className="entity-type-item">
            <span className="entity-icon">{config.icon}</span>
            <span className="entity-label">{config.labelPlural}</span>
            <span className="entity-count">{totalCount}</span>
          </div>

          {/* Entity List */}
          {entities.length === 0 ? (
            <div className="placeholder-text">No {config.labelPlural.toLowerCase()} yet</div>
          ) : (
            entities.map((entity) => (
              <div
                key={entity.id}
                className="entity-result"
                onClick={() => onEntityClick(type, entity)}
                onDoubleClick={(e) => onEntityDoubleClick(entity, e)}
              >
                <span className="entity-result-icon">{config.icon}</span>
                {editingEntityId === entity.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="rename-input"
                    value={editingEntityName}
                    onChange={(e) => onEditingNameChange(e.target.value)}
                    onBlur={() => onEntityRename(entity.id)}
                    onKeyDown={(e) => handleKeyDown(e, entity.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="entity-result-name">{entity.name}</span>
                )}
              </div>
            ))
          )}

          {/* Load More Button */}
          {hasMore && (
            <button className="load-more-btn" onClick={() => onLoadMore(type)}>
              Load More {config.labelPlural}
            </button>
          )}

          {/* Create New Button */}
          <button className="create-entity-btn" onClick={() => onCreateNew(type)}>
            + New {config.label}
          </button>
        </div>
      )}
    </div>
  );
}
