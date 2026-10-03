/**
 * EntityReviewSection - Reusable section for entity review/creation
 * Eliminates duplication across People, Events, Theories, Places sections in EntityReview
 *
 * @param {string} title - Section title (e.g., "People")
 * @param {string} singularLabel - Singular form for button (e.g., "Person")
 * @param {Array} entities - Array of entity objects
 * @param {Set} selected - Set of selected entity indices
 * @param {Function} onAdd - Handler for adding new entity
 * @param {Function} onToggle - Handler for toggling entity selection (entityType, index)
 * @param {Function} onUpdate - Handler for updating entity field (entityType, index, field, value)
 * @param {Function} onRemove - Handler for removing entity (entityType, index)
 * @param {Function} renderFields - Function to render entity-specific fields (entity, index)
 * @param {string} entityType - Entity type key (e.g., 'people', 'events')
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
}) {
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
