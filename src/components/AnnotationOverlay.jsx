import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../lib/supabase';
import { getPlaceForAnnotation } from '../lib/places';

export default function AnnotationOverlay({ canvasWidth, canvasHeight }) {
  const [dragging, setDragging] = useState(false);
  const [draftRect, setDraftRect] = useState(null);
  const [linkedAnnotations, setLinkedAnnotations] = useState(new Set());
  const startPos = useRef(null);
  const wrapRef = useRef(null);

  const activeTool = useStore((state) => state.activeTool);
  const annotations = useStore((state) => state.annotations);
  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const setSelectedAnnotation = useStore((state) => state.setSelectedAnnotation);
  const setMapView = useStore((state) => state.setMapView);
  const places = useStore((state) => state.places);

  // Get annotations for current page
  const pageAnnotations = annotations.filter(
    (ann) => ann.source_id === activeSourceId && ann.page_number === currentPage
  );

  // Track which annotations are linked to places
  useEffect(() => {
    const linked = new Set();
    places.forEach((place) => {
      if (place.annotation_place_links) {
        place.annotation_place_links.forEach((link) => {
          linked.add(link.annotation_id);
        });
      }
    });
    setLinkedAnnotations(linked);
  }, [places]);

  const handleMouseDown = (e) => {
    // Text tool: click to place text box
    if (activeTool === 'text') {
      const rect = wrapRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Create a small text box at click location
      const textAnnotation = {
        rect: {
          x: x,
          y: y,
          w: 0.15, // Fixed width for text boxes
          h: 0.05, // Will expand based on content
        },
        page: currentPage,
        sourceId: activeSourceId,
        type: 'text',
      };

      // Open modal to add text
      useStore.getState().openAnnotationModal(textAnnotation);
      return;
    }

    // Highlight tool: drag to create rectangle
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

  const handleMouseUp = async () => {
    if (!dragging || !draftRect) return;

    // Minimum size check (avoid tiny accidental highlights)
    if (draftRect.w < 0.01 || draftRect.h < 0.008) {
      setDragging(false);
      setDraftRect(null);
      startPos.current = null;
      return;
    }

    // Save highlight directly (no modal for highlights)
    try {
      const { data, error } = await supabase
        .from('annotations')
        .insert([
          {
            source_id: activeSourceId,
            page_number: currentPage,
            type: 'highlight',
            rect_x: draftRect.x,
            rect_y: draftRect.y,
            rect_w: draftRect.w,
            rect_h: draftRect.h,
            text: null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      useStore.getState().addAnnotation(data);
    } catch (err) {
      console.error('Failed to save highlight:', err);
    }

    // Reset
    setDragging(false);
    setDraftRect(null);
    startPos.current = null;
  };

  const handleAnnotationClick = async (ann, e) => {
    e.stopPropagation();

    // If linked to a place, navigate to it on the map
    if (linkedAnnotations.has(ann.id)) {
      try {
        const place = await getPlaceForAnnotation(ann.id);
        if (place) {
          // Switch to map view
          setMapView('map');
          // Store the place to fly to (MapView will pick this up)
          useStore.getState().flyToPlace = place;
        }
      } catch (err) {
        console.error('Failed to navigate to place:', err);
      }
    }

    // Text annotations also open modal on click
    if (ann.type === 'text') {
      setSelectedAnnotation(ann.id);
      useStore.getState().openAnnotationModal(ann);
    }
  };

  const handleAnnotationRightClick = async (ann, e) => {
    e.preventDefault();
    if (!confirm('Delete this annotation?')) return;

    try {
      const { error } = await supabase.from('annotations').delete().eq('id', ann.id);

      if (error) throw error;

      // Remove from store
      const currentAnnotations = useStore.getState().annotations;
      useStore.getState().setAnnotations(currentAnnotations.filter((a) => a.id !== ann.id));
    } catch (err) {
      console.error('Failed to delete annotation:', err);
      alert('Failed to delete annotation');
    }
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
        cursor:
          activeTool === 'highlight' ? 'crosshair' : activeTool === 'text' ? 'text' : 'default',
        pointerEvents: 'auto',
      }}
    >
      {/* Render existing annotations */}
      {pageAnnotations.map((ann) => {
        const isLinked = linkedAnnotations.has(ann.id);
        return (
          <div
            key={ann.id}
            onClick={(e) => handleAnnotationClick(ann, e)}
            onContextMenu={(e) => handleAnnotationRightClick(ann, e)}
            style={{
              position: 'absolute',
              left: `${ann.rect_x * 100}%`,
              top: `${ann.rect_y * 100}%`,
              width: `${ann.rect_w * 100}%`,
              height: `${ann.rect_h * 100}%`,
              border: isLinked
                ? '2px solid var(--accent)'
                : ann.type === 'text'
                  ? '1px solid var(--accent)'
                  : '1px solid rgba(212, 163, 115, 0.7)',
              background: ann.type === 'text' ? 'var(--panel-2)' : 'rgba(212, 163, 115, 0.28)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              padding: ann.type === 'text' ? '4px 6px' : '0',
              fontSize: ann.type === 'text' ? '11px' : 'inherit',
              color: ann.type === 'text' ? 'var(--text)' : 'inherit',
              whiteSpace: ann.type === 'text' ? 'pre-wrap' : 'normal',
              overflow: ann.type === 'text' ? 'auto' : 'hidden',
              boxShadow: isLinked ? '0 0 0 1px var(--accent)' : 'none',
            }}
            title={
              isLinked
                ? 'Click to view on map · Right-click to delete'
                : ann.type === 'highlight'
                  ? 'Right-click to delete'
                  : 'Click to edit'
            }
          >
            {ann.type === 'text' && ann.text}
            {isLinked && (
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-8px',
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  border: '2px solid var(--bg)',
                }}
              >
                📍
              </div>
            )}
          </div>
        );
      })}

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
