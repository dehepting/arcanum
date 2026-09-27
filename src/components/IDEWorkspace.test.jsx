import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IDEWorkspace from './IDEWorkspace';
import useStore from '../store/useStore';

// Mock useStore
vi.mock('../store/useStore');

describe('IDEWorkspace', () => {
  const mockLeftPanel = <div data-testid="left-panel-content">Left Panel</div>;
  const mockCenterPanel = <div data-testid="center-panel-content">Center Panel</div>;
  const mockRightPanel = <div data-testid="right-panel-content">Right Panel</div>;
  const mockOpenAdvancedSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useStore
    useStore.mockImplementation((selector) => {
      const state = {
        openAdvancedSearch: mockOpenAdvancedSearch,
      };
      return selector ? selector(state) : state;
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  it('renders with left and center panels', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    expect(screen.getByTestId('left-panel-content')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel-content')).toBeInTheDocument();
  });

  it('renders with all three panels when rightPanel is provided', () => {
    render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    expect(screen.getByTestId('left-panel-content')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel-content')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel-content')).toBeInTheDocument();
  });

  it('does not render right panel when not provided', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    expect(screen.queryByTestId('right-panel-content')).not.toBeInTheDocument();
  });

  it('renders left panel header with title', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    expect(screen.getByText('EXPLORER')).toBeInTheDocument();
  });

  it('renders collapse button for left panel', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    expect(collapseButton).toBeInTheDocument();
  });

  it('collapses left panel when collapse button is clicked', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    fireEvent.click(collapseButton);

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveClass('collapsed');
  });

  it('shows expand button when left panel is collapsed', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    fireEvent.click(collapseButton);

    const expandButton = screen.getByTitle(/Show Explorer \(Cmd\+B\)/);
    expect(expandButton).toBeInTheDocument();
  });

  it('expands left panel when expand button is clicked', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Collapse first
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    fireEvent.click(collapseButton);

    // Then expand
    const expandButton = screen.getByTitle(/Show Explorer \(Cmd\+B\)/);
    fireEvent.click(expandButton);

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).not.toHaveClass('collapsed');
  });

  it('renders right panel header when right panel is provided', () => {
    render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    expect(screen.getByText('DETAILS')).toBeInTheDocument();
  });

  it('collapses right panel when collapse button is clicked', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Find the right panel collapse button using title
    const rightCollapseButton = screen.getByTitle(/Collapse \(Cmd\+Alt\+B\)/);
    fireEvent.click(rightCollapseButton);

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveClass('collapsed');
  });

  it('loads panel widths from localStorage', () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'ide-left-width') return '250';
        if (key === 'ide-right-width') return '400';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveStyle({ width: '250px' });

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveStyle({ width: '400px' });
  });

  it('saves panel widths to localStorage when changed', () => {
    render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // The component saves to localStorage in useEffect
    expect(global.localStorage.setItem).toHaveBeenCalled();
  });

  it('uses default widths when localStorage is empty', () => {
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveStyle({ width: '300px' });

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveStyle({ width: '350px' });
  });

  it('renders resizer for left panel', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    const resizer = container.querySelector('.ide-resizer-left');
    expect(resizer).toBeInTheDocument();
  });

  it('renders resizer for right panel when provided', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    const resizer = container.querySelector('.ide-resizer-right');
    expect(resizer).toBeInTheDocument();
  });

  it('hides left resizer when panel is collapsed', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Collapse left panel
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    fireEvent.click(collapseButton);

    const resizer = container.querySelector('.ide-resizer-left');
    expect(resizer).not.toBeInTheDocument();
  });

  it('toggles left panel with Cmd+B keyboard shortcut', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Simulate Cmd+B
    fireEvent.keyDown(document, { key: 'b', metaKey: true });

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveClass('collapsed');

    // Toggle again
    fireEvent.keyDown(document, { key: 'b', metaKey: true });
    expect(leftPanel).not.toHaveClass('collapsed');
  });

  it('toggles right panel with Cmd+Alt+B keyboard shortcut when right panel exists', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Simulate Cmd+Alt+B
    fireEvent.keyDown(document, { key: 'b', metaKey: true, altKey: true });

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveClass('collapsed');
  });

  it('does not respond to Cmd+Alt+B when right panel is not provided', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Simulate Cmd+Alt+B - should not throw error
    expect(() => {
      fireEvent.keyDown(document, { key: 'b', metaKey: true, altKey: true });
    }).not.toThrow();
  });

  it('prevents default behavior for keyboard shortcuts', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('expands right panel when expand button is clicked', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Collapse right panel first
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+Alt\+B\)/);
    fireEvent.click(collapseButton);

    // Then expand
    const expandButton = screen.getByTitle(/Show Details \(Cmd\+Alt\+B\)/);
    fireEvent.click(expandButton);

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).not.toHaveClass('collapsed');
  });

  it('toggles left panel with Ctrl+B keyboard shortcut', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Simulate Ctrl+B
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveClass('collapsed');

    // Toggle again
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(leftPanel).not.toHaveClass('collapsed');
  });

  it('toggles right panel with Ctrl+Alt+B keyboard shortcut', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Simulate Ctrl+Alt+B
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true, altKey: true });

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveClass('collapsed');
  });

  it('opens advanced search with Cmd+K keyboard shortcut', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(mockOpenAdvancedSearch).toHaveBeenCalledTimes(1);
  });

  it('opens advanced search with Ctrl+K keyboard shortcut', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    // Simulate Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(mockOpenAdvancedSearch).toHaveBeenCalledTimes(1);
  });

  it('prevents default behavior for Cmd+K shortcut', () => {
    render(<IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('sets left panel width to 0px when collapsed', () => {
    const { container } = render(
      <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
    );

    // Collapse left panel
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+B\)/);
    fireEvent.click(collapseButton);

    const leftPanel = container.querySelector('.ide-left-panel');
    expect(leftPanel).toHaveStyle({ width: '0px' });
  });

  it('sets right panel width to 0px when collapsed', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Collapse right panel
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+Alt\+B\)/);
    fireEvent.click(collapseButton);

    const rightPanel = container.querySelector('.ide-right-panel');
    expect(rightPanel).toHaveStyle({ width: '0px' });
  });

  it('hides right resizer when right panel is collapsed', () => {
    const { container } = render(
      <IDEWorkspace
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Collapse right panel
    const collapseButton = screen.getByTitle(/Collapse \(Cmd\+Alt\+B\)/);
    fireEvent.click(collapseButton);

    const resizer = container.querySelector('.ide-resizer-right');
    expect(resizer).not.toBeInTheDocument();
  });

  describe('Resizing', () => {
    it('handles left panel resize with mouse drag', () => {
      const { container } = render(
        <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
      );

      const resizer = container.querySelector('.ide-resizer-left');
      const workspace = container.querySelector('.ide-workspace');

      // Mock getBoundingClientRect
      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
        width: 1000,
        height: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Move mouse to resize
      fireEvent.mouseMove(document, { clientX: 400 });

      const leftPanel = container.querySelector('.ide-left-panel');
      expect(leftPanel).toHaveStyle({ width: '400px' });

      // End resize
      fireEvent.mouseUp(document);
    });

    it('handles right panel resize with mouse drag', () => {
      const { container } = render(
        <IDEWorkspace
          leftPanel={mockLeftPanel}
          centerPanel={mockCenterPanel}
          rightPanel={mockRightPanel}
        />
      );

      const resizer = container.querySelector('.ide-resizer-right');
      const workspace = container.querySelector('.ide-workspace');

      // Mock getBoundingClientRect
      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
        width: 1000,
        height: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Move mouse to resize (right panel width is measured from right edge)
      fireEvent.mouseMove(document, { clientX: 700 }); // 1000 - 700 = 300px

      const rightPanel = container.querySelector('.ide-right-panel');
      expect(rightPanel).toHaveStyle({ width: '300px' });

      // End resize
      fireEvent.mouseUp(document);
    });

    it('clamps left panel width to minimum 200px', () => {
      const { container } = render(
        <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
      );

      const resizer = container.querySelector('.ide-resizer-left');
      const workspace = container.querySelector('.ide-workspace');

      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Try to resize to less than minimum
      fireEvent.mouseMove(document, { clientX: 50 });

      const leftPanel = container.querySelector('.ide-left-panel');
      expect(leftPanel).toHaveStyle({ width: '200px' });

      fireEvent.mouseUp(document);
    });

    it('clamps left panel width to maximum 600px', () => {
      const { container } = render(
        <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
      );

      const resizer = container.querySelector('.ide-resizer-left');
      const workspace = container.querySelector('.ide-workspace');

      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Try to resize to more than maximum
      fireEvent.mouseMove(document, { clientX: 800 });

      const leftPanel = container.querySelector('.ide-left-panel');
      expect(leftPanel).toHaveStyle({ width: '600px' });

      fireEvent.mouseUp(document);
    });

    it('clamps right panel width to minimum 200px', () => {
      const { container } = render(
        <IDEWorkspace
          leftPanel={mockLeftPanel}
          centerPanel={mockCenterPanel}
          rightPanel={mockRightPanel}
        />
      );

      const resizer = container.querySelector('.ide-resizer-right');
      const workspace = container.querySelector('.ide-workspace');

      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Try to resize to less than minimum (clientX close to right edge)
      fireEvent.mouseMove(document, { clientX: 950 });

      const rightPanel = container.querySelector('.ide-right-panel');
      expect(rightPanel).toHaveStyle({ width: '200px' });

      fireEvent.mouseUp(document);
    });

    it('clamps right panel width to maximum 600px', () => {
      const { container } = render(
        <IDEWorkspace
          leftPanel={mockLeftPanel}
          centerPanel={mockCenterPanel}
          rightPanel={mockRightPanel}
        />
      );

      const resizer = container.querySelector('.ide-resizer-right');
      const workspace = container.querySelector('.ide-workspace');

      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);

      // Try to resize to more than maximum
      fireEvent.mouseMove(document, { clientX: 100 }); // 1000 - 100 = 900, clamped to 600

      const rightPanel = container.querySelector('.ide-right-panel');
      expect(rightPanel).toHaveStyle({ width: '600px' });

      fireEvent.mouseUp(document);
    });

    it('stops resizing on mouseup', () => {
      const { container } = render(
        <IDEWorkspace leftPanel={mockLeftPanel} centerPanel={mockCenterPanel} />
      );

      const resizer = container.querySelector('.ide-resizer-left');
      const workspace = container.querySelector('.ide-workspace');

      workspace.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800,
      }));

      // Start resize
      fireEvent.mouseDown(resizer);
      fireEvent.mouseMove(document, { clientX: 400 });

      const leftPanel = container.querySelector('.ide-left-panel');
      expect(leftPanel).toHaveStyle({ width: '400px' });

      // End resize
      fireEvent.mouseUp(document);

      // Further mouse movements should not affect width
      fireEvent.mouseMove(document, { clientX: 500 });
      expect(leftPanel).toHaveStyle({ width: '400px' });
    });
  });
});
