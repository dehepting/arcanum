import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Workspace from './Workspace';
import useStore from '../store/useStore';

// Mock the store
vi.mock('../store/useStore');

// Mock child components
vi.mock('./MapView', () => ({
  default: () => <div data-testid="map-view">MapView</div>,
}));

vi.mock('./PDFView', () => ({
  default: () => <div data-testid="pdf-view">PDFView</div>,
}));

vi.mock('./Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('./EntityExplorer', () => ({
  default: () => <div data-testid="entity-explorer">EntityExplorer</div>,
}));

vi.mock('./IDEWorkspace', () => ({
  default: ({ leftPanel, centerPanel, rightPanel }) => (
    <div data-testid="ide-workspace">
      <div data-testid="left-panel">{leftPanel}</div>
      <div data-testid="center-panel">{centerPanel}</div>
      <div data-testid="right-panel">{rightPanel}</div>
    </div>
  ),
}));

describe('Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders MapView when mapView is "map"', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'map',
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId, queryByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('map-view')).toBeInTheDocument();
    expect(queryByTestId('pdf-view')).not.toBeInTheDocument();
    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders PDFView when mapView is "source"', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'source',
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId, queryByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('pdf-view')).toBeInTheDocument();
    expect(queryByTestId('map-view')).not.toBeInTheDocument();
    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('always renders Sidebar and EntityExplorer', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'map',
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('has correct IDE layout structure', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'map',
      };
      return selector ? selector(state) : state;
    });

    const { container, getByTestId } = render(<Workspace />);
    const workspace = container.querySelector('.workspace');

    expect(workspace).toBeInTheDocument();
    expect(getByTestId('ide-workspace')).toBeInTheDocument();
    expect(getByTestId('left-panel')).toBeInTheDocument();
    expect(getByTestId('center-panel')).toBeInTheDocument();
    expect(getByTestId('right-panel')).toBeInTheDocument();
  });
});
