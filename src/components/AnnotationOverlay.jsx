import { useState, useRef } from 'react';
import useStore from '../store/useStore';

export default function AnnotationOverlay({ canvasWidth, canvasHeight }) {
  const [dragging, setDragging] = useState(false);
  const [draftRect, setDraftRect] = useState(null);
  const startPos = useRef(null);
  const wrapRef = useRef(null);

  const activeTool = useStore((state) => state.activeTool);
  const annotations = useStore((state) => state.annotations);
  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const setSelectedAnnotation = useStore((state) => state.setSelectedAnnotation);

  // Get annotations for current page
  const pageAnnotations = annotations.filter(
    (ann) => ann.source_id === activeSourceId && ann.page_number === currentPage
  );

  const handleMouseDown = (e) => {
    if (activeTool !== 'highlight') return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    startPos.current = { x, y };
    setDragging(true);
    setDraftRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !startPos.current) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newRect = {
      x: Math.min(startPos.current.x, x),
      y: Math.min(startPos.current.y, y),
      w: Math.abs(x - startPos.current.x),
      h: Math.abs(y - startPos.current.y),
    };

    setDraftRect(newRect);
  };

  const handleMouseUp = () => {
    if (!dragging || !draftRect) return;

    // Minimum size check (avoid tiny accidental highlights)
    if (draftRect.w < 0.01 || draftRect.h < 0.008) {
      setDragging(false);
      setDraftRect(null);
      startPos.current = null;
      return;
    }

    // Create annotation with this rectangle
    const annotation = {
      rect: draftRect,
      page: currentPage,
      sourceId: activeSourceId,
    };

    // Trigger modal to add note
    useStore.getState().openAnnotationModal(annotation);

    // Reset
    setDragging(false);
    setDraftRect(null);
    startPos.current = null;
  };

  const handleAnnotationClick = (ann) => {
    setSelectedAnnotation(ann.id);
    useStore.getState().openAnnotationModal(ann);
  };

  return (
    <div
      ref={wrapRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        cursor: activeTool === 'highlight' ? 'crosshair' : 'default',
        pointerEvents: activeTool !== 'select' ? 'auto' : 'none',
      }}
    >
      {/* Render existing annotations */}
      {pageAnnotations.map((ann) => (
        <div
          key={ann.id}
          onClick={() => handleAnnotationClick(ann)}
          style={{
            position: 'absolute',
            left: `${ann.rect_x * 100}%`,
            top: `${ann.rect_y * 100}%`,
            width: `${ann.rect_w * 100}%`,
            height: `${ann.rect_h * 100}%`,
            border: '1px solid rgba(212, 163, 115, 0.7)',
            background: 'rgba(212, 163, 115, 0.28)',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          title={ann.text || 'Highlight'}
        >
          {ann.text && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '100%',
                background: 'var(--panel-2)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                padding: '2px 6px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                maxWidth: '240px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 10,
              }}
            >
              {ann.text}
            </div>
          )}
        </div>
      ))}

      {/* Draft rectangle while dragging */}
      {dragging && draftRect && (
        <div
          style={{
            position: 'absolute',
            left: `${draftRect.x * 100}%`,
            top: `${draftRect.y * 100}%`,
            width: `${draftRect.w * 100}%`,
            height: `${draftRect.h * 100}%`,
            border: '1px dashed var(--accent-2)',
            background: 'rgba(196, 92, 74, 0.15)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
