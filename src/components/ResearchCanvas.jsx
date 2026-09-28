import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';
import { Tldraw, useEditor, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import useStore from '../store/useStore';
import EntityPicker from './canvas/EntityPicker';
import { invoke } from '@tauri-apps/api/core';

// Dark theme override to match Arcanum
const ARCANUM_THEME = {
  '--color-background': 'var(--bg)',
  '--color-panel': 'var(--panel)',
  '--color-low': 'var(--panel-2)',
  '--color-muted': 'var(--text-muted)',
  '--color-text': 'var(--text)',
  '--color-primary': 'var(--accent-2)',
  '--color-selected': 'var(--accent-9)',
};

function CanvasInner({ canvasId, onShowEntityPicker }) {
  const editor = useEditor();
  const currentProject = useStore((state) => state.currentProject);
  const saveTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // Log for debugging
  useEffect(() => {
    logger.debug('CanvasInner mounted with canvasId:', canvasId);
  }, [canvasId]);

  // Add keyboard shortcut (Cmd/Ctrl + E) to open entity picker
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        onShowEntityPicker();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onShowEntityPicker]);

  // Handle entity added to canvas (via double-click or other methods)
  useEffect(() => {
    if (!editor) return;

    const handleEntityAdd = (event) => {
      const { entityId, entityType, entityName } = event.detail;

      // Add to center of viewport
      const viewportCenter = editor.getViewportPageBounds().center;

      // Create embed shape pointing to local HTTP server
      const embedId = createShapeId();
      editor.createShape({
        id: embedId,
        type: 'embed',
        x: viewportCenter.x - 200,
        y: viewportCenter.y - 150,
        props: {
          url: `http://localhost:3001/entity/${entityId}`,
          w: 400,
          h: 300,
        },
        meta: {
          entityId,
          entityType,
          entityName,
          isEntityCard: true,
        },
      });
    };

    window.addEventListener('addEntityToCanvas', handleEntityAdd);
    return () => window.removeEventListener('addEntityToCanvas', handleEntityAdd);
  }, [editor]);

  // Handle PDF excerpt added to canvas
  useEffect(() => {
    if (!editor) return;

    const handlePDFExcerptAdd = (event) => {
      const { text, sourceId, sourceTitle, pageNumber } = event.detail;

      // Add to center of viewport
      const viewportCenter = editor.getViewportPageBounds().center;

      // Create note shape for the excerpt
      const noteId = createShapeId();
      editor.createShape({
        id: noteId,
        type: 'note',
        x: viewportCenter.x - 150,
        y: viewportCenter.y - 100,
        props: {
          text,
          color: 'yellow',
          size: 'm',
        },
        meta: {
          isPDFExcerpt: true,
          sourceId,
          sourceTitle,
          pageNumber,
        },
      });
    };

    window.addEventListener('addPDFExcerptToCanvas', handlePDFExcerptAdd);
    return () => window.removeEventListener('addPDFExcerptToCanvas', handlePDFExcerptAdd);
  }, [editor]);

  // Load canvas data when component mounts
  useEffect(() => {
    if (!editor || !currentProject || !canvasId) {
      logger.debug('Load effect skipped:', {
        editor: !!editor,
        currentProject: !!currentProject,
        canvasId,
      });
      return;
    }

    const loadCanvas = async () => {
      try {
        logger.debug('Loading canvas data for:', canvasId);
        const canvas = await invoke('get_canvas', { canvasId });
        if (canvas && canvas.canvas_data) {
          const snapshot = JSON.parse(canvas.canvas_data);
          editor.loadSnapshot(snapshot);
          logger.debug('Canvas data loaded successfully');
        } else {
          logger.debug('No canvas data found, starting fresh');
        }
        hasLoadedRef.current = true;
      } catch (error) {
        logger.error('Failed to load canvas:', error);
      }
    };

    loadCanvas();
  }, [editor, currentProject, canvasId]);

  // Auto-save canvas data when it changes (debounced)
  useEffect(() => {
    if (!editor || !canvasId) {
      logger.debug('Auto-save effect skipped:', { editor: !!editor, canvasId });
      return;
    }

    logger.debug('Setting up auto-save for canvas:', canvasId);

    const saveCanvas = async () => {
      // Only save if we've loaded the canvas first
      if (!hasLoadedRef.current) {
        logger.debug('Skipping save - canvas not loaded yet');
        return;
      }

      try {
        const snapshot = editor.getSnapshot();
        const canvas_data = JSON.stringify(snapshot);

        logger.debug('Saving canvas data...');
        await invoke('update_canvas', {
          canvasId: canvasId,
          input: { canvas_data },
        });
        logger.debug('Canvas auto-saved successfully');
      } catch (error) {
        logger.error('Failed to save canvas:', error);
      }
    };

    const handleChange = () => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 1 second of inactivity
      saveTimeoutRef.current = setTimeout(saveCanvas, 1000);
    };

    // Listen to store changes
    const unsubscribe = editor.store.listen(handleChange);

    return () => {
      logger.debug('Cleaning up auto-save, saving immediately...');
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount to preserve changes
      saveCanvas();
    };
  }, [editor, canvasId]);

  return null;
}

export default function ResearchCanvas({ tab }) {
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const canvasId = tab.data?.canvasId || tab.canvasId;

  const handleShowEntityPicker = useCallback(() => {
    setShowEntityPicker(true);
  }, []);

  const handleCloseEntityPicker = useCallback(() => {
    setShowEntityPicker(false);
  }, []);

  const handleAddEntity = useCallback((entityData) => {
    // Dispatch event to add entity to canvas
    window.dispatchEvent(
      new CustomEvent('addEntityToCanvas', {
        detail: entityData,
      })
    );
  }, []);

  return (
    <div
      className="research-canvas"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {showEntityPicker && (
        <EntityPicker onSelect={handleAddEntity} onClose={handleCloseEntityPicker} />
      )}
      <style>
        {`
          .research-canvas .tl-container {
            ${Object.entries(ARCANUM_THEME)
              .map(([key, value]) => `${key}: ${value};`)
              .join('\n            ')}
          }

          /* Override Tldraw's light theme colors */
          .tl-theme__light {
            --color-background: var(--bg) !important;
            --color-panel: var(--panel) !important;
            --color-low: var(--panel-2) !important;
            --color-muted: var(--text-muted) !important;
            --color-text: var(--text) !important;
            --color-primary: var(--accent-2) !important;
            --color-selected: var(--accent-9) !important;
          }

          /* Match Arcanum's rounded corners and borders */
          .tlui-menu,
          .tlui-button,
          .tlui-popover__content,
          .tlui-toolbar,
          .tlui-style-panel {
            border-radius: 6px;
            border-color: var(--line) !important;
          }

          /* Ensure toolbar is visible */
          .tlui-toolbar {
            background: var(--panel-2) !important;
          }

          /* Floating add entity button */
          .add-entity-btn {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            color: white;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
            transition: all 0.2s;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .add-entity-btn:hover {
            transform: scale(1.15);
            box-shadow: 0 6px 24px rgba(102, 126, 234, 0.7);
            border-color: rgba(255, 255, 255, 0.5);
          }
        `}
      </style>

      <button
        className="add-entity-btn"
        onClick={handleShowEntityPicker}
        title="Add Entity (Cmd+E)"
      >
        +
      </button>

      <Tldraw key={canvasId} autoFocus>
        <CanvasInner canvasId={canvasId} onShowEntityPicker={handleShowEntityPicker} />
      </Tldraw>
    </div>
  );
}
