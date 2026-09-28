import { getEntityTypeConfig } from '../config/entityTypes';
import './EntityFormItem.css';

/**
 * EntityFormItem - Generic form item for any entity type
 * Renders form fields based on entity type configuration
 */
export default function EntityFormItem({
  entityType,
  entity,
  index,
  selected,
  onToggleSelection,
  onUpdate,
  onRemove,
}) {
  const config = getEntityTypeConfig(entityType);

  const handleFieldChange = (fieldKey, value) => {
    onUpdate(index, fieldKey, value);
  };

  const renderField = (field) => {
    const value = entity[field.key] ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            key={field.key}
            type="text"
            placeholder={field.label + (field.required ? ' *' : '')}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            key={field.key}
            type="number"
            placeholder={field.label}
            value={value === null ? '' : value}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseFloat(e.target.value);
              handleFieldChange(field.key, val);
            }}
            step={field.step}
          />
        );

      case 'textarea':
        return (
          <textarea
            key={field.key}
            placeholder={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            rows={2}
          />
        );

      case 'select':
        return (
          <select
            key={field.key}
            value={value}
            onChange={(e) => {
              const val =
                field.options[0]?.value !== undefined && typeof field.options[0].value === 'number'
                  ? parseInt(e.target.value)
                  : e.target.value;
              handleFieldChange(field.key, val);
            }}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="entity-form-item">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelection(index)}
        title="Include this entity"
      />
      <div className="entity-form-fields">{config.formFields.map(renderField)}</div>
      <button
        className="entity-form-remove"
        onClick={() => onRemove(index)}
        title="Remove this entity"
        type="button"
      >
        Remove
      </button>
    </div>
  );
}
