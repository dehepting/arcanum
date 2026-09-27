import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedSearch from './AdvancedSearch';
import useStore from '../store/useStore';

// Mock the store
vi.mock('../store/useStore');

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args),
}));

describe('AdvancedSearch', () => {
  const mockCurrentProject = {
    id: 'project-1',
    name: 'Test Project',
  };

  const mockAddTab = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useStore.mockImplementation((selector) => {
      const state = {
        currentProject: mockCurrentProject,
        addTab: mockAddTab,
        setActiveTab: mockSetActiveTab,
      };
      return selector ? selector(state) : state;
    });

    mockInvoke.mockResolvedValue([]);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AdvancedSearch isOpen={false} onClose={mockOnClose} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders search modal when isOpen is true', () => {
    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search across all entities...')).toBeInTheDocument();
  });

  it('renders all entity type filters', () => {
    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/People/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Events/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Theories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Places/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Artifacts/i)).toBeInTheDocument();
  });

  it('all entity types are checked by default', () => {
    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/People/i)).toBeChecked();
    expect(screen.getByLabelText(/Events/i)).toBeChecked();
    expect(screen.getByLabelText(/Theories/i)).toBeChecked();
    expect(screen.getByLabelText(/Places/i)).toBeChecked();
    expect(screen.getByLabelText(/Artifacts/i)).toBeChecked();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const overlay = container.querySelector('.modal-overlay');
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('performs search after typing with debounce', async () => {
    const user = userEvent.setup({ delay: null });
    const searchResults = [
      {
        id: '1',
        entity_type: 'people',
        name: 'Plato',
        description: 'Greek philosopher',
        snippet: 'Greek <mark>philosopher</mark>',
        rank: 1.5,
      },
    ];

    mockInvoke.mockResolvedValue(searchResults);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    // Wait for the debounce delay (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('search_entities', {
        input: {
          project_id: 'project-1',
          query: 'plato',
          entity_types: ['people', 'events', 'theories', 'places', 'artifacts'],
          limit: 50,
        },
      });
    });
  });

  it('displays search results', async () => {
    const user = userEvent.setup({ delay: null });
    const searchResults = [
      {
        id: '1',
        entity_type: 'people',
        name: 'Plato',
        description: 'Greek philosopher',
        snippet: 'Greek <mark>philosopher</mark>',
        rank: 1.5,
      },
      {
        id: '2',
        entity_type: 'places',
        name: 'Athens',
        description: 'City in Greece',
        snippet: 'City in <mark>Greece</mark>',
        rank: 1.2,
      },
    ];

    mockInvoke.mockResolvedValue(searchResults);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'greece');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText('Plato')).toBeInTheDocument();
      expect(screen.getByText('Athens')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup({ delay: null });
    mockInvoke.mockResolvedValue([]);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'nonexistent');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    const user = userEvent.setup({ delay: null });
    let resolveSearch;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });
    mockInvoke.mockReturnValue(searchPromise);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    resolveSearch([]);
  });

  it('filters search by entity types', async () => {
    const user = userEvent.setup({ delay: null });
    mockInvoke.mockResolvedValue([]);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    // Uncheck all types except people
    await user.click(screen.getByLabelText(/Events/i));
    await user.click(screen.getByLabelText(/Theories/i));
    await user.click(screen.getByLabelText(/Places/i));
    await user.click(screen.getByLabelText(/Artifacts/i));

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('search_entities', {
        input: {
          project_id: 'project-1',
          query: 'plato',
          entity_types: ['people'],
          limit: 50,
        },
      });
    });
  });

  it('opens entity tab when result is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const searchResults = [
      {
        id: '1',
        entity_type: 'people',
        name: 'Plato',
        description: 'Greek philosopher',
        snippet: 'Greek <mark>philosopher</mark>',
        rank: 1.5,
      },
    ];

    mockInvoke.mockResolvedValue(searchResults);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText('Plato')).toBeInTheDocument();
    });

    const resultItem = screen.getByText('Plato').closest('.search-result-item');
    await user.click(resultItem);

    expect(mockAddTab).toHaveBeenCalledWith({
      type: 'person',
      title: 'Plato',
      data: {
        entityId: '1',
        entityType: 'people',
      },
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not search when query is empty', async () => {
    const user = userEvent.setup({ delay: null });

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, '   ');

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not search when no project is selected', async () => {
    const user = userEvent.setup({ delay: null });

    useStore.mockImplementation((selector) => {
      const state = {
        currentProject: null,
        addTab: mockAddTab,
        setActiveTab: mockSetActiveTab,
      };
      return selector ? selector(state) : state;
    });

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('debounces search requests', async () => {
    const user = userEvent.setup({ delay: null });
    mockInvoke.mockResolvedValue([]);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');

    // Type multiple characters quickly
    await user.type(searchInput, 'p');
    await new Promise((resolve) => setTimeout(resolve, 100));
    await user.type(searchInput, 'l');
    await new Promise((resolve) => setTimeout(resolve, 100));
    await user.type(searchInput, 'a');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Search should not have been called yet
    expect(mockInvoke).not.toHaveBeenCalled();

    // After debounce delay, search should be called once
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('search_entities', {
        input: {
          project_id: 'project-1',
          query: 'pla',
          entity_types: ['people', 'events', 'theories', 'places', 'artifacts'],
          limit: 50,
        },
      });
    });
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup({ delay: null });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Search failed');
    mockInvoke.mockRejectedValue(error);

    render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'plato');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Search failed:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders snippet with HTML highlighting', async () => {
    const user = userEvent.setup({ delay: null });
    const searchResults = [
      {
        id: '1',
        entity_type: 'people',
        name: 'Plato',
        description: 'Greek philosopher',
        snippet: 'Ancient Greek <mark>philosopher</mark> who founded the Academy',
        rank: 1.5,
      },
    ];

    mockInvoke.mockResolvedValue(searchResults);

    const { container } = render(<AdvancedSearch isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText('Search across all entities...');
    await user.type(searchInput, 'philosopher');

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      const snippet = container.querySelector('.result-snippet');
      expect(snippet).toBeInTheDocument();
      expect(snippet.innerHTML).toContain('<mark>philosopher</mark>');
    });
  });
});
