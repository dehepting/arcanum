import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state
 *
 * @param {boolean} initialState - Initial open/closed state
 * @returns {Object} { isOpen, open, close, toggle }
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
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
