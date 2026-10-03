/**
 * FormField - Reusable form input field with label
 * Eliminates duplicate inline styling across form components
 *
 * @param {string} label - Field label text
 * @param {string} type - Input type (text, number, date, etc.)
 * @param {string} value - Input value
 * @param {Function} onChange - Change handler
 * @param {string} placeholder - Input placeholder
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Whether field is disabled
 * @param {object} containerStyle - Additional container styles
 * @param {object} inputStyle - Additional input styles
 */
export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  containerStyle = {},
  inputStyle = {},
  ...inputProps
}) {
  return (
    <div style={containerStyle}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--line)',
          padding: '8px',
          borderRadius: '4px',
          font: 'inherit',
          ...inputStyle,
        }}
        {...inputProps}
      />
    </div>
  );
}
