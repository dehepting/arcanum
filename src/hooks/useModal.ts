import { useState, useCallback } from 'react';

/**
 * Modal state interface
 */
export interface ModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing modal state
 *
 * @param initialState - Initial open/closed state
 * @returns Modal state and control functions
 *
 * @example
 * const modal = useModal();
 * return (
 *   <>
 *     <button onClick={modal.open}>Open</button>
 *     <Modal isOpen={modal.isOpen} onClose={modal.close}>...</Modal>
 *   </>
 * );
 */
export function useModal(initialState = false): ModalState {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
