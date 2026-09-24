import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../../store/useStore';

export default function CanvasSelector({ currentCanvasId, onCanvasChange }) {
  const [canvases, setCanvases] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [showNewCanvas, setShowNewCanvas] = useState(false);
  const currentProject = useStore((state) => state.currentProject);

  // Load canvases for current project
  useEffect(() => {
    if (!currentProject) return;

    const loadCanvases = async () => {
      try {
        const projectCanvases = await invoke('list_canvases', {
          projectId: currentProject.id,
        });
        setCanvases(projectCanvases);

        // If no canvas is selected and canvases exist, select the first one
        if (!currentCanvasId && projectCanvases.length > 0) {
          const firstCanvas = projectCanvases[0];
          onCanvasChange(firstCanvas.id, firstCanvas.name);
        }
        // If no canvases exist at all, create a default one
        else if (!currentCanvasId && projectCanvases.length === 0) {
          const defaultCanvas = await invoke('create_canvas', {
            input: {
              project_id: currentProject.id,
              name: 'Research Canvas',
              is_dashboard: false,
            },
          });
          setCanvases([defaultCanvas]);
          onCanvasChange(defaultCanvas.id, defaultCanvas.name);
        }
      } catch (error) {
        console.error('Failed to load canvases:', error);
      }
    };

    loadCanvases();
  }, [currentProject]); // Remove currentCanvasId from deps to avoid infinite loop

  const createNewCanvas = async () => {
    if (!newCanvasName.trim() || !currentProject) return;

    try {
      const newCanvas = await invoke('create_canvas', {
        input: {
          project_id: currentProject.id,
          name: newCanvasName.trim(),
          is_dashboard: false,
        },
      });

      setCanvases([...canvases, newCanvas]);
      setNewCanvasName('');
      setShowNewCanvas(false);
      onCanvasChange(newCanvas.id, newCanvas.name);
    } catch (error) {
      console.error('Failed to create canvas:', error);
    }
  };

  const currentCanvas = canvases.find((c) => c.id === currentCanvasId);

  return (
    <div className="canvas-selector">
      <button className="canvas-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="canvas-icon">📋</span>
        <span className="canvas-name">{currentCanvas?.name || 'Select Canvas'}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="canvas-dropdown">
          <div className="canvas-list">
            {canvases.map((canvas) => (
              <button
                key={canvas.id}
                className={`canvas-item ${canvas.id === currentCanvasId ? 'active' : ''}`}
                onClick={() => {
                  onCanvasChange(canvas.id, canvas.name);
                  setIsOpen(false);
                }}
              >
                {canvas.is_dashboard && <span className="dashboard-badge">⭐</span>}
                {canvas.name}
              </button>
            ))}
          </div>

          <div className="canvas-actions">
            {showNewCanvas ? (
              <div className="new-canvas-form">
                <input
                  type="text"
                  placeholder="Canvas name..."
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createNewCanvas();
                    if (e.key === 'Escape') {
                      setShowNewCanvas(false);
                      setNewCanvasName('');
                    }
                  }}
                  autoFocus
                />
                <button onClick={createNewCanvas} className="btn-primary-sm">
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewCanvas(false);
                    setNewCanvasName('');
                  }}
                  className="btn-secondary-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button className="new-canvas-btn" onClick={() => setShowNewCanvas(true)}>
                + New Canvas
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .canvas-selector {
          position: relative;
          margin-bottom: 16px;
        }

        .canvas-selector-trigger {
          width: 100%;
          padding: 12px 16px;
          background: var(--panel-2);
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .canvas-selector-trigger:hover {
          background: var(--panel);
          border-color: var(--accent);
        }

        .canvas-icon {
          font-size: 16px;
        }

        .canvas-name {
          flex: 1;
          text-align: left;
        }

        .dropdown-arrow {
          font-size: 10px;
          color: var(--text-muted);
        }

        .canvas-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .canvas-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .canvas-item {
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .canvas-item:hover {
          background: var(--panel-2);
        }

        .canvas-item.active {
          background: var(--accent);
          color: white;
        }

        .dashboard-badge {
          font-size: 12px;
        }

        .canvas-actions {
          border-top: 1px solid var(--line);
          padding: 8px;
        }

        .new-canvas-form {
          display: flex;
          gap: 4px;
        }

        .new-canvas-form input {
          flex: 1;
          padding: 6px 8px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 4px;
          color: var(--text);
          font-size: 13px;
        }

        .new-canvas-form input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .btn-primary-sm,
        .btn-secondary-sm {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          border: none;
        }

        .btn-primary-sm {
          background: var(--accent);
          color: white;
        }

        .btn-secondary-sm {
          background: var(--panel-2);
          color: var(--text);
        }

        .new-canvas-btn {
          width: 100%;
          padding: 8px;
          background: var(--panel-2);
          border: 1px dashed var(--line);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .new-canvas-btn:hover {
          background: var(--panel);
          color: var(--text);
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
