import { useEffect, useRef } from 'react';

export default function AnnotationContextMenu({ x, y, onDelete, onEdit, onClose, annotation }) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 10000,
        minWidth: '160px',
        padding: '4px',
      }}
    >
      {annotation.type === 'text' && onEdit && (
        <button
          className="context-menu-item"
          onClick={() => {
            onEdit();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: '13px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✏️</span>
          <span>Edit Note</span>
        </button>
      )}

      <button
        className="context-menu-item"
        onClick={() => {
          onDelete();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--accent-warning)',
          fontSize: '13px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  );
}
