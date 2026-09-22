import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { userEvent } from '../test/test-utils';
import Topbar from './Topbar';
import useStore from '../store/useStore';

// Mock the store
vi.mock('../store/useStore');

describe('Topbar', () => {
  const mockSetCurrentProject = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock localStorage
    Storage.prototype.removeItem = vi.fn();

    // Default mock implementation
    useStore.mockImplementation((selector) => {
      const state = {
        currentProject: null,
        setCurrentProject: mockSetCurrentProject,
      };
      return selector ? selector(state) : state;
    });
  });

  it('renders brand name', () => {
    const { getByText } = render(<Topbar />);
    expect(getByText('ARCANUM')).toBeInTheDocument();
    expect(getByText('collige et serva')).toBeInTheDocument();
  });

  it('does not show project controls when no project is selected', () => {
    const { queryByText } = render(<Topbar />);
    expect(queryByText('Projects')).not.toBeInTheDocument();
  });

  it('shows project controls when project is selected', () => {
    useStore.mockImplementation((selector) => {
      const state = {
        currentProject: { id: '1', name: 'Test Project' },
        setCurrentProject: mockSetCurrentProject,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(<Topbar />);
    expect(getByText('Projects')).toBeInTheDocument();
    expect(getByText('Test Project')).toBeInTheDocument();
  });

  it('calls setCurrentProject when home button is clicked', async () => {
    const user = userEvent.setup();
    useStore.mockImplementation((selector) => {
      const state = {
        currentProject: { id: '1', name: 'Test Project' },
        setCurrentProject: mockSetCurrentProject,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(<Topbar />);
    const homeButton = getByText('Projects');

    await user.click(homeButton);

    expect(mockSetCurrentProject).toHaveBeenCalledWith(null);
  });
});
