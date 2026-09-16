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

    expect(getByTestId('pdf-view')).toBeInTheDocument();
    expect(queryByTestId('map-view')).not.toBeInTheDocument();
    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('always renders Sidebar', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'map',
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        mapView: 'map',
      };
      return selector ? selector(state) : state;
    });

    const { container } = render(<Workspace />);
    const workspace = container.querySelector('.workspace');
    const mainPane = container.querySelector('.main-pane');

    expect(workspace).toBeInTheDocument();
    expect(mainPane).toBeInTheDocument();
  });
});
