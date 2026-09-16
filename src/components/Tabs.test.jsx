import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Tabs from './Tabs';
import useStore from '../store/useStore';
import { uploadPDF, deleteSource } from '../lib/upload';

// Mock the store
vi.mock('../store/useStore');

// Mock upload library
vi.mock('../lib/upload', () => ({
  uploadPDF: vi.fn(),
  deleteSource: vi.fn(),
}));

describe('Tabs', () => {
  const mockSetActiveSource = vi.fn();
  const mockSetMapView = vi.fn();
  const mockRemoveSource = vi.fn();
  const mockAddSource = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock confirm and alert
    global.confirm = vi.fn().mockReturnValue(true);
    global.alert = vi.fn();

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default store state
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1', name: 'Test Project' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders map tab button', () => {
    render(<Tabs />);
    expect(screen.getByText('🗺️ Map')).toBeInTheDocument();
  });

  it('renders add PDF button', () => {
    render(<Tabs />);
    expect(screen.getByText('+ PDF')).toBeInTheDocument();
  });

  it('shows map tab as active when mapView is "map"', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [],
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setMapView: mockSetMapView,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const mapTab = screen.getByText('🗺️ Map').closest('button');
    expect(mapTab).toHaveClass('active');
  });

  it('calls setMapView when map tab is clicked', () => {
    render(<Tabs />);
    fireEvent.click(screen.getByText('🗺️ Map'));
    expect(mockSetMapView).toHaveBeenCalledWith('map');
  });

  it('renders source tabs', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [
          { id: 'source-1', title: 'Document 1.pdf' },
          { id: 'source-2', title: 'Document 2.pdf' },
        ],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Document 2.pdf')).toBeInTheDocument();
  });

  it('shows source tab as active when it is the active source', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [
          { id: 'source-1', title: 'Document 1.pdf' },
          { id: 'source-2', title: 'Document 2.pdf' },
        ],
        activeSourceId: 'source-1',
        mapView: 'source',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const activeTab = screen.getByText('Document 1.pdf').closest('button');
    expect(activeTab).toHaveClass('active');
  });

  it('calls setActiveSource and setMapView when source tab is clicked', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [{ id: 'source-1', title: 'Document 1.pdf' }],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    fireEvent.click(screen.getByText('Document 1.pdf'));

    expect(mockSetActiveSource).toHaveBeenCalledWith('source-1');
    expect(mockSetMapView).toHaveBeenCalledWith('source');
  });

  it('renders close button on source tabs', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [{ id: 'source-1', title: 'Document 1.pdf' }],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const closeButtons = screen.getAllByText('×');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('calls deleteSource when close button is clicked and confirmed', async () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [
          { id: 'source-1', title: 'Document 1.pdf', file_url: 'http://example.com/doc.pdf' },
        ],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    deleteSource.mockResolvedValue({});

    render(<Tabs />);
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith('Delete "Document 1.pdf"?');
      expect(deleteSource).toHaveBeenCalledWith('source-1', 'http://example.com/doc.pdf');
      expect(mockRemoveSource).toHaveBeenCalledWith('source-1');
    });
  });

  it('does not delete source when confirmation is cancelled', async () => {
    confirm.mockReturnValue(false);

    useStore.mockImplementation((selector) => {
      const state = {
        sources: [
          { id: 'source-1', title: 'Document 1.pdf', file_url: 'http://example.com/doc.pdf' },
        ],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith('Delete "Document 1.pdf"?');
      expect(deleteSource).not.toHaveBeenCalled();
      expect(mockRemoveSource).not.toHaveBeenCalled();
    });
  });

  it('shows alert when delete fails', async () => {
    useStore.mockImplementation((selector) => {
      const state = {
        sources: [
          { id: 'source-1', title: 'Document 1.pdf', file_url: 'http://example.com/doc.pdf' },
        ],
        activeSourceId: null,
        mapView: 'map',
        currentProject: { id: 'project-1' },
        setActiveSource: mockSetActiveSource,
        setMapView: mockSetMapView,
        removeSource: mockRemoveSource,
        addSource: mockAddSource,
      };
      return selector ? selector(state) : state;
    });

    deleteSource.mockRejectedValue(new Error('Delete failed'));

    render(<Tabs />);
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to delete PDF: Delete failed');
    });
  });

  // File upload tests skipped - complex DOM mocking interferes with happy-dom
  // The handleAddPDF functionality is tested indirectly through integration tests
});
