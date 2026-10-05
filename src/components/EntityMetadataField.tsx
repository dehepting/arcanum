import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface EntityMetadataFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  validation?: ((value: string) => string | null) | null;
  options?: SelectOption[] | null;
  multiline?: boolean;
  clearable?: boolean;
  onClear?: (() => void) | null;
}

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
  options = null,
  multiline = false,
  clearable = false,
  onClear = null,
}: EntityMetadataFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ((type === 'text' || type === 'date') && 'select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    // Validate
    if (validation) {
      const validationError = validation(String(editValue));
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError(null);
    setIsEditing(false);

    // Only call onChange if value actually changed
    if (editValue !== value) {
      onChange(String(editValue));
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={editValue}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditValue(e.target.value)}
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
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder={placeholder}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={editValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
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
