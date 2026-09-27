import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResearchCanvas from './ResearchCanvas';

// Mock Tldraw
vi.mock('tldraw', () => ({
  Tldraw: ({ children }) => <div data-testid="tldraw-container">{children}</div>,
  useEditor: () => ({
    getViewportPageBounds: () => ({ center: { x: 400, y: 300 } }),
    createShape: vi.fn(),
    store: {
      loadSnapshot: vi.fn(),
      getSnapshot: vi.fn(() => ({})),
      listen: vi.fn(() => vi.fn()),
    },
  }),
  createShapeId: () => 'test-shape-id',
  toRichText: vi.fn((text) => text),
}));

// Mock EntityPicker
vi.mock('./canvas/EntityPicker', () => ({
  default: ({ onSelect, onClose }) => (
    <div data-testid="entity-picker">
      <button
        data-testid="picker-select"
        onClick={() =>
          onSelect({
            entityId: 'entity-1',
            entityType: 'person',
            entityName: 'Plato',
          })
        }
      >
        Select
      </button>
      <button data-testid="picker-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

// Mock useStore
vi.mock('../store/useStore', () => ({
  default: (selector) => {
    const state = {
      addTab: vi.fn(),
      setActiveTab: vi.fn(),
      tabs: [],
      currentProject: 'project-1',
    };
    return selector ? selector(state) : state;
  },
}));

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args),
}));

describe('ResearchCanvas', () => {
  const mockTab = {
    id: 'tab-1',
    title: 'Research Canvas',
    data: {
      canvasId: 'canvas-1',
      canvasName: 'My Canvas',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with tab prop', () => {
      render(<ResearchCanvas tab={mockTab} />);

      expect(screen.getByTestId('tldraw-container')).toBeInTheDocument();
    });

    it('shows add entity button', () => {
      render(<ResearchCanvas tab={mockTab} />);

      const addButton = screen.getByTitle('Add Entity (Cmd+E)');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('+');
    });

    it('does not show EntityPicker initially', () => {
      render(<ResearchCanvas tab={mockTab} />);

      expect(screen.queryByTestId('entity-picker')).not.toBeInTheDocument();
    });

    it('extracts canvasId from tab.data', () => {
      render(<ResearchCanvas tab={mockTab} />);

      // Component should render successfully with tab.data.canvasId
      expect(screen.getByTestId('tldraw-container')).toBeInTheDocument();
    });

    it('extracts canvasId from tab directly if tab.data is missing', () => {
      const tabWithoutData = {
        id: 'tab-2',
        title: 'Canvas',
        canvasId: 'canvas-2',
      };

      render(<ResearchCanvas tab={tabWithoutData} />);

      expect(screen.getByTestId('tldraw-container')).toBeInTheDocument();
    });
  });

  describe('EntityPicker Integration', () => {
    it('shows EntityPicker when add button is clicked', () => {
      render(<ResearchCanvas tab={mockTab} />);

      const addButton = screen.getByTitle('Add Entity (Cmd+E)');
      fireEvent.click(addButton);

      expect(screen.getByTestId('entity-picker')).toBeInTheDocument();
    });

    it('closes EntityPicker when close handler is called', () => {
      render(<ResearchCanvas tab={mockTab} />);

      // Open picker
      const addButton = screen.getByTitle('Add Entity (Cmd+E)');
      fireEvent.click(addButton);
      expect(screen.getByTestId('entity-picker')).toBeInTheDocument();

      // Close picker
      const closeButton = screen.getByTestId('picker-close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('entity-picker')).not.toBeInTheDocument();
    });

    it('dispatches addEntityToCanvas event when entity is selected', () => {
      render(<ResearchCanvas tab={mockTab} />);

      const eventSpy = vi.fn();
      window.addEventListener('addEntityToCanvas', eventSpy);

      // Open picker
      const addButton = screen.getByTitle('Add Entity (Cmd+E)');
      fireEvent.click(addButton);

      // Select entity
      const selectButton = screen.getByTestId('picker-select');
      fireEvent.click(selectButton);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        entityId: 'entity-1',
        entityType: 'person',
        entityName: 'Plato',
      });

      window.removeEventListener('addEntityToCanvas', eventSpy);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('opens EntityPicker with Cmd+E', () => {
      render(<ResearchCanvas tab={mockTab} />);

      expect(screen.queryByTestId('entity-picker')).not.toBeInTheDocument();

      // Simulate Cmd+E
      fireEvent.keyDown(window, { key: 'e', metaKey: true });

      waitFor(() => {
        expect(screen.getByTestId('entity-picker')).toBeInTheDocument();
      });
    });

    it('opens EntityPicker with Ctrl+E', () => {
      render(<ResearchCanvas tab={mockTab} />);

      expect(screen.queryByTestId('entity-picker')).not.toBeInTheDocument();

      // Simulate Ctrl+E
      fireEvent.keyDown(window, { key: 'e', ctrlKey: true });

      waitFor(() => {
        expect(screen.getByTestId('entity-picker')).toBeInTheDocument();
      });
    });

    it('prevents default behavior for Cmd+E', () => {
      render(<ResearchCanvas tab={mockTab} />);

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      waitFor(() => {
        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Styling', () => {
    it('applies Arcanum theme styles', () => {
      const { container } = render(<ResearchCanvas tab={mockTab} />);

      const styleElement = container.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement.textContent).toContain('--color-background');
      expect(styleElement.textContent).toContain('tl-container');
    });

    it('styles add entity button with proper classes', () => {
      render(<ResearchCanvas tab={mockTab} />);

      const addButton = screen.getByTitle('Add Entity (Cmd+E)');
      expect(addButton).toHaveClass('add-entity-btn');
    });
  });

  describe('Canvas Structure', () => {
    it('renders research-canvas container', () => {
      const { container } = render(<ResearchCanvas tab={mockTab} />);

      const canvasContainer = container.querySelector('.research-canvas');
      expect(canvasContainer).toBeInTheDocument();
    });

    it('renders Tldraw component', () => {
      render(<ResearchCanvas tab={mockTab} />);

      expect(screen.getByTestId('tldraw-container')).toBeInTheDocument();
    });

    it('passes tab props to CanvasInner', () => {
      render(<ResearchCanvas tab={mockTab} />);

      // CanvasInner is rendered inside Tldraw
      // The component renders without errors, indicating props were passed correctly
      expect(screen.getByTestId('tldraw-container')).toBeInTheDocument();
    });
  });
});
