import type { ReactNode } from 'react';

interface Entity {
  [key: string]: any;
}

interface EntityReviewSectionProps {
  title: string;
  singularLabel: string;
  entities: Entity[];
  selected: Set<number>;
  onAdd: () => void;
  onToggle: (entityType: string, index: number) => void;
  onUpdate: (entityType: string, index: number, field: string, value: any) => void;
  onRemove: (entityType: string, index: number) => void;
  renderFields: (entity: Entity, index: number) => ReactNode;
  entityType: string;
}

/**
 * EntityReviewSection - Reusable section for entity review/creation
 * Eliminates duplication across People, Events, Theories, Places sections in EntityReview
 */
export default function EntityReviewSection({
  title,
  singularLabel,
  entities,
  selected,
  onAdd,
  onToggle,
  onUpdate,
  onRemove,
  renderFields,
  entityType,
}: EntityReviewSectionProps) {
  return (
    <div className="entity-section">
      <div className="section-header">
        <h3>
          {title} ({entities.length})
        </h3>
        <button className="add-btn" onClick={onAdd}>
          + Add {singularLabel}
        </button>
      </div>
      {entities.map((entity, index) => (
        <div key={index} className="entity-item">
          <input
            type="checkbox"
            checked={selected.has(index)}
            onChange={() => onToggle(entityType, index)}
          />
          <div className="entity-fields">{renderFields(entity, index)}</div>
          <button className="remove-btn" onClick={() => onRemove(entityType, index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
