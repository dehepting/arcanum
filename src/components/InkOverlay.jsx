import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import useStore from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function InkOverlay({ canvasWidth, canvasHeight, active }) {
  const fabricCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const annotations = useStore((state) => state.annotations);
  const addAnnotation = useStore((state) => state.addAnnotation);

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

    // Configure brush
    canvas.freeDrawingBrush.color = '#d4a373';
    canvas.freeDrawingBrush.width = 2;

    fabricCanvasRef.current = canvas;

    // Handle drawing complete
    canvas.on('path:created', async (e) => {
      const path = e.path;

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
        const { data, error } = await supabase
          .from('annotations')
          .insert([
            {
              source_id: activeSourceId,
              page_number: currentPage,
              type: 'ink',
              rect_x: rect.x,
              rect_y: rect.y,
              rect_w: rect.w,
              rect_h: rect.h,
              ink_data: pathJSON,
              text: null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Add to store
        addAnnotation(data);

        // Clear the canvas (we'll render it from stored data)
        canvas.clear();
        loadInkAnnotations(canvas);
      } catch (err) {
        console.error('Failed to save ink annotation:', err);
        alert('Failed to save drawing');
      }
    });

    // Load existing ink annotations for current page
    loadInkAnnotations(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [canvasWidth, canvasHeight, active]);

  // Load ink annotations when page changes
  useEffect(() => {
    if (fabricCanvasRef.current && active) {
      loadInkAnnotations(fabricCanvasRef.current);
    }
  }, [currentPage, annotations, active]);

  const loadInkAnnotations = (canvas) => {
    // Clear existing objects
    canvas.clear();

    // Get ink annotations for current page
    const inkAnnotations = annotations.filter(
      (ann) =>
        ann.source_id === activeSourceId && ann.page_number === currentPage && ann.type === 'ink'
    );

    // Render each ink annotation
    inkAnnotations.forEach((ann) => {
      if (ann.ink_data) {
        fabric.Path.fromObject(ann.ink_data, (path) => {
          path.selectable = false;
          path.evented = true;
          path.annotationId = ann.id; // Store ID for deletion
          canvas.add(path);
        });
      }
    });
  };

  // Handle right-click to delete
  useEffect(() => {
    if (!fabricCanvasRef.current || !active) return;

    const canvas = fabricCanvasRef.current;
    const canvasElement = canvas.upperCanvasEl;

    const handleContextMenu = async (e) => {
      e.preventDefault();

      // Find object at click position
      const pointer = canvas.getPointer(e);
      const target = canvas.findTarget(e);

      if (target && target.annotationId) {
        if (!confirm('Delete this ink annotation?')) return;

        try {
          const { error } = await supabase
            .from('annotations')
            .delete()
            .eq('id', target.annotationId);

          if (error) throw error;

          // Remove from store
          const currentAnnotations = useStore.getState().annotations;
          useStore
            .getState()
            .setAnnotations(currentAnnotations.filter((a) => a.id !== target.annotationId));

          // Remove from canvas
          canvas.remove(target);
          canvas.renderAll();
        } catch (err) {
          console.error('Failed to delete ink annotation:', err);
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
