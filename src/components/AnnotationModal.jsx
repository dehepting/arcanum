import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function AnnotationModal() {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const modalOpen = useStore((state) => state.annotationModalOpen);
  const pendingAnnotation = useStore((state) => state.pendingAnnotation);
  const closeModal = useStore((state) => state.closeAnnotationModal);
  const addAnnotation = useStore((state) => state.addAnnotation);
  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);

  useEffect(() => {
    if (modalOpen && pendingAnnotation) {
      // If editing existing annotation
      if (pendingAnnotation.id) {
        setNoteText(pendingAnnotation.text || '');
      } else {
        // New annotation
        setNoteText('');
      }
    }
  }, [modalOpen, pendingAnnotation]);

  const handleSave = async () => {
    if (!pendingAnnotation) return;

    setSaving(true);
    try {
      const annotationData = {
        source_id: activeSourceId,
        page_number: currentPage,
        type: 'highlight',
        rect_x: pendingAnnotation.rect.x,
        rect_y: pendingAnnotation.rect.y,
        rect_w: pendingAnnotation.rect.w,
        rect_h: pendingAnnotation.rect.h,
        text: noteText.trim(),
      };

      const { data, error } = await supabase
        .from('annotations')
        .insert([annotationData])
        .select()
        .single();

      if (error) throw error;

      addAnnotation(data);
      handleClose();
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert(`Failed to save annotation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNoteText('');
    closeModal();
  };

  if (!modalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 92vw)',
          background: 'var(--panel-2)',
          border: '1px solid var(--line)',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ margin: '0 0 10px', fontSize: '16px', fontFamily: 'IBM Plex Serif, serif' }}>
          Add Note
        </h2>

        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
          Note (optional)
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="What does this passage mean?"
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            padding: '8px',
            borderRadius: '4px',
            margin: '6px 0 10px',
            font: 'inherit',
            minHeight: '80px',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--panel)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--accent)',
              border: 'var(--accent)',
              color: '#fff',
              padding: '6px 12px',
              cursor: saving ? 'wait' : 'pointer',
              borderRadius: '4px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
