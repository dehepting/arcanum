import './ConfirmDialog.css';

/**
 * ConfirmDialog - Reusable confirmation dialog for destructive actions
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {Function} props.onClose - Called when dialog is closed/cancelled
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmText - Confirm button text (default: "Confirm")
 * @param {string} props.cancelText - Cancel button text (default: "Cancel")
 * @param {string} props.variant - Button variant: "danger" | "warning" | "primary"
 *
 * @example
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={() => {
 *     deleteEntity();
 *     setShowConfirm(false);
 *   }}
 *   title="Delete Entity"
 *   message="Are you sure you want to delete this entity? This cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 * />
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="confirm-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <h3>{title}</h3>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
        </div>

        <div className="confirm-footer">
          <button className="confirm-button confirm-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`confirm-button confirm-${variant}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
