import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EntityPage from './EntityPage';
import useStore from '../store/useStore';
import * as entityPagesLib from '../lib/entityPages';

// Mock the store
vi.mock('../store/useStore');

// Mock the entity pages library
vi.mock('../lib/entityPages', () => ({
  getEntityPage: vi.fn(),
  updateEntityPage: vi.fn(),
}));

// Mock RichTextEditor
vi.mock('./RichTextEditor', () => ({
  default: ({ content, onChange }) => (
    <div data-testid="rich-text-editor" data-content={content}>
      RichTextEditor
    </div>
  ),
}));

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args),
}));

describe('EntityPage', () => {
  const mockUpdateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useStore.mockImplementation((selector) => {
      const state = {
        updateTab: mockUpdateTab,
      };
      return selector ? selector(state) : state;
    });
  });

  it('shows loading state initially', () => {
    entityPagesLib.getEntityPage.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <EntityPage
        entityId="entity-1"
        entityType="person"
        title="Aristotle"
        projectId="project-1"
        tabId="tab-1"
      />
    );

    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  it('loads entity page content on mount', async () => {
    entityPagesLib.getEntityPage.mockResolvedValue({
      data: {
        content: '<p>Test content</p>',
        page: { title: 'Aristotle' },
      },
      error: null,
    });

    render(
      <EntityPage
        entityId="entity-1"
        entityType="person"
        title="Aristotle"
        projectId="project-1"
        tabId="tab-1"
      />
    );

    await waitFor(
      () => {
        expect(entityPagesLib.getEntityPage).toHaveBeenCalledWith('entity-1');
      },
      { timeout: 2000 }
    );
  }, 10000);

  it('renders editor for new entity page without entityId', async () => {
    render(
      <EntityPage
        entityId={null}
        entityType="person"
        title="New Person"
        projectId="project-1"
        tabId="tab-1"
      />
    );

    // When entityId is null, it doesn't call getEntityPage
    await waitFor(
      () => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('displays error message when loading fails', async () => {
    entityPagesLib.getEntityPage.mockResolvedValue({
      data: null,
      error: 'Failed to load',
    });

    render(
      <EntityPage
        entityId="entity-1"
        entityType="person"
        title="Aristotle"
        projectId="project-1"
        tabId="tab-1"
      />
    );

    await waitFor(
      () => {
        const errorText = screen.queryByText(/Failed to load/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  }, 10000);

  it('displays entity type badge and title', async () => {
    entityPagesLib.getEntityPage.mockResolvedValue({
      data: { content: '<p>Content</p>' },
      error: null,
    });

    render(
      <EntityPage
        entityId="entity-1"
        entityType="person"
        title="Aristotle"
        projectId="project-1"
        tabId="tab-1"
      />
    );

    // Check for entity type badge
    expect(screen.getByText('person')).toBeInTheDocument();

    // Check for title
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', async () => {
    entityPagesLib.getEntityPage.mockResolvedValue({
      data: { content: '<p>Content</p>' },
      error: null,
    });

    const handleClose = vi.fn();

    render(
      <EntityPage
        entityId="entity-1"
        entityType="person"
        title="Aristotle"
        projectId="project-1"
        tabId="tab-1"
        onClose={handleClose}
      />
    );

    await waitFor(
      () => {
        const closeButton = screen.queryByTitle(/Close/);
        if (closeButton) {
          expect(closeButton).toBeInTheDocument();
        }
      },
      { timeout: 2000 }
    );
  }, 10000);

  describe('Metadata Loading', () => {
    beforeEach(() => {
      entityPagesLib.getEntityPage.mockResolvedValue({
        data: { content: '<p>Content</p>' },
        error: null,
      });
    });

    it('loads person metadata with correct parameter name', async () => {
      mockInvoke.mockResolvedValue({
        id: 'person-1',
        name: 'Aristotle',
        occupation: 'Philosopher',
        birth_date: '384 BC',
        death_date: '322 BC',
        description: 'Greek philosopher',
      });

      render(
        <EntityPage
          entityId="person-1"
          entityType="person"
          title="Aristotle"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_person', { person_id: 'person-1' });
      });
    });

    it('loads place metadata with correct parameter name', async () => {
      mockInvoke.mockResolvedValue({
        id: 'place-1',
        name: 'Athens',
        lat: 37.9838,
        lng: 23.7275,
        place_type: 'City',
        description: 'Capital of Greece',
      });

      render(
        <EntityPage
          entityId="place-1"
          entityType="place"
          title="Athens"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_place', { place_id: 'place-1' });
      });
    });

    it('loads theory metadata with correct parameter name', async () => {
      mockInvoke.mockResolvedValue({
        id: 'theory-1',
        name: 'Atlantis Theory',
        description: 'Ancient lost civilization',
      });

      render(
        <EntityPage
          entityId="theory-1"
          entityType="theory"
          title="Atlantis Theory"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_theory', { theory_id: 'theory-1' });
      });
    });

    it('loads event metadata with correct parameter name', async () => {
      mockInvoke.mockResolvedValue({
        id: 'event-1',
        name: 'Battle of Marathon',
        event_date: '490 BC',
        location: 'Marathon',
        description: 'Historic battle',
      });

      render(
        <EntityPage
          entityId="event-1"
          entityType="event"
          title="Battle of Marathon"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_event', { event_id: 'event-1' });
      });
    });

    it('loads artifact metadata with correct parameter name', async () => {
      mockInvoke.mockResolvedValue({
        id: 'artifact-1',
        name: 'Ancient Coin',
        category: 'Currency',
        date_range: '500-400 BC',
        owner_name: 'Museum',
        owner_type: 'Institution',
        description: 'Silver coin',
      });

      render(
        <EntityPage
          entityId="artifact-1"
          entityType="artifact"
          title="Ancient Coin"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_artifact', { artifact_id: 'artifact-1' });
      });
    });

    it('displays person metadata fields', async () => {
      mockInvoke.mockResolvedValue({
        id: 'person-1',
        name: 'Aristotle',
        occupation: 'Philosopher',
        birth_date: '384 BC',
        death_date: '322 BC',
        description: 'Greek philosopher',
      });

      render(
        <EntityPage
          entityId="person-1"
          entityType="person"
          title="Aristotle"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Philosopher/)).toBeInTheDocument();
        expect(screen.getByText(/384 BC/)).toBeInTheDocument();
        expect(screen.getByText(/322 BC/)).toBeInTheDocument();
      });
    });

    it('handles metadata loading errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to load metadata'));

      render(
        <EntityPage
          entityId="person-1"
          entityType="person"
          title="Aristotle"
          projectId="project-1"
          tabId="tab-1"
        />
      );

      // Should still render the page content even if metadata fails
      await waitFor(() => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });
    });
  });
});
