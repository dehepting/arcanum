/**
 * FormSelect - Reusable form select field with label
 * Eliminates duplicate inline styling across form components
 *
 * @param {string} label - Field label text
 * @param {string} value - Selected value
 * @param {Function} onChange - Change handler
 * @param {Array} options - Array of {value, label} or string options
 * @param {boolean} disabled - Whether field is disabled
 * @param {object} containerStyle - Additional container styles
 * @param {object} selectStyle - Additional select styles
 */
export default function FormSelect({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  containerStyle = {},
  selectStyle = {},
  ...selectProps
}) {
  return (
    <div style={containerStyle}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--line)',
          padding: '8px',
          borderRadius: '4px',
          font: 'inherit',
          ...selectStyle,
        }}
        {...selectProps}
      >
        {options.map((option) => {
          // Handle both string options and {value, label} objects
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
