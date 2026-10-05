import type { CSSProperties, TextareaHTMLAttributes, ChangeEvent } from 'react';

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  containerStyle?: CSSProperties;
  textareaStyle?: CSSProperties;
}

/**
 * FormTextarea - Reusable form textarea field with label
 * Eliminates duplicate inline styling across form components
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
}: FormTextareaProps) {
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
