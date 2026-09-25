/**
 * Error Handling Utilities
 *
 * Centralized error handling for Tauri commands and other operations
 */

/**
 * Wraps a Tauri command with error handling and user-friendly messages
 *
 * @param {Function} commandFn - The Tauri command function to execute
 * @param {Object} options - Options for error handling
 * @param {string} options.operation - Description of the operation (e.g., "load artifacts")
 * @param {boolean} options.showToast - Whether to show a toast notification on error
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.silent - If true, doesn't log errors to console
 * @returns {Promise} The command result or throws with user-friendly message
 *
 * @example
 * const artifacts = await withErrorHandling(
 *   () => invoke('list_artifacts', { projectId }),
 *   { operation: 'load artifacts' }
 * );
 */
export async function withErrorHandling(commandFn, options = {}) {
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
 * @param {Error|string|Object} error - The error object
 * @param {string} operation - The operation that failed
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, operation = 'complete operation') {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || `Failed to ${operation}`;
  }

  // Handle Tauri error format
  if (error?.message) {
    return error.message;
  }

  // Handle object errors
  if (typeof error === 'object') {
    return JSON.stringify(error);
  }

  // Fallback
  return `Failed to ${operation}. Please try again.`;
}

/**
 * Validates required fields in an object
 *
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, errors: string[] }
 *
 * @example
 * const { valid, errors } = validateRequired(formData, ['name', 'email']);
 * if (!valid) {
 *   alert(errors.join('\n'));
 *   return;
 * }
 */
export function validateRequired(data, requiredFields) {
  const errors = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retries a failed operation with exponential backoff
 *
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.delayMs - Initial delay in milliseconds (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if error should retry
 * @returns {Promise} The function result
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch(url),
 *   { maxAttempts: 3, delayMs: 1000 }
 * );
 */
export async function retryWithBackoff(fn, options = {}) {
  const { maxAttempts = 3, delayMs = 1000, shouldRetry = () => true } = options;

  let lastError;

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
