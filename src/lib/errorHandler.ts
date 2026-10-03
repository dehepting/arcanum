/**
 * Error Handling Utilities
 *
 * Centralized error handling for Tauri commands and other operations
 * Note: Uses console directly for error logging as this is a low-level utility
 * and tests expect console.error to be called
 */

/**
 * Options for error handling wrapper
 */
export interface ErrorHandlingOptions {
  operation?: string;
  showToast?: boolean;
  onError?: (error: unknown, errorMessage: string) => void;
  silent?: boolean;
}

/**
 * Wraps a Tauri command with error handling and user-friendly messages
 *
 * @param commandFn - The Tauri command function to execute
 * @param options - Options for error handling
 * @returns The command result or throws with user-friendly message
 *
 * @example
 * const artifacts = await withErrorHandling(
 *   () => invoke('list_artifacts', { projectId }),
 *   { operation: 'load artifacts' }
 * );
 */
export async function withErrorHandling<T>(
  commandFn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T> {
  const { operation = 'complete operation', showToast = false, onError, silent = false } = options;

  try {
    return await commandFn();
  } catch (error) {
    const errorMessage = getErrorMessage(error, operation);

    if (!silent) {
      console.error(`Failed to ${operation}:`, error);
    }

    if (showToast) {
      // TODO: Integrate with toast notification system when available
      console.warn('Toast notification:', errorMessage);
    }

    if (onError) {
      onError(error, errorMessage);
    }

    throw new Error(errorMessage);
  }
}

/**
 * Extracts a user-friendly error message from various error formats
 *
 * @param error - The error object
 * @param operation - The operation that failed
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, operation = 'complete operation'): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return `Failed to ${operation}. Please try again.`;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || `Failed to ${operation}`;
  }

  // Handle Tauri error format
  if (error && typeof error === 'object' && 'message' in error) {
    return (error.message as string) || `Failed to ${operation}`;
  }

  // Handle object errors
  if (typeof error === 'object') {
    return JSON.stringify(error);
  }

  // Fallback
  return `Failed to ${operation}. Please try again.`;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates required fields in an object
 *
 * @param data - Data object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with valid flag and errors array
 *
 * @example
 * const { valid, errors } = validateRequired(formData, ['name', 'email']);
 * if (!valid) {
 *   alert(errors.join('\n'));
 *   return;
 * }
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    // Check for null/undefined or empty strings
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      errors.push(`${field} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Options for retry with backoff
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Retries a failed operation with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns The function result
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch(url),
 *   { maxAttempts: 3, delayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, shouldRetry = () => true } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff: delay * 2^(attempt-1)
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
