import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { getPlaceForAnnotation } from '../lib/places';
import { getArtifactsForAnnotation } from '../lib/artifact-sources';
import ArtifactBadge from './ArtifactBadge';

export default function AnnotationOverlay({ canvasWidth, canvasHeight }) {
  const [dragging, setDragging] = useState(false);
  const [draftRect, setDraftRect] = useState(null);
  const [linkedAnnotations, setLinkedAnnotations] = useState(new Set());
  const [artifactLinks, setArtifactLinks] = useState(new Map());
  const [draggedAnnotation, setDraggedAnnotation] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);
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

  // Load artifact links for current page annotations
  useEffect(() => {
    const loadArtifactLinks = async () => {
      const links = new Map();
      for (const ann of pageAnnotations) {
        const result = await getArtifactsForAnnotation(ann.id);
        if (result.success && result.data.length > 0) {
          // Store first artifact for badge display
          links.set(ann.id, result.data[0].artifacts);
        }
      }
      setArtifactLinks(links);
    };

    if (pageAnnotations.length > 0) {
      loadArtifactLinks();
    }
  }, [pageAnnotations.length, activeSourceId, currentPage]);

  const handleMouseDown = (e) => {
    // Select tool: don't create new annotations
    if (activeTool === 'select') return;

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
    // Handle annotation dragging in select mode
    if (draggedAnnotation && dragOffset) {
      const rect = wrapRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Update annotation position (clamped to canvas bounds)
      const newX = Math.max(0, Math.min(1 - draggedAnnotation.rect_w, x - dragOffset.x));
      const newY = Math.max(0, Math.min(1 - draggedAnnotation.rect_h, y - dragOffset.y));

      // Update in-memory annotation
      setDraggedAnnotation({
        ...draggedAnnotation,
        rect_x: newX,
        rect_y: newY,
      });
      return;
    }

    // Handle highlight creation
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
    // Handle annotation drag end
    if (draggedAnnotation) {
      try {
        const { error } = await supabase
          .from('annotations')
          .update({
            rect_x: draggedAnnotation.rect_x,
            rect_y: draggedAnnotation.rect_y,
          })
          .eq('id', draggedAnnotation.id);

        if (error) throw error;

        // Update in store
        const currentAnnotations = useStore.getState().annotations;
        useStore
          .getState()
          .setAnnotations(
            currentAnnotations.map((a) => (a.id === draggedAnnotation.id ? draggedAnnotation : a))
          );
      } catch (err) {
        console.error('Failed to update annotation position:', err);
      }

      setDraggedAnnotation(null);
      setDragOffset(null);
      return;
    }

    // Handle highlight creation end
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

  const handleAnnotationMouseDown = (ann, e) => {
    e.stopPropagation();

    // Only handle dragging in select mode
    if (activeTool !== 'select') return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Calculate offset from annotation's top-left corner
    const offsetX = x - ann.rect_x;
    const offsetY = y - ann.rect_y;

    setDraggedAnnotation(ann);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleAnnotationClick = async (ann, e) => {
    e.stopPropagation();

    // Don't navigate if we just dragged
    if (draggedAnnotation) return;

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

    // Text annotations also open modal on click (only if not dragging)
    if (ann.type === 'text' && activeTool !== 'select') {
      setSelectedAnnotation(ann.id);
      useStore.getState().openAnnotationModal(ann);
    }
  };

  const handleArtifactBadgeClick = (artifact) => {
    // Navigate to artifact detail view
    useStore.getState().setSelectedArtifact(artifact);
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
          activeTool === 'select'
            ? draggedAnnotation
              ? 'grabbing'
              : 'default'
            : activeTool === 'highlight'
              ? 'crosshair'
              : activeTool === 'text'
                ? 'text'
                : 'default',
        pointerEvents: 'auto',
      }}
    >
      {/* Render existing annotations */}
      {pageAnnotations.map((ann) => {
        const isLinked = linkedAnnotations.has(ann.id);
        const linkedArtifact = artifactLinks.get(ann.id);
        const hasArtifactLink = !!linkedArtifact;
        const isDragging = draggedAnnotation?.id === ann.id;
        const displayAnn = isDragging ? draggedAnnotation : ann;

        return (
          <div
            key={ann.id}
            onMouseDown={(e) => handleAnnotationMouseDown(ann, e)}
            onClick={(e) => handleAnnotationClick(ann, e)}
            onContextMenu={(e) => handleAnnotationRightClick(ann, e)}
            style={{
              position: 'absolute',
              left: `${displayAnn.rect_x * 100}%`,
              top: `${displayAnn.rect_y * 100}%`,
              width: `${displayAnn.rect_w * 100}%`,
              height: `${displayAnn.rect_h * 100}%`,
              border: isLinked
                ? '2px solid var(--accent)'
                : hasArtifactLink
                  ? '2px solid #667eea'
                  : ann.type === 'text'
                    ? '1px solid var(--accent)'
                    : '1px solid rgba(212, 163, 115, 0.7)',
              background: ann.type === 'text' ? 'var(--panel-2)' : 'rgba(212, 163, 115, 0.28)',
              cursor: activeTool === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              pointerEvents: 'auto',
              padding: ann.type === 'text' ? '4px 6px' : '0',
              fontSize: ann.type === 'text' ? '11px' : 'inherit',
              color: ann.type === 'text' ? 'var(--text)' : 'inherit',
              whiteSpace: ann.type === 'text' ? 'pre-wrap' : 'normal',
              overflow: ann.type === 'text' ? 'auto' : 'hidden',
              boxShadow: isLinked || hasArtifactLink ? '0 0 0 1px currentColor' : 'none',
              opacity: isDragging ? 0.7 : 1,
            }}
            title={
              activeTool === 'select'
                ? 'Drag to move · Right-click to delete'
                : isLinked
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
                  pointerEvents: 'none',
                }}
              >
                📍
              </div>
            )}
            {hasArtifactLink && (
              <ArtifactBadge artifact={linkedArtifact} onClick={handleArtifactBadgeClick} />
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
