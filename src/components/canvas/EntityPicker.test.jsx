import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityPicker from './EntityPicker';
import useStore from '../../store/useStore';

// Mock the store
vi.mock('../../store/useStore');

describe('EntityPicker', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  const mockPeople = [
    { id: 'p1', name: 'Plato' },
    { id: 'p2', name: 'Aristotle' },
  ];

  const mockEvents = [{ id: 'e1', name: 'Battle of Marathon' }];

  const mockTheories = [{ id: 't1', name: 'Theory of Forms' }];

  const mockPlaces = [{ id: 'pl1', name: 'Athens' }];

  const mockArtifacts = [{ id: 'a1', name: 'Ancient Coin' }];

  beforeEach(() => {
    vi.clearAllMocks();

    useStore.mockImplementation((selector) => {
      const state = {
        people: mockPeople,
        events: mockEvents,
        theories: mockTheories,
        places: mockPlaces,
        artifacts: mockArtifacts,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders search input', () => {
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('displays all entities from store', () => {
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('Plato')).toBeInTheDocument();
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
    expect(screen.getByText('Battle of Marathon')).toBeInTheDocument();
    expect(screen.getByText('Theory of Forms')).toBeInTheDocument();
    expect(screen.getByText('Athens')).toBeInTheDocument();
    expect(screen.getByText('Ancient Coin')).toBeInTheDocument();
  });

  it('displays entity types', () => {
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('person')).toBeInTheDocument();
    expect(screen.getByText('event')).toBeInTheDocument();
    expect(screen.getByText('theory')).toBeInTheDocument();
    expect(screen.getByText('place')).toBeInTheDocument();
    expect(screen.getByText('artifact')).toBeInTheDocument();
  });

  it('displays entity icons', () => {
    const { container } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(container.textContent).toContain('👤'); // person
    expect(container.textContent).toContain('📅'); // event
    expect(container.textContent).toContain('💡'); // theory
    expect(container.textContent).toContain('📍'); // place
    expect(container.textContent).toContain('🏺'); // artifact
  });

  it('filters entities based on search query', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    await user.type(searchInput, 'plato');

    expect(screen.getByText('Plato')).toBeInTheDocument();
    expect(screen.queryByText('Aristotle')).not.toBeInTheDocument();
    expect(screen.queryByText('Battle of Marathon')).not.toBeInTheDocument();
  });

  it('filters are case-insensitive', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    await user.type(searchInput, 'PLATO');

    expect(screen.getByText('Plato')).toBeInTheDocument();
  });

  it('shows all entities when search is empty', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    await user.type(searchInput, 'xyz');
    await user.clear(searchInput);

    expect(screen.getByText('Plato')).toBeInTheDocument();
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
  });

  it('shows empty state when no entities match', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No entities found')).toBeInTheDocument();
    expect(screen.queryByText('Plato')).not.toBeInTheDocument();
  });

  it('shows empty state when store has no entities', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        people: [],
        events: [],
        theories: [],
        places: [],
        artifacts: [],
      };
      return selector ? selector(state) : state;
    });

    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('No entities found')).toBeInTheDocument();
  });

  it('calls onSelect with correct data when entity is clicked', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const platoItem = screen.getByText('Plato').closest('.entity-picker-item');
    await user.click(platoItem);

    expect(mockOnSelect).toHaveBeenCalledWith({
      entityId: 'p1',
      entityType: 'person',
      entityName: 'Plato',
    });
  });

  it('calls onClose after selecting entity', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const platoItem = screen.getByText('Plato').closest('.entity-picker-item');
    await user.click(platoItem);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const overlay = container.querySelector('.entity-picker-overlay');
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when picker content is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const picker = container.querySelector('.entity-picker');
    await user.click(picker);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-focuses search input on mount', () => {
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    expect(searchInput).toHaveFocus();
  });

  it('limits results to 50 entities', () => {
    // Create 60 mock people
    const manyPeople = Array.from({ length: 60 }, (_, i) => ({
      id: `p${i}`,
      name: `Person ${i}`,
    }));

    useStore.mockImplementation((selector) => {
      const state = {
        people: manyPeople,
        events: [],
        theories: [],
        places: [],
        artifacts: [],
      };
      return selector ? selector(state) : state;
    });

    const { container } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const items = container.querySelectorAll('.entity-picker-item');
    expect(items).toHaveLength(50);
  });

  it('handles selecting different entity types correctly', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    // Select event
    const eventItem = screen.getByText('Battle of Marathon').closest('.entity-picker-item');
    await user.click(eventItem);

    expect(mockOnSelect).toHaveBeenCalledWith({
      entityId: 'e1',
      entityType: 'event',
      entityName: 'Battle of Marathon',
    });
  });

  it('handles selecting place entity', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const placeItem = screen.getByText('Athens').closest('.entity-picker-item');
    await user.click(placeItem);

    expect(mockOnSelect).toHaveBeenCalledWith({
      entityId: 'pl1',
      entityType: 'place',
      entityName: 'Athens',
    });
  });

  it('handles selecting theory entity', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const theoryItem = screen.getByText('Theory of Forms').closest('.entity-picker-item');
    await user.click(theoryItem);

    expect(mockOnSelect).toHaveBeenCalledWith({
      entityId: 't1',
      entityType: 'theory',
      entityName: 'Theory of Forms',
    });
  });

  it('handles selecting artifact entity', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const artifactItem = screen.getByText('Ancient Coin').closest('.entity-picker-item');
    await user.click(artifactItem);

    expect(mockOnSelect).toHaveBeenCalledWith({
      entityId: 'a1',
      entityType: 'artifact',
      entityName: 'Ancient Coin',
    });
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('filters partial matches', async () => {
    const user = userEvent.setup();
    render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search entities...');
    await user.type(searchInput, 'tle');

    // Should match "Aristotle" and "Battle of Marathon"
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
    expect(screen.getByText('Battle of Marathon')).toBeInTheDocument();
    expect(screen.queryByText('Plato')).not.toBeInTheDocument();
  });

  it('renders unique keys for entities', () => {
    const { container } = render(<EntityPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

    const items = container.querySelectorAll('.entity-picker-item');
    const keys = Array.from(items).map((item) => {
      // Check the data structure would generate unique keys
      const name = item.querySelector('.entity-picker-name').textContent;
      const type = item.querySelector('.entity-picker-type').textContent;
      return `${type}-${name}`;
    });

    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(items.length);
  });
});
