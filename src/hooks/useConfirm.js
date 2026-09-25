import { useState, useCallback } from 'react';

/**
 * Custom hook for managing confirmation dialogs
 *
 * @returns {Object} { confirm, ConfirmDialog props }
 *
 * @example
 * function MyComponent() {
 *   const { confirm, confirmProps } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item',
 *       message: 'Are you sure you want to delete this item?',
 *       confirmText: 'Delete',
 *       variant: 'danger'
 *     });
 *
 *     if (confirmed) {
 *       await deleteItem();
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Delete</button>
 *       <ConfirmDialog {...confirmProps} />
 *     </>
 *   );
 * }
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setConfig(options);
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef(true);
    }
    setIsOpen(false);
  }, [resolveRef]);

  const handleClose = useCallback(() => {
    if (resolveRef) {
      resolveRef(false);
    }
    setIsOpen(false);
  }, [resolveRef]);

  return {
    confirm,
    confirmProps: {
      isOpen,
      onClose: handleClose,
      onConfirm: handleConfirm,
      ...config,
    },
  };
}
