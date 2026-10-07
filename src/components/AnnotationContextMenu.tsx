import { useRef, useEffect, type MouseEvent } from 'react';
import type { Annotation } from '../types/annotations';

interface AnnotationContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onEdit?: () => void;
  onClose: () => void;
  annotation: Annotation;
}

/**
 * AnnotationContextMenu - Right-click menu for annotations
 * Provides Edit and Delete actions
 */
export default function AnnotationContextMenu({
  x,
  y,
  onDelete,
  onEdit,
  onClose,
  annotation,
}: AnnotationContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit?.();
    onClose();
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        minWidth: '120px',
        padding: '4px',
      }}
    >
      {onEdit && (
        <button
          onClick={handleEdit}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text)',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          ✏️ Edit
        </button>
      )}
      <button
        onClick={handleDelete}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--accent)',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        🗑️ Delete
      </button>
    </div>
  );
}
