import type { CSSProperties, InputHTMLAttributes, ChangeEvent } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: CSSProperties;
  inputStyle?: CSSProperties;
}

/**
 * FormField - Reusable form input field with label
 * Eliminates duplicate inline styling across form components
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
}: FormFieldProps) {
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
