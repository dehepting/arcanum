import { getEntityTypeConfig } from '../config/entityTypes';
import EntityFormItem from './EntityFormItem';
import './EntitySection.css';
import type { EntityType } from '../types/entities';

interface Entity {
  [key: string]: any;
}

interface EntitySectionProps {
  entityType: EntityType;
  entities: Entity[];
  selectedIndices: Set<number>;
  onToggleSelection: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

/**
 * EntitySection - Reusable section for managing entities in EntityReview
 */
export default function EntitySection({
  entityType,
  entities,
  selectedIndices,
  onToggleSelection,
  onUpdate,
  onRemove,
  onAdd,
}: EntitySectionProps) {
  const config = getEntityTypeConfig(entityType);

  return (
    <div className="entity-section">
      <div className="entity-section-header">
        <h3>
          {config.icon} {config.labelPlural} ({entities.length})
        </h3>
        <button className="entity-section-add" onClick={onAdd}>
          + Add {config.label}
        </button>
      </div>

      <div className="entity-section-items">
        {entities.length === 0 ? (
          <div className="entity-section-empty">
            No {config.labelPlural.toLowerCase()} added yet
          </div>
        ) : (
          entities.map((entity, index) => (
            <EntityFormItem
              key={index}
              entityType={entityType}
              entity={entity}
              index={index}
              selected={selectedIndices.has(index)}
              onToggleSelection={onToggleSelection}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}
