import { useState, useEffect, useCallback } from 'react';

/**
 * Reusable form state management hook
 * Handles both create and edit modes with automatic initialization
 *
 * @param {Object} defaultValues - Default values for new form
 * @param {Object} initialData - Initial data for edit mode (optional)
 * @param {boolean} isOpen - Modal/form open state (triggers reset)
 * @returns {[Object, Function, Function, Function]} [formData, setField, setFormData, resetForm]
 *
 * @example
 * const [formData, setField, setFormData, resetForm] = useFormState(
 *   { name: '', description: '' },
 *   artifact, // edit mode data
 *   isOpen
 * );
 */
export function useFormState(defaultValues = {}, initialData = null, isOpen = true) {
  const [formData, setFormData] = useState(defaultValues);

  // Initialize form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode - populate from initialData
        const populated = {};
        Object.keys(defaultValues).forEach((key) => {
          populated[key] = initialData[key] !== undefined ? initialData[key] : defaultValues[key];
        });
        setFormData(populated);
      } else {
        // Create mode - use defaults
        setFormData(defaultValues);
      }
    }
  }, [initialData, isOpen]); // defaultValues intentionally excluded to avoid infinite loop

  // Update a single field
  const setField = useCallback((field, value) => {
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
 * @param {Object} formData - Form data to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, errors: string[] }
 *
 * @example
 * const { valid, errors } = validateRequired(formData, ['name', 'email']);
 * if (!valid) {
 *   alert(errors.join('\n'));
 *   return;
 * }
 */
export function validateRequired(formData, requiredFields) {
  const errors = [];

  requiredFields.forEach((field) => {
    const value = formData[field];
    if (value === undefined || value === null || value === '') {
      // Convert snake_case to Title Case for better error messages
      const fieldLabel = field
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
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url) {
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
export function validateDate(date) {
  if (!date) return true; // Allow empty
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate number range
 */
export function validateRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}
