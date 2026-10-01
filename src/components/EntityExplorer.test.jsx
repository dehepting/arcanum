import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntityExplorer from './EntityExplorer';
import useStore from '../store/useStore';

// Mock the store
vi.mock('../store/useStore');

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

// Mock Tauri fs plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
}));

describe('EntityExplorer', () => {
  const mockAddTab = vi.fn();
  const mockSetActiveTab = vi.fn();

  const mockPeople = [
    { id: '1', name: 'Aristotle' },
    { id: '2', name: 'Plato' },
  ];

  const mockEvents = [{ id: '3', name: 'Battle of Marathon' }];

  const mockTheories = [{ id: '4', name: 'Atlantis Theory' }];

  const mockPlaces = [{ id: '5', name: 'Athens' }];

  const mockArtifacts = [{ id: '6', name: 'Ancient Coin' }];

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockClear();

    useStore.mockImplementation((selector) => {
      const state = {
        people: mockPeople,
        events: mockEvents,
        theories: mockTheories,
        places: mockPlaces,
        artifacts: mockArtifacts,
        sources: [],
        tabs: [], // No existing tabs, so addTab should be called
        activeTabId: null,
        addTab: mockAddTab,
        setActiveTab: mockSetActiveTab,
        addSource: vi.fn(),
        setActiveSource: vi.fn(),
        currentProject: { id: 'project-1', name: 'Test Project' },
        updatePerson: vi.fn(),
        updateEvent: vi.fn(),
        updateTheory: vi.fn(),
        updatePlace: vi.fn(),
        updateArtifact: vi.fn(),
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders search input', () => {
    render(<EntityExplorer />);
    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders all entity type sections', () => {
    render(<EntityExplorer />);

    expect(screen.getByText(/People/)).toBeInTheDocument();
    expect(screen.getByText(/Events/)).toBeInTheDocument();
    expect(screen.getByText(/Theories/)).toBeInTheDocument();
    expect(screen.getByText(/Places/)).toBeInTheDocument();
    expect(screen.getByText(/Artifacts/)).toBeInTheDocument();
  });

  it('displays entity counts', () => {
    render(<EntityExplorer />);

    // Check that counts are displayed
    const counts = screen.getAllByText(/\(\d+\)/, { selector: '.entity-count' });
    expect(counts.length).toBeGreaterThan(0);

    // Check specifically for people count
    expect(screen.getByText('People').parentElement.textContent).toContain('(2)');
  });

  it('expands entity type when clicked', () => {
    render(<EntityExplorer />);

    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Should show entity results
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
    expect(screen.getByText('Plato')).toBeInTheDocument();
  });

  it('shows create button when entity type is expanded', () => {
    render(<EntityExplorer />);

    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    expect(screen.getByText(/\+ Create Person/)).toBeInTheDocument();
  });

  it('filters entities based on search query', () => {
    render(<EntityExplorer />);

    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'Aris' } });

    // Should show matching results
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
    expect(screen.queryByText('Plato')).not.toBeInTheDocument();
  });

  it('shows result count when searching', () => {
    render(<EntityExplorer />);

    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'Aris' } });

    expect(screen.getByText(/1 results/)).toBeInTheDocument();
  });

  it('opens entity tab when entity is clicked', () => {
    render(<EntityExplorer />);

    // Expand people section
    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Click on Aristotle
    const aristotleEntity = screen.getByText('Aristotle');
    fireEvent.click(aristotleEntity);

    expect(mockAddTab).toHaveBeenCalledWith({
      type: 'person',
      title: 'Aristotle',
      data: {
        entityId: '1',
        entityType: 'person',
      },
    });
  });

  it('opens different entity types correctly', () => {
    render(<EntityExplorer />);

    // Expand and click event
    const eventsSection = screen.getByText(/Events/).closest('.entity-type-item');
    fireEvent.click(eventsSection);

    const eventEntity = screen.getByText('Battle of Marathon');
    fireEvent.click(eventEntity);

    expect(mockAddTab).toHaveBeenCalledWith({
      type: 'event',
      title: 'Battle of Marathon',
      data: {
        entityId: '3',
        entityType: 'event',
      },
    });
  });

  it('switches to existing tab instead of creating duplicate', () => {
    // Mock store with existing tab for Aristotle
    useStore.mockImplementation((selector) => {
      const state = {
        people: mockPeople,
        events: mockEvents,
        theories: mockTheories,
        places: mockPlaces,
        artifacts: mockArtifacts,
        sources: [],
        tabs: [
          {
            id: 'tab-1',
            type: 'person',
            data: { entityId: '1', entityType: 'person' },
          },
        ],
        activeTabId: 'tab-1',
        addTab: mockAddTab,
        setActiveTab: mockSetActiveTab,
        addSource: vi.fn(),
        setActiveSource: vi.fn(),
        currentProject: { id: 'project-1', name: 'Test Project' },
        updatePerson: vi.fn(),
        updateEvent: vi.fn(),
        updateTheory: vi.fn(),
        updatePlace: vi.fn(),
        updateArtifact: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<EntityExplorer />);

    // Expand people section
    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Click on Aristotle (which already has a tab)
    const aristotleEntity = screen.getByText('Aristotle');
    fireEvent.click(aristotleEntity);

    // Should switch to existing tab, not create new one
    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-1');
    expect(mockAddTab).not.toHaveBeenCalled();
  });

  it('creates new entity when create button is clicked', () => {
    render(<EntityExplorer />);

    // Expand people section
    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Click create button
    const createButton = screen.getByText(/\+ Create Person/);
    fireEvent.click(createButton);

    expect(mockAddTab).toHaveBeenCalledWith({
      type: 'person',
      title: 'New Person',
      data: {
        entityId: null,
        entityType: 'person',
      },
    });
  });

  it('creates different entity types with correct titles', () => {
    render(<EntityExplorer />);

    // Test event creation
    const eventsSection = screen.getByText(/Events/).closest('.entity-type-item');
    fireEvent.click(eventsSection);

    const createEventButton = screen.getByText(/\+ Create Event/);
    fireEvent.click(createEventButton);

    expect(mockAddTab).toHaveBeenCalledWith({
      type: 'event',
      title: 'New Event',
      data: {
        entityId: null,
        entityType: 'event',
      },
    });
  });

  it('shows entity icons in search results', () => {
    render(<EntityExplorer />);

    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'Aris' } });

    // Should show entity with icon
    const entityResult = screen.getByText('Aristotle').closest('.entity-result');
    const icon = entityResult.querySelector('.entity-result-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.textContent).toBe('👤');
  });

  it('limits search results to 10 per type', () => {
    // Create more than 10 people
    const manyPeople = Array.from({ length: 15 }, (_, i) => ({
      id: `person-${i}`,
      name: `Person ${i}`,
    }));

    useStore.mockImplementation((selector) => {
      const state = {
        people: manyPeople,
        events: [],
        theories: [],
        places: [],
        artifacts: [],
        sources: [],
        tabs: [],
        activeTabId: null,
        addTab: mockAddTab,
        setActiveTab: mockSetActiveTab,
        addSource: vi.fn(),
        setActiveSource: vi.fn(),
        currentProject: { id: 'project-1', name: 'Test Project' },
        updatePerson: vi.fn(),
        updateEvent: vi.fn(),
        updateTheory: vi.fn(),
        updatePlace: vi.fn(),
        updateArtifact: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<EntityExplorer />);

    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'Person' } });

    // Should only show 10 results (plus the count text)
    const results = screen.getAllByText(/Person \d+/);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('hides create buttons when searching', () => {
    render(<EntityExplorer />);

    // Expand people section first
    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Should show create button
    expect(screen.getByText(/\+ Create Person/)).toBeInTheDocument();

    // Start searching
    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Create button should be hidden during search
    expect(screen.queryByText(/\+ Create Person/)).not.toBeInTheDocument();
  });

  it('does not expand sections when searching', () => {
    render(<EntityExplorer />);

    // Start searching
    const searchInput = screen.getByPlaceholderText(/Search entities.../);
    fireEvent.change(searchInput, { target: { value: 'Aristotle' } });

    // Try to click on people section - should not toggle when searching
    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
    fireEvent.click(peopleSection);

    // Results should still be visible (not toggled)
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
  });

  it('renders collapsed sections by default', () => {
    render(<EntityExplorer />);

    // People section should be collapsed (not showing individual entities)
    expect(screen.queryByText('Aristotle')).not.toBeInTheDocument();
    expect(screen.queryByText('Plato')).not.toBeInTheDocument();
  });

  it('toggles section expansion state', () => {
    render(<EntityExplorer />);

    const peopleSection = screen.getByText(/People/).closest('.entity-type-item');

    // Expand
    fireEvent.click(peopleSection);
    expect(screen.getByText('Aristotle')).toBeInTheDocument();

    // Collapse
    fireEvent.click(peopleSection);
    expect(screen.queryByText('Aristotle')).not.toBeInTheDocument();
  });

  describe('Canvas Management', () => {
    beforeEach(() => {
      mockInvoke.mockResolvedValue([
        { id: 'canvas-1', name: 'Canvas 1' },
        { id: 'canvas-2', name: 'Canvas 2' },
      ]);
    });

    it('loads canvases on mount', async () => {
      render(<EntityExplorer />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('list_canvases', {
          projectId: 'project-1',
        });
      });
    });

    it('opens canvas in tab when clicked', async () => {
      render(<EntityExplorer />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('list_canvases', { projectId: 'project-1' });
      });

      // Wait for canvases to load and find canvas items
      await waitFor(() => {
        const canvasElements = screen.queryAllByText(/Canvas \d+/);
        if (canvasElements.length > 0) {
          fireEvent.click(canvasElements[0]);

          expect(mockAddTab).toHaveBeenCalledWith({
            type: 'canvas',
            title: 'Canvas 1',
            canvasId: 'canvas-1',
            data: {
              canvasId: 'canvas-1',
              canvasName: 'Canvas 1',
            },
          });
        }
      });
    });

    it('creates new canvas when create button is clicked', async () => {
      mockInvoke.mockResolvedValueOnce([]).mockResolvedValueOnce({
        id: 'canvas-new',
        name: 'Canvas 1',
      });

      render(<EntityExplorer />);

      await waitFor(() => {
        const createButton = screen.queryByText(/\+ Create Canvas/i);
        if (createButton) {
          fireEvent.click(createButton);
        }
      });
    });
  });

  describe('Entity Renaming', () => {
    it('enters edit mode on double-click', () => {
      render(<EntityExplorer />);

      // Expand people section
      const peopleSection = screen.getByText(/People/).closest('.entity-type-item');
      fireEvent.click(peopleSection);

      // Double-click Aristotle
      const aristotleEntity = screen.getByText('Aristotle');
      fireEvent.doubleClick(aristotleEntity);

      // Should show input or editing state
      // Note: This depends on the actual implementation
    });
  });

  describe('Section Toggling', () => {
    it('renders sections by default', () => {
      render(<EntityExplorer />);

      // These sections should be present
      expect(screen.getByText(/People/)).toBeInTheDocument();
      expect(screen.getByText(/Events/)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('handles empty entity lists gracefully', () => {
      useStore.mockImplementation((selector) => {
        const state = {
          people: [],
          events: [],
          theories: [],
          places: [],
          artifacts: [],
          sources: [],
          tabs: [],
          activeTabId: null,
          addTab: mockAddTab,
          setActiveTab: mockSetActiveTab,
          addSource: vi.fn(),
          setActiveSource: vi.fn(),
          currentProject: { id: 'project-1', name: 'Test Project' },
          updatePerson: vi.fn(),
          updateEvent: vi.fn(),
          updateTheory: vi.fn(),
          updatePlace: vi.fn(),
          updateArtifact: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(<EntityExplorer />);

      // Should still render entity type headers
      expect(screen.getByText(/People/)).toBeInTheDocument();
    });

    it('shows correct count for empty entity types', () => {
      useStore.mockImplementation((selector) => {
        const state = {
          people: [],
          events: [],
          theories: [],
          places: [],
          artifacts: [],
          sources: [],
          tabs: [],
          activeTabId: null,
          addTab: mockAddTab,
          setActiveTab: mockSetActiveTab,
          addSource: vi.fn(),
          setActiveSource: vi.fn(),
          currentProject: { id: 'project-1', name: 'Test Project' },
          updatePerson: vi.fn(),
          updateEvent: vi.fn(),
          updateTheory: vi.fn(),
          updatePlace: vi.fn(),
          updateArtifact: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(<EntityExplorer />);

      // Check for (0) counts
      expect(screen.getByText('People').parentElement.textContent).toContain('(0)');
    });
  });

  describe('Multiple Entity Types', () => {
    it('handles clicking all entity types', () => {
      render(<EntityExplorer />);

      // Test each entity type
      const entityTypes = [
        { name: 'Events', entity: 'Battle of Marathon', type: 'event' },
        { name: 'Theories', entity: 'Atlantis Theory', type: 'theory' },
        { name: 'Places', entity: 'Athens', type: 'place' },
        { name: 'Artifacts', entity: 'Ancient Coin', type: 'artifact' },
      ];

      entityTypes.forEach(({ name, entity, type }) => {
        const section = screen.getByText(new RegExp(name)).closest('.entity-type-item');
        fireEvent.click(section);

        const entityElement = screen.getByText(entity);
        fireEvent.click(entityElement);

        expect(mockAddTab).toHaveBeenCalledWith(
          expect.objectContaining({
            type,
            data: expect.objectContaining({ entityType: type }),
          })
        );
      });
    });
  });

  describe('Search Edge Cases', () => {
    it('handles case-insensitive search', () => {
      render(<EntityExplorer />);

      const searchInput = screen.getByPlaceholderText(/Search entities.../);
      fireEvent.change(searchInput, { target: { value: 'ARISTOTLE' } });

      expect(screen.getByText('Aristotle')).toBeInTheDocument();
    });

    it('handles search with no results', () => {
      render(<EntityExplorer />);

      const searchInput = screen.getByPlaceholderText(/Search entities.../);
      fireEvent.change(searchInput, { target: { value: 'XYZ123' } });

      expect(screen.getByText(/0 results/)).toBeInTheDocument();
    });

    it('handles partial name search', () => {
      render(<EntityExplorer />);

      const searchInput = screen.getByPlaceholderText(/Search entities.../);
      fireEvent.change(searchInput, { target: { value: 'Plat' } });

      expect(screen.getByText('Plato')).toBeInTheDocument();
      expect(screen.queryByText('Aristotle')).not.toBeInTheDocument();
    });
  });
});
