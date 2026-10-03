/**
 * FormTextarea - Reusable form textarea field with label
 * Eliminates duplicate inline styling across form components
 *
 * @param {string} label - Field label text
 * @param {string} value - Textarea value
 * @param {Function} onChange - Change handler
 * @param {string} placeholder - Textarea placeholder
 * @param {number} rows - Number of rows
 * @param {boolean} disabled - Whether field is disabled
 * @param {object} containerStyle - Additional container styles
 * @param {object} textareaStyle - Additional textarea styles
 */
export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  containerStyle = {},
  textareaStyle = {},
  ...textareaProps
}) {
  return (
    <div style={containerStyle}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--line)',
          padding: '8px',
          borderRadius: '4px',
          font: 'inherit',
          resize: 'vertical',
          ...textareaStyle,
        }}
        {...textareaProps}
      />
    </div>
  );
}
