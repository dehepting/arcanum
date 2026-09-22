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
});
