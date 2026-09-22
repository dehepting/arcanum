import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  const mockAddTab = vi.fn();
  const mockRemoveTab = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockAddSource = vi.fn();
  const mockRemoveSource = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock confirm and alert
    global.confirm = vi.fn().mockReturnValue(true);
    global.alert = vi.fn();

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default store state with new tab system
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [
          {
            id: 'default-map',
            type: 'map',
            title: 'Map',
            data: null,
            isDirty: false,
          },
        ],
        activeTabId: 'default-map',
        sources: [],
        currentProject: { id: 'project-1', name: 'Test Project' },
        addTab: mockAddTab,
        removeTab: mockRemoveTab,
        setActiveTab: mockSetActiveTab,
        addSource: mockAddSource,
        removeSource: mockRemoveSource,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders map tab button', () => {
    render(<Tabs />);
    expect(screen.getByText(/Map/)).toBeInTheDocument();
  });

  it('renders add tab button', () => {
    render(<Tabs />);
    const addButton = screen.getByRole('button', { name: /\+/ });
    expect(addButton).toBeInTheDocument();
  });

  it('shows map tab as active', () => {
    render(<Tabs />);
    const mapTab = screen.getByText(/Map/).closest('button');
    expect(mapTab).toHaveClass('active');
  });

  it('calls setActiveTab when tab is clicked', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [
          { id: 'map-1', type: 'map', title: 'Map', data: null, isDirty: false },
          { id: 'pdf-1', type: 'pdf', title: 'Test.pdf', data: { source: {} }, isDirty: false },
        ],
        activeTabId: 'map-1',
        sources: [],
        currentProject: { id: 'project-1', name: 'Test Project' },
        addTab: mockAddTab,
        removeTab: mockRemoveTab,
        setActiveTab: mockSetActiveTab,
        addSource: mockAddSource,
        removeSource: mockRemoveSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const pdfTab = screen.getByText(/Test\.pdf/).closest('button');
    fireEvent.click(pdfTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('pdf-1');
  });

  it('shows dropdown menu when add button is clicked', () => {
    render(<Tabs />);
    const addButton = screen.getByRole('button', { name: /\+/ });
    fireEvent.click(addButton);
    expect(screen.getByText(/Upload PDF/)).toBeInTheDocument();
    expect(screen.getByText(/Person/)).toBeInTheDocument();
  });

  it('renders close button on non-default tabs', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [
          { id: 'map-1', type: 'map', title: 'Map', data: null, isDirty: false },
          { id: 'pdf-1', type: 'pdf', title: 'Test.pdf', data: { source: {} }, isDirty: false },
        ],
        activeTabId: 'map-1',
        sources: [],
        currentProject: { id: 'project-1', name: 'Test Project' },
        addTab: mockAddTab,
        removeTab: mockRemoveTab,
        setActiveTab: mockSetActiveTab,
        addSource: mockAddSource,
        removeSource: mockRemoveSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    const pdfTab = screen.getByText(/Test\.pdf/).closest('button');
    const closeButton = pdfTab.querySelector('.tab-close');
    expect(closeButton).toBeInTheDocument();
  });

  it('does not show close button when only one tab', () => {
    render(<Tabs />);
    const mapTab = screen.getByText(/Map/).closest('button');
    const closeButton = mapTab.querySelector('.tab-close');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('shows dirty indicator when tab has unsaved changes', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        tabs: [{ id: 'person-1', type: 'person', title: 'Aristotle', data: {}, isDirty: true }],
        activeTabId: 'person-1',
        sources: [],
        currentProject: { id: 'project-1', name: 'Test Project' },
        addTab: mockAddTab,
        removeTab: mockRemoveTab,
        setActiveTab: mockSetActiveTab,
        addSource: mockAddSource,
        removeSource: mockRemoveSource,
      };
      return selector ? selector(state) : state;
    });

    render(<Tabs />);
    expect(screen.getByText('•')).toBeInTheDocument();
  });
});
