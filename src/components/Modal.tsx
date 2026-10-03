import { useEffect, ReactNode } from 'react';
import '../styles/modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

/**
 * Reusable modal wrapper component
 * Handles overlay, centering, escape key, and click-outside-to-close
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = '700px',
  closeOnEscape = true,
  closeOnOutsideClick = true,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOutsideClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
}

export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div className="modal-header">
      <h2>{children}</h2>
      {onClose && (
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className="modal-body">{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="modal-footer">{children}</div>;
}
