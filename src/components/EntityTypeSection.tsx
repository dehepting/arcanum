import { useState, useRef, useEffect } from 'react';
import { getEntityType } from '../lib/entityTypes';

interface Entity {
  id: string;
  name: string;
  [key: string]: any;
}

interface EntityTypeSectionProps {
  type: string;
  entities?: Entity[];
  isExpanded: boolean;
  onToggle: () => void;
  onEntityClick: (type: string, entity: Entity) => void;
  onEntityDoubleClick: (entity: Entity, e: React.MouseEvent) => void;
  onEntityRename: (entityId: string | null) => void;
  onLoadMore: (type: string) => void;
  onCreateNew: (type: string) => void;
  editingEntityId: string | null | undefined;
  editingEntityName: string;
  onEditingNameChange: (name: string) => void;
  totalCount?: number;
  limit?: number;
  hasMore?: boolean;
  showCreate?: boolean;
}

/**
 * Reusable entity type section for EntityExplorer sidebar
 * Eliminates duplication of People, Events, Theories, Places, Artifacts sections
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
  showCreate = true,
}: EntityTypeSectionProps) {
  const config = getEntityType(type);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus rename input
  useEffect(() => {
    if (editingEntityId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingEntityId]);

  const handleKeyDown = (e: React.KeyboardEvent, entityId: string) => {
    if (e.key === 'Enter') {
      onEntityRename(entityId);
    } else if (e.key === 'Escape') {
      onEntityRename(null); // Cancel rename
    }
  };

  return (
    <div>
      {/* Entity Type Header - Always visible with count */}
      <div className="entity-type-item" onClick={onToggle}>
        <span className="section-icon">{isExpanded ? '▾' : '▸'}</span>
        <span className="entity-icon">{config.icon}</span>
        <span className="entity-label">{config.labelPlural}</span>
        <span className="entity-count">({totalCount})</span>
      </div>

      {/* Entity List Content */}
      {isExpanded && (
        <div className="section-content">
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
          {showCreate && (
            <button className="create-entity-btn" onClick={() => onCreateNew(type)}>
              + Create {config.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
