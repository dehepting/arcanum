import { useEffect } from 'react';
import '../styles/modal.css';

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
}) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
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

export function ModalHeader({ children, onClose }) {
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

export function ModalBody({ children }) {
  return <div className="modal-body">{children}</div>;
}

export function ModalFooter({ children }) {
  return <div className="modal-footer">{children}</div>;
}
