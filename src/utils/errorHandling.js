import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 * @param {string} message - Success message to display
 * @param {Object} options - Additional toast options
 */
export function showSuccess(message, options = {}) {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
}

/**
 * Show an error toast notification
 * @param {string|Error} error - Error message or Error object
 * @param {Object} options - Additional toast options
 */
export function showError(error, options = {}) {
  const message = typeof error === 'string' ? error : error?.message || 'An error occurred';

  // Still log to console for debugging
  if (error instanceof Error) {
    console.error(error);
  }

  toast.error(message, {
    duration: 5000,
    ...options,
  });
}

/**
 * Show a warning toast notification
 * @param {string} message - Warning message to display
 * @param {Object} options - Additional toast options
 */
export function showWarning(message, options = {}) {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    ...options,
  });
}

/**
 * Show an info toast notification
 * @param {string} message - Info message to display
 * @param {Object} options - Additional toast options
 */
export function showInfo(message, options = {}) {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    ...options,
  });
}

/**
 * Handle async operation with automatic error handling and loading state
 * @param {Function} operation - Async function to execute
 * @param {Object} messages - Success/error/loading messages
 * @returns {Promise} Result of the operation
 */
export async function handleAsyncOperation(
  operation,
  messages = {
    loading: 'Processing...',
    success: 'Success!',
    error: 'Operation failed',
  }
) {
  const toastId = messages.loading ? toast.loading(messages.loading) : null;

  try {
    const result = await operation();

    if (toastId) {
      toast.dismiss(toastId);
    }

    if (messages.success) {
      showSuccess(messages.success);
    }

    return result;
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId);
    }

    const errorMessage = messages.error
      ? `${messages.error}: ${error.message || 'Unknown error'}`
      : error.message || 'Operation failed';

    showError(errorMessage);
    throw error; // Re-throw to allow caller to handle if needed
  }
}

/**
 * Wrap a function with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} errorMessage - Error message prefix
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, errorMessage = 'Operation failed') {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      showError(`${errorMessage}: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };
}

/**
 * Parse and display Tauri errors
 * @param {Error} error - Error from Tauri invoke
 * @returns {string} User-friendly error message
 */
export function parseTauriError(error) {
  // Tauri errors often have a specific structure
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Remove technical stack trace info
    return error.message.split('\n')[0];
  }

  return 'An unexpected error occurred';
}
