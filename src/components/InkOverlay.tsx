import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';
import * as fabric from 'fabric';
import useStore from '../store/useStore';
import { createAnnotation, deleteAnnotation } from '../lib/tauri';
import type { Annotation } from '../types/annotations';

interface InkOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  active: boolean;
}

export default function InkOverlay({ canvasWidth, canvasHeight, active }: InkOverlayProps) {
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLCanvasElement | null>(null);

  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const currentProject = useStore((state) => state.currentProject);
  const annotations = useStore((state) => state.annotations);
  const addAnnotation = useStore((state) => state.addAnnotation);

  // Load ink annotations - defined with useCallback to avoid recreating on every render
  const loadInkAnnotations = useCallback(
    (canvas: fabric.Canvas) => {
      // Clear existing objects
      canvas.clear();

      // Get ink annotations for current page
      const inkAnnotations = annotations.filter(
        (ann) =>
          ann.source_id === activeSourceId &&
          ann.page_number === currentPage &&
          ann.annotation_type === 'ink'
      );

      // Render each ink annotation
      inkAnnotations.forEach((ann) => {
        // Parse metadata to get ink_data
        const metadata = ann.metadata ? JSON.parse(ann.metadata) : null;
        if (metadata?.ink_data) {
          fabric.Path.fromObject(metadata.ink_data).then((path) => {
            path.selectable = false;
            path.evented = true;
            // Store ID for deletion
            (path as any).annotationId = ann.id;
            canvas.add(path);
            canvas.requestRenderAll();
          });
        }
      });
    },
    [annotations, activeSourceId, currentPage]
  );

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!containerRef.current || !active) return;

    // Create Fabric canvas
    const canvas = new fabric.Canvas(containerRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      isDrawingMode: true,
      selection: false,
    });

    // Configure brush (Fabric.js v6+ requires explicit brush creation)
    const brush = new fabric.PencilBrush(canvas);
    brush.color = '#d4a373';
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    fabricCanvasRef.current = canvas;

    // Handle drawing complete
    canvas.on('path:created', async (e) => {
      const path = e.path;

      if (!path) return;

      // Get bounding box in normalized coordinates
      const boundingRect = path.getBoundingRect();
      const rect = {
        x: boundingRect.left / canvasWidth,
        y: boundingRect.top / canvasHeight,
        w: boundingRect.width / canvasWidth,
        h: boundingRect.height / canvasHeight,
      };

      // Serialize path to JSON
      const pathJSON = path.toJSON();

      try {
        // Save to database
        const data = await createAnnotation({
          source_id: activeSourceId || '',
          project_id: currentProject?.id,
          page_number: currentPage,
          annotation_type: 'ink',
          rect: {
            x: rect.x,
            y: rect.y,
            w: rect.w,
            h: rect.h,
          },
          ink_data: pathJSON,
          text: undefined,
        });

        // Add to store
        addAnnotation(data as Annotation);

        // Clear the canvas (we'll render it from stored data)
        canvas.clear();
        loadInkAnnotations(canvas);
      } catch (err) {
        logger.error('Failed to save ink annotation:', err);
        alert('Failed to save drawing');
      }
    });

    // Load existing ink annotations for current page
    loadInkAnnotations(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [
    canvasWidth,
    canvasHeight,
    active,
    loadInkAnnotations,
    addAnnotation,
    currentPage,
    activeSourceId,
    currentProject?.id,
  ]);

  // Load ink annotations when page changes
  useEffect(() => {
    if (fabricCanvasRef.current && active) {
      loadInkAnnotations(fabricCanvasRef.current);
    }
  }, [currentPage, annotations, active, loadInkAnnotations]);

  // Handle right-click to delete
  useEffect(() => {
    if (!fabricCanvasRef.current || !active) return;

    const canvas = fabricCanvasRef.current;
    const canvasElement = canvas.upperCanvasEl;

    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault();

      // Find object at click position
      const target = canvas.findTarget(e as any);

      if (target && (target as any).annotationId) {
        if (!confirm('Delete this ink annotation?')) return;

        const annotationId = (target as any).annotationId;

        try {
          await deleteAnnotation(annotationId);

          // Remove from store
          const currentAnnotations = useStore.getState().annotations;
          useStore
            .getState()
            .setAnnotations(currentAnnotations.filter((a) => a.id !== annotationId));

          // Remove from canvas
          canvas.remove(target as any);
          canvas.renderAll();
        } catch (err) {
          logger.error('Failed to delete ink annotation:', err);
          alert('Failed to delete annotation');
        }
      }
    };

    canvasElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvasElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'auto',
        cursor: 'crosshair',
      }}
    >
      <canvas ref={containerRef} />
    </div>
  );
}
