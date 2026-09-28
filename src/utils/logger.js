/**
 * Logging utility for development and debugging
 * Automatically disabled in production builds
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug log - only shows in development
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info log - only shows in development
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning log - shows in both dev and prod
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error log - shows in both dev and prod
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Group logs together (only in development)
   */
  group: (label, fn) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};
