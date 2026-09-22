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

vi.mock('./EntityPage', () => ({
  default: () => <div data-testid="entity-page">EntityPage</div>,
}));

vi.mock('./EntityExplorer', () => ({
  default: () => <div data-testid="entity-explorer">EntityExplorer</div>,
}));

vi.mock('./Tabs', () => ({
  default: () => <div data-testid="tabs">Tabs</div>,
}));

vi.mock('./IDEWorkspace', () => ({
  default: ({ leftPanel, centerPanel }) => (
    <div data-testid="ide-workspace">
      <div data-testid="left-panel">{leftPanel}</div>
      <div data-testid="center-panel">{centerPanel}</div>
    </div>
  ),
}));

describe('Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders MapView when active tab is map', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [{ id: 'map-1', type: 'map', title: 'Map', data: null, isDirty: false }],
        activeTabId: 'map-1',
        currentProject: { id: 'project-1', name: 'Test Project' },
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('map-view')).toBeInTheDocument();
  });

  it('renders PDFView when active tab is pdf', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [
          {
            id: 'pdf-1',
            type: 'pdf',
            title: 'Test.pdf',
            data: { source: { id: 'source-1', title: 'Test.pdf' } },
            isDirty: false,
          },
        ],
        activeTabId: 'pdf-1',
        currentProject: { id: 'project-1', name: 'Test Project' },
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('pdf-view')).toBeInTheDocument();
  });

  it('renders EntityPage when active tab is entity type', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [
          {
            id: 'person-1',
            type: 'person',
            title: 'Aristotle',
            data: { entityId: 'entity-1', entityType: 'person' },
            isDirty: false,
          },
        ],
        activeTabId: 'person-1',
        currentProject: { id: 'project-1', name: 'Test Project' },
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('entity-page')).toBeInTheDocument();
  });

  it('always renders EntityExplorer', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [{ id: 'map-1', type: 'map', title: 'Map', data: null, isDirty: false }],
        activeTabId: 'map-1',
        currentProject: { id: 'project-1', name: 'Test Project' },
      };
      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(<Workspace />);

    expect(getByTestId('entity-explorer')).toBeInTheDocument();
    expect(getByTestId('ide-workspace')).toBeInTheDocument();
  });

  it('has correct IDE layout structure', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [{ id: 'map-1', type: 'map', title: 'Map', data: null, isDirty: false }],
        activeTabId: 'map-1',
        currentProject: { id: 'project-1', name: 'Test Project' },
      };
      return selector ? selector(state) : state;
    });

    const { container, getByTestId } = render(<Workspace />);
    const workspace = container.querySelector('.workspace');

    expect(workspace).toBeInTheDocument();
    expect(getByTestId('ide-workspace')).toBeInTheDocument();
    expect(getByTestId('left-panel')).toBeInTheDocument();
    expect(getByTestId('center-panel')).toBeInTheDocument();
  });
});
