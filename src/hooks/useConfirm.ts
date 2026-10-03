import { useState, useCallback } from 'react';

/**
 * Confirmation dialog configuration options
 */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
}

/**
 * Confirmation dialog props
 */
export interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * useConfirm hook return type
 */
export interface UseConfirmReturn {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
  confirmProps: ConfirmDialogProps;
}

/**
 * Custom hook for managing confirmation dialogs
 *
 * @returns Confirm function and ConfirmDialog props
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
export function useConfirm(): UseConfirmReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmOptions>({});
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
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
