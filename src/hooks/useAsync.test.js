import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  it('should have correct initial state', () => {
    const asyncFn = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should execute async function successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    const asyncFn = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useAsync(asyncFn));

    let returnValue;
    await act(async () => {
      returnValue = await result.current.execute();
    });

    expect(asyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(mockData);
    expect(returnValue).toBe(mockData);
  });

  it('should handle async function errors', async () => {
    const mockError = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBe(null);
  });

  it('should set loading state during execution', async () => {
    const asyncFn = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve('data'), 100)));
    const { result } = renderHook(() => useAsync(asyncFn));

    act(() => {
      result.current.execute();
    });

    // Should be loading immediately
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('data');
  });

  it('should execute immediately when immediate is true', async () => {
    const mockData = 'immediate data';
    const asyncFn = vi.fn().mockResolvedValue(mockData);

    renderHook(() => useAsync(asyncFn, true));

    await waitFor(() => {
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });

  it('should not execute immediately when immediate is false', () => {
    const asyncFn = vi.fn().mockResolvedValue('data');

    renderHook(() => useAsync(asyncFn, false));

    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('should pass arguments to async function', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute('arg1', 'arg2', 123);
    });

    expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should reset state', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));

    // Execute first
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('data');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should clear previous error on new execution', async () => {
    const mockError = new Error('First error');
    const asyncFn = vi.fn().mockRejectedValueOnce(mockError).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useAsync(asyncFn));

    // First execution - error
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected
      }
    });

    expect(result.current.error).toBe(mockError);

    // Second execution - success
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('success');
  });
});
