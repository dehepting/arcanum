import type { CSSProperties, SelectHTMLAttributes, ChangeEvent } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options?: (string | SelectOption)[];
  disabled?: boolean;
  containerStyle?: CSSProperties;
  selectStyle?: CSSProperties;
}

/**
 * FormSelect - Reusable form select field with label
 * Eliminates duplicate inline styling across form components
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
}: FormSelectProps) {
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
