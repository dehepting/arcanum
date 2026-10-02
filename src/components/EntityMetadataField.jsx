import { useState, useRef, useEffect } from 'react';

/**
 * Reusable metadata field component with inline editing
 * Supports text, textarea, number, date, and select inputs
 */
export default function EntityMetadataField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  icon = null,
  validation = null,
  options = null, // For select type
  multiline = false,
  clearable = false,
  onClear = null,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'date') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    // Validate
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError(null);
    setIsEditing(false);

    // Only call onChange if value actually changed
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClear = () => {
    setEditValue('');
    setError(null);
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  const displayValue = value || <span className="metadata-empty">{placeholder || 'Not set'}</span>;
  const wrapperClass = `metadata-field-wrapper ${multiline ? 'full-width' : ''}`;

  return (
    <div className={wrapperClass}>
      <div className="metadata-field-label">
        {icon && <span className="metadata-field-icon">{icon}</span>}
        <strong>{label}:</strong>
      </div>
      <div className="metadata-field-value-container">
        {!isEditing ? (
          <div className="metadata-field-display" onClick={() => setIsEditing(true)}>
            {displayValue}
            {clearable && value && (
              <button
                className="metadata-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                title="Clear value"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="metadata-field-edit">
            {type === 'select' ? (
              <select
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
              >
                <option value="">{placeholder || 'Select...'}</option>
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : multiline ? (
              <textarea
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder={placeholder}
              />
            ) : (
              <input
                ref={inputRef}
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                step={type === 'number' ? '0.0001' : undefined}
              />
            )}
            <div className="metadata-field-actions">
              <button className="metadata-save-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="metadata-cancel-btn" onClick={handleCancel}>
                ✕
              </button>
            </div>
          </div>
        )}
        {error && <div className="metadata-field-error">{error}</div>}
      </div>
    </div>
  );
}
