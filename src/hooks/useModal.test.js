import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from './useModal';

describe('useModal', () => {
  it('initializes with closed state by default', () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('initializes with provided initial state', () => {
    const { result } = renderHook(() => useModal(true));

    expect(result.current.isOpen).toBe(true);
  });

  it('opens modal', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('closes modal', () => {
    const { result } = renderHook(() => useModal(true));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('toggles modal state', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('maintains callback reference stability', () => {
    const { result, rerender } = renderHook(() => useModal());

    const firstOpen = result.current.open;
    const firstClose = result.current.close;
    const firstToggle = result.current.toggle;

    rerender();

    expect(result.current.open).toBe(firstOpen);
    expect(result.current.close).toBe(firstClose);
    expect(result.current.toggle).toBe(firstToggle);
  });

  it('handles multiple open calls', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.open();
      result.current.open();
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('handles multiple close calls', () => {
    const { result } = renderHook(() => useModal(true));

    act(() => {
      result.current.close();
      result.current.close();
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
