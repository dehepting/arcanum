import toast, { type ToastOptions } from 'react-hot-toast';

/**
 * Show a success toast notification
 * @param message - Success message to display
 * @param options - Additional toast options
 */
export function showSuccess(message: string, options: ToastOptions = {}): void {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
}

/**
 * Show an error toast notification
 * @param error - Error message or Error object
 * @param options - Additional toast options
 */
export function showError(error: string | Error, options: ToastOptions = {}): void {
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
 * @param message - Warning message to display
 * @param options - Additional toast options
 */
export function showWarning(message: string, options: ToastOptions = {}): void {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    ...options,
  });
}

/**
 * Show an info toast notification
 * @param message - Info message to display
 * @param options - Additional toast options
 */
export function showInfo(message: string, options: ToastOptions = {}): void {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    ...options,
  });
}

/**
 * Messages configuration for async operations
 */
export interface AsyncOperationMessages {
  loading?: string;
  success?: string;
  error?: string;
}

/**
 * Handle async operation with automatic error handling and loading state
 * @param operation - Async function to execute
 * @param messages - Success/error/loading messages
 * @returns Result of the operation
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  messages: AsyncOperationMessages = {
    loading: 'Processing...',
    success: 'Success!',
    error: 'Operation failed',
  }
): Promise<T> {
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
      ? `${messages.error}: ${(error as Error).message || 'Unknown error'}`
      : (error as Error).message || 'Operation failed';

    showError(errorMessage);
    throw error; // Re-throw to allow caller to handle if needed
  }
}

/**
 * Wrap a function with error handling
 * @param fn - Function to wrap
 * @param errorMessage - Error message prefix
 * @returns Wrapped function
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  errorMessage = 'Operation failed'
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (error) {
      showError(`${errorMessage}: ${(error as Error).message || 'Unknown error'}`);
      throw error;
    }
  };
}

/**
 * Parse and display Tauri errors
 * @param error - Error from Tauri invoke
 * @returns User-friendly error message
 */
export function parseTauriError(error: unknown): string {
  // Tauri errors often have a specific structure
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    // Remove technical stack trace info
    return (error.message as string).split('\n')[0];
  }

  return 'An unexpected error occurred';
}
