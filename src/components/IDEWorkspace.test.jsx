import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IDEWorkspace from './IDEWorkspace';

describe('IDEWorkspace', () => {
  const mockLeftPanel = <div data-testid="left-panel-content">Left Panel</div>;
  const mockCenterPanel = <div data-testid="center-panel-content">Center Panel</div>;
  const mockRightPanel = <div data-testid="right-panel-content">Right Panel</div>;

  beforeEach(() => {
    vi.clearAllMocks();
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
});
