import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityExplorer from './EntityExplorer';
import useStore from '../store/useStore';

// Mock the store
vi.mock('../store/useStore');

describe('EntityExplorer', () => {
  const mockAddTab = vi.fn();

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

    useStore.mockImplementation((selector) => {
      const state = {
        people: mockPeople,
        events: mockEvents,
        theories: mockTheories,
        places: mockPlaces,
        artifacts: mockArtifacts,
        addTab: mockAddTab,
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
        addTab: mockAddTab,
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
});
