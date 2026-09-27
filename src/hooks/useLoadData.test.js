import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLoadData } from './useLoadData';

describe('useLoadData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('loads data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    const loadFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useLoadData(loadFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(loadFn).toHaveBeenCalledTimes(1);
  });

  it('handles errors during load', async () => {
    const error = new Error('Load failed');
    const loadFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useLoadData(loadFn, []));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(error);
    expect(console.error).toHaveBeenCalledWith('Failed to load data:', error);
  });

  it('skips loading when skip option is true', () => {
    const loadFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useLoadData(loadFn, [], { skip: true }));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(loadFn).not.toHaveBeenCalled();
  });

  it('reloads data when reload is called', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };
    const loadFn = vi.fn().mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useLoadData(loadFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);

    // Trigger reload
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.data).toEqual(mockData2);
    expect(loadFn).toHaveBeenCalledTimes(2);
  });

  it('reloads when dependencies change', async () => {
    const mockData1 = { id: 1 };
    const mockData2 = { id: 2 };
    const loadFn = vi.fn().mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2);

    const { result, rerender } = renderHook(({ dep }) => useLoadData(loadFn, [dep]), {
      initialProps: { dep: 'first' },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);

    // Change dependency
    rerender({ dep: 'second' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData2);
    expect(loadFn).toHaveBeenCalledTimes(2);
  });

  it('clears error on successful reload after error', async () => {
    const error = new Error('Load failed');
    const mockData = { id: 1, name: 'Test' };
    const loadFn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useLoadData(loadFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error);

    // Reload
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('does not load when skip changes from false to true', async () => {
    const loadFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result, rerender } = renderHook(({ skip }) => useLoadData(loadFn, [], { skip }), {
      initialProps: { skip: false },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(loadFn).toHaveBeenCalledTimes(1);

    // Change skip to true
    rerender({ skip: true });

    expect(result.current.loading).toBe(false);
    expect(loadFn).toHaveBeenCalledTimes(1); // Should not call again
  });

  it('loads when skip changes from true to false', async () => {
    const mockData = { data: 'test' };
    const loadFn = vi.fn().mockResolvedValue(mockData);

    const { result, rerender } = renderHook(({ skip }) => useLoadData(loadFn, [], { skip }), {
      initialProps: { skip: true },
    });

    expect(loadFn).not.toHaveBeenCalled();

    // Change skip to false
    rerender({ skip: false });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(loadFn).toHaveBeenCalledTimes(1);
  });

  it('handles synchronous errors in loadFn', async () => {
    const error = new Error('Sync error');
    const loadFn = vi.fn(() => {
      throw error;
    });

    const { result } = renderHook(() => useLoadData(loadFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBe(null);
  });
});
