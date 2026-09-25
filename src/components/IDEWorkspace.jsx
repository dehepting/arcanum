import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import './IDEWorkspace.css';

/**
 * IDEWorkspace - 3-panel resizable layout (VS Code style)
 * Left: Entity Explorer
 * Center: Main content area with tabs
 * Right: Entity details/properties
 */
export default function IDEWorkspace({ leftPanel, centerPanel, rightPanel = null }) {
  // Panel widths (stored in localStorage)
  const [leftWidth, setLeftWidth] = useState(() => {
    const stored = localStorage.getItem('ide-left-width');
    return stored ? parseInt(stored) : 300;
  });

  const [rightWidth, setRightWidth] = useState(() => {
    const stored = localStorage.getItem('ide-right-width');
    return stored ? parseInt(stored) : 350;
  });

  // Panel visibility
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Resize state
  const [resizing, setResizing] = useState(null); // 'left' | 'right' | null
  const containerRef = useRef(null);

  // Save widths to localStorage
  useEffect(() => {
    localStorage.setItem('ide-left-width', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('ide-right-width', rightWidth.toString());
  }, [rightWidth]);

  // Handle resize start
  const handleResizeStart = (panel) => {
    setResizing(panel);
  };

  // Handle resize
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (resizing === 'left') {
        const newWidth = e.clientX - containerRect.left;
        const clampedWidth = Math.max(200, Math.min(600, newWidth));
        setLeftWidth(clampedWidth);
      } else if (resizing === 'right') {
        const newWidth = containerRect.right - e.clientX;
        const clampedWidth = Math.max(200, Math.min(600, newWidth));
        setRightWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  // Keyboard shortcuts
  const openAdvancedSearch = useStore((state) => state.openAdvancedSearch);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+B or Ctrl+B - toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b' && !e.altKey) {
        e.preventDefault();
        setLeftCollapsed((prev) => !prev);
      }
      // Cmd+Alt+B or Ctrl+Alt+B - toggle right panel (if it exists)
      if (rightPanel && (e.metaKey || e.ctrlKey) && e.altKey && e.key === 'b') {
        e.preventDefault();
        setRightCollapsed((prev) => !prev);
      }
      // Cmd+K or Ctrl+K - open advanced search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openAdvancedSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rightPanel, openAdvancedSearch]);

  return (
    <div className="ide-workspace" ref={containerRef}>
      {/* Left Panel */}
      <div
        className={`ide-panel ide-left-panel ${leftCollapsed ? 'collapsed' : ''}`}
        style={{ width: leftCollapsed ? '0px' : `${leftWidth}px` }}
      >
        {!leftCollapsed && (
          <>
            <div className="ide-panel-header">
              <span className="ide-panel-title">EXPLORER</span>
              <button
                className="ide-panel-collapse"
                onClick={() => setLeftCollapsed(true)}
                title="Collapse (Cmd+B)"
              >
                ◀
              </button>
            </div>
            <div className="ide-panel-content">{leftPanel}</div>
          </>
        )}
      </div>

      {/* Left Resizer */}
      {!leftCollapsed && (
        <div
          className="ide-resizer ide-resizer-left"
          onMouseDown={() => handleResizeStart('left')}
        />
      )}

      {/* Collapsed Left Panel Indicator */}
      {leftCollapsed && (
        <div className="ide-collapsed-bar ide-collapsed-left">
          <button
            className="ide-expand-btn"
            onClick={() => setLeftCollapsed(false)}
            title="Show Explorer (Cmd+B)"
          >
            ▶
          </button>
        </div>
      )}

      {/* Center Panel */}
      <div className="ide-panel ide-center-panel">{centerPanel}</div>

      {/* Right Panel (optional) */}
      {rightPanel && (
        <>
          {/* Collapsed Right Panel Indicator */}
          {rightCollapsed && (
            <div className="ide-collapsed-bar ide-collapsed-right">
              <button
                className="ide-expand-btn"
                onClick={() => setRightCollapsed(false)}
                title="Show Details (Cmd+Alt+B)"
              >
                ◀
              </button>
            </div>
          )}

          {/* Right Resizer */}
          {!rightCollapsed && (
            <div
              className="ide-resizer ide-resizer-right"
              onMouseDown={() => handleResizeStart('right')}
            />
          )}

          {/* Right Panel */}
          <div
            className={`ide-panel ide-right-panel ${rightCollapsed ? 'collapsed' : ''}`}
            style={{ width: rightCollapsed ? '0px' : `${rightWidth}px` }}
          >
            {!rightCollapsed && (
              <>
                <div className="ide-panel-header">
                  <span className="ide-panel-title">DETAILS</span>
                  <button
                    className="ide-panel-collapse"
                    onClick={() => setRightCollapsed(true)}
                    title="Collapse (Cmd+Alt+B)"
                  >
                    ▶
                  </button>
                </div>
                <div className="ide-panel-content">{rightPanel}</div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
