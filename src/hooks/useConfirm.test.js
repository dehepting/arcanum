import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirm } from './useConfirm';

describe('useConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with closed state', () => {
    const { result } = renderHook(() => useConfirm());

    expect(result.current.confirmProps.isOpen).toBe(false);
  });

  it('opens dialog when confirm is called', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm();
    });

    expect(result.current.confirmProps.isOpen).toBe(true);
  });

  it('returns promise that resolves to true on confirm', async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise;
    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete Item',
        message: 'Are you sure?',
      });
    });

    expect(result.current.confirmProps.isOpen).toBe(true);

    // Confirm the dialog
    act(() => {
      result.current.confirmProps.onConfirm();
    });

    const confirmed = await confirmPromise;
    expect(confirmed).toBe(true);
    expect(result.current.confirmProps.isOpen).toBe(false);
  });

  it('returns promise that resolves to false on close', async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise;
    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete Item',
        message: 'Are you sure?',
      });
    });

    expect(result.current.confirmProps.isOpen).toBe(true);

    // Close the dialog
    act(() => {
      result.current.confirmProps.onClose();
    });

    const confirmed = await confirmPromise;
    expect(confirmed).toBe(false);
    expect(result.current.confirmProps.isOpen).toBe(false);
  });

  it('passes config options to confirmProps', () => {
    const { result } = renderHook(() => useConfirm());

    const config = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    };

    act(() => {
      result.current.confirm(config);
    });

    expect(result.current.confirmProps.isOpen).toBe(true);
    expect(result.current.confirmProps.title).toBe('Delete Item');
    expect(result.current.confirmProps.message).toBe('Are you sure you want to delete this item?');
    expect(result.current.confirmProps.confirmText).toBe('Delete');
    expect(result.current.confirmProps.cancelText).toBe('Cancel');
    expect(result.current.confirmProps.variant).toBe('danger');
  });

  it('handles multiple sequential confirmations', async () => {
    const { result } = renderHook(() => useConfirm());

    // First confirmation
    let confirmPromise1;
    act(() => {
      confirmPromise1 = result.current.confirm({ title: 'First' });
    });

    act(() => {
      result.current.confirmProps.onConfirm();
    });

    const result1 = await confirmPromise1;
    expect(result1).toBe(true);

    // Second confirmation
    let confirmPromise2;
    act(() => {
      confirmPromise2 = result.current.confirm({ title: 'Second' });
    });

    act(() => {
      result.current.confirmProps.onClose();
    });

    const result2 = await confirmPromise2;
    expect(result2).toBe(false);
  });

  it('can be used with default empty options', async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise;
    act(() => {
      confirmPromise = result.current.confirm();
    });

    expect(result.current.confirmProps.isOpen).toBe(true);

    act(() => {
      result.current.confirmProps.onConfirm();
    });

    const confirmed = await confirmPromise;
    expect(confirmed).toBe(true);
  });

  it('maintains separate state for each hook instance', async () => {
    const { result: result1 } = renderHook(() => useConfirm());
    const { result: result2 } = renderHook(() => useConfirm());

    act(() => {
      result1.current.confirm({ title: 'First Dialog' });
    });

    expect(result1.current.confirmProps.isOpen).toBe(true);
    expect(result2.current.confirmProps.isOpen).toBe(false);

    act(() => {
      result2.current.confirm({ title: 'Second Dialog' });
    });

    expect(result1.current.confirmProps.isOpen).toBe(true);
    expect(result2.current.confirmProps.isOpen).toBe(true);
  });

  it('closes dialog when onConfirm is called', async () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ title: 'Test' });
    });

    expect(result.current.confirmProps.isOpen).toBe(true);

    act(() => {
      result.current.confirmProps.onConfirm();
    });

    expect(result.current.confirmProps.isOpen).toBe(false);
  });

  it('closes dialog when onClose is called', async () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ title: 'Test' });
    });

    expect(result.current.confirmProps.isOpen).toBe(true);

    act(() => {
      result.current.confirmProps.onClose();
    });

    expect(result.current.confirmProps.isOpen).toBe(false);
  });
});
