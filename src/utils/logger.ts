/**
 * Logging utility for development and debugging
 * Automatically disabled in production builds
 */

const isDevelopment = (import.meta as { env?: { DEV?: boolean } }).env?.DEV;

/**
 * Logger interface
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  group: (label: string, fn: () => void) => void;
}

export const logger: Logger = {
  /**
   * Debug log - only shows in development
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info log - only shows in development
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning log - shows in both dev and prod
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error log - shows in both dev and prod
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Group logs together (only in development)
   */
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};
