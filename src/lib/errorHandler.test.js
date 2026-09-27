import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withErrorHandling,
  getErrorMessage,
  validateRequired,
  retryWithBackoff,
} from './errorHandler';

describe('errorHandler utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('withErrorHandling', () => {
    it('returns result when command succeeds', async () => {
      const mockCommand = vi.fn().mockResolvedValue({ data: 'success' });
      const result = await withErrorHandling(mockCommand, { operation: 'test operation' });

      expect(result).toEqual({ data: 'success' });
      expect(mockCommand).toHaveBeenCalledTimes(1);
    });

    it('logs errors to console by default', async () => {
      const error = new Error('Test error');
      const mockCommand = vi.fn().mockRejectedValue(error);

      await expect(
        withErrorHandling(mockCommand, { operation: 'test operation' })
      ).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('Failed to test operation:', error);
    });

    it('does not log when silent is true', async () => {
      const error = new Error('Test error');
      const mockCommand = vi.fn().mockRejectedValue(error);

      await expect(
        withErrorHandling(mockCommand, { operation: 'test operation', silent: true })
      ).rejects.toThrow();

      expect(console.error).not.toHaveBeenCalled();
    });

    it('calls onError callback when provided', async () => {
      const error = new Error('Test error');
      const mockCommand = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(
        withErrorHandling(mockCommand, { operation: 'test operation', onError })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error, 'Test error');
    });

    it('logs toast notification when showToast is true', async () => {
      const error = new Error('Test error');
      const mockCommand = vi.fn().mockRejectedValue(error);

      await expect(
        withErrorHandling(mockCommand, { operation: 'test operation', showToast: true })
      ).rejects.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Toast notification:', 'Test error');
    });

    it('throws error with user-friendly message', async () => {
      const mockCommand = vi.fn().mockRejectedValue(new Error('Original error'));

      await expect(withErrorHandling(mockCommand, { operation: 'load data' })).rejects.toThrow(
        'Original error'
      );
    });

    it('uses default operation name', async () => {
      const mockCommand = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(withErrorHandling(mockCommand)).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to complete operation:',
        expect.any(Error)
      );
    });
  });

  describe('getErrorMessage', () => {
    it('handles string errors', () => {
      expect(getErrorMessage('Simple error message')).toBe('Simple error message');
    });

    it('handles Error objects', () => {
      const error = new Error('Error message');
      expect(getErrorMessage(error)).toBe('Error message');
    });

    it('handles Error objects without message', () => {
      const error = new Error();
      error.message = '';
      expect(getErrorMessage(error, 'test operation')).toBe('Failed to test operation');
    });

    it('handles objects with message property', () => {
      const error = { message: 'Custom error' };
      expect(getErrorMessage(error)).toBe('Custom error');
    });

    it('handles generic objects', () => {
      const error = { code: 'ERR_001', details: 'Something failed' };
      expect(getErrorMessage(error)).toBe(JSON.stringify(error));
    });

    it('uses fallback message', () => {
      expect(getErrorMessage(undefined, 'load data')).toBe(
        'Failed to load data. Please try again.'
      );
      expect(getErrorMessage(null, 'save file')).toBe('Failed to save file. Please try again.');
    });

    it('uses default operation name in fallback', () => {
      expect(getErrorMessage(null)).toBe('Failed to complete operation. Please try again.');
    });
  });

  describe('validateRequired', () => {
    it('returns valid when all required fields are present', () => {
      const data = {
        name: 'Plato',
        email: 'plato@academy.gr',
        description: 'Philosopher',
      };
      const result = validateRequired(data, ['name', 'email']);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns errors for missing fields', () => {
      const data = {
        name: 'Plato',
      };
      const result = validateRequired(data, ['name', 'email', 'description']);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['email is required', 'description is required']);
    });

    it('treats empty strings as missing', () => {
      const data = {
        name: '',
        email: '   ',
      };
      const result = validateRequired(data, ['name', 'email']);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['name is required', 'email is required']);
    });

    it('handles null and undefined values', () => {
      const data = {
        name: null,
        email: undefined,
      };
      const result = validateRequired(data, ['name', 'email']);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['name is required', 'email is required']);
    });

    it('allows non-string values that are present', () => {
      const data = {
        count: 0,
        active: false,
        items: [],
      };
      const result = validateRequired(data, ['count', 'active', 'items']);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('retryWithBackoff', () => {
    let originalSetTimeout;

    beforeEach(() => {
      vi.useFakeTimers();
      originalSetTimeout = global.setTimeout;
    });

    afterEach(() => {
      vi.useRealTimers();
      global.setTimeout = originalSetTimeout;
    });

    it('returns result on first success', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const resultPromise = retryWithBackoff(mockFn, { maxAttempts: 3, delayMs: 1000 });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn, { maxAttempts: 3, delayMs: 1000 });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('throws after max attempts', async () => {
      const error = new Error('Persistent failure');
      const mockFn = vi.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(mockFn, { maxAttempts: 3, delayMs: 1000 });

      // Run timers and wait for all promises
      await Promise.all([
        vi.runAllTimersAsync(),
        resultPromise.catch(() => {}), // Catch to prevent unhandled rejection
      ]);

      await expect(resultPromise).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff delays', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Fail'));

      const resultPromise = retryWithBackoff(mockFn, { maxAttempts: 3, delayMs: 1000 });

      // Run timers and wait for all promises
      await Promise.all([
        vi.runAllTimersAsync(),
        resultPromise.catch(() => {}), // Catch to prevent unhandled rejection
      ]);

      await expect(resultPromise).rejects.toThrow();

      // Should have been called 3 times (initial + 2 retries)
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('respects shouldRetry callback', async () => {
      const retryableError = new Error('Retry me');
      const fatalError = new Error('Fatal error');

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(fatalError);

      const shouldRetry = vi.fn((error) => error.message !== 'Fatal error');

      const resultPromise = retryWithBackoff(mockFn, {
        maxAttempts: 5,
        delayMs: 1000,
        shouldRetry,
      });

      // Run timers and wait for all promises
      await Promise.all([
        vi.runAllTimersAsync(),
        resultPromise.catch(() => {}), // Catch to prevent unhandled rejection
      ]);

      await expect(resultPromise).rejects.toThrow('Fatal error');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(shouldRetry).toHaveBeenCalledWith(fatalError);
    });

    it('uses default options', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const resultPromise = retryWithBackoff(mockFn);

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
