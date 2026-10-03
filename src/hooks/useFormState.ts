import { useState, useEffect, useCallback } from 'react';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * useFormState hook return type
 */
export type UseFormStateReturn<TFormData> = [
  formData: TFormData,
  setField: <K extends keyof TFormData>(field: K, value: TFormData[K]) => void,
  setFormData: (data: TFormData) => void,
  resetForm: () => void,
];

/**
 * Reusable form state management hook
 * Handles both create and edit modes with automatic initialization
 *
 * @param defaultValues - Default values for new form
 * @param initialData - Initial data for edit mode (optional)
 * @param isOpen - Modal/form open state (triggers reset)
 * @returns Tuple of [formData, setField, setFormData, resetForm]
 *
 * @example
 * const [formData, setField, setFormData, resetForm] = useFormState(
 *   { name: '', description: '' },
 *   artifact, // edit mode data
 *   isOpen
 * );
 */
export function useFormState<TFormData extends Record<string, unknown>>(
  defaultValues: TFormData,
  initialData: Partial<TFormData> | null = null,
  isOpen = true
): UseFormStateReturn<TFormData> {
  const [formData, setFormData] = useState<TFormData>(defaultValues);

  // Initialize form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode - populate from initialData
        const populated = {} as TFormData;
        (Object.keys(defaultValues) as Array<keyof TFormData>).forEach((key) => {
          populated[key] =
            initialData[key] !== undefined
              ? (initialData[key] as TFormData[typeof key])
              : defaultValues[key];
        });
        setFormData(populated);
      } else {
        // Create mode - use defaults
        setFormData(defaultValues);
      }
    }
  }, [initialData, isOpen]); // defaultValues intentionally excluded to avoid infinite loop

  // Update a single field
  const setField = useCallback(<K extends keyof TFormData>(field: K, value: TFormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Reset to defaults
  const resetForm = useCallback(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

  return [formData, setField, setFormData, resetForm];
}

/**
 * Validate required fields
 *
 * @param formData - Form data to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with valid flag and error messages
 *
 * @example
 * const { valid, errors } = validateRequired(formData, ['name', 'email']);
 * if (!valid) {
 *   alert(errors.join('\n'));
 *   return;
 * }
 */
export function validateRequired<TFormData extends Record<string, unknown>>(
  formData: TFormData,
  requiredFields: Array<keyof TFormData>
): ValidationResult {
  const errors: string[] = [];

  requiredFields.forEach((field) => {
    const value = formData[field];
    if (value === undefined || value === null || value === '') {
      // Convert snake_case to Title Case for better error messages
      const fieldLabel = String(field)
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      errors.push(`${fieldLabel} is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): boolean {
  if (!date) return true; // Allow empty
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate number range
 */
export function validateRange(value: string | number, min?: number, max?: number): boolean {
  const num = parseFloat(String(value));
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}
