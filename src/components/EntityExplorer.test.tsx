/**
 * EntityExplorer Unit Tests
 *
 * Tests that validate EntityExplorer component behavior,
 * especially source name display (regression test for blank name bug).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import EntityExplorer from './EntityExplorer';
import useStore from '../store/useStore';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

describe('EntityExplorer - Source Display', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      sources: [],
      tabs: [],
      currentProject: { id: 'test-project', name: 'Test' },
    });
  });

  it('should display source titles correctly (not blank)', () => {
    // Set up store with sources that have 'title' property
    useStore.setState({
      sources: [
        {
          id: 'source-1',
          project_id: 'test-project',
          title: 'My Research Paper', // Using 'title' not 'name'
          file_url: '/path/to/file.pdf',
          file_name: 'research.pdf',
          storage_path: '/storage/research.pdf',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'source-2',
          project_id: 'test-project',
          title: 'Another Document',
          file_url: '/path/to/other.pdf',
          file_name: 'other.pdf',
          storage_path: '/storage/other.pdf',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ],
    });

    render(<EntityExplorer />);

    // Should display source titles (regression test for blank name bug)
    expect(screen.getByText('My Research Paper')).toBeInTheDocument();
    expect(screen.getByText('Another Document')).toBeInTheDocument();
  });

  it('should use source.title property (not source.name)', () => {
    // This test ensures we use the correct property name from backend
    const testSource = {
      id: 'source-1',
      project_id: 'test-project',
      title: 'Correct Property Name', // Backend returns 'title'
      file_url: '/path/to/file.pdf',
      file_name: 'doc.pdf',
      storage_path: '/storage/doc.pdf',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    useStore.setState({
      sources: [testSource],
    });

    render(<EntityExplorer />);

    // Should display the title property value
    expect(screen.getByText('Correct Property Name')).toBeInTheDocument();

    // Verify TypeScript: This should compile (title exists)
    const title: string = testSource.title;
    expect(title).toBe('Correct Property Name');

    // Verify TypeScript: This should NOT compile if uncommented
    // @ts-expect-error - 'name' property doesn't exist on Source
    const _wrongProperty = testSource.name;
  });

  it('should handle sources without title gracefully', () => {
    // Edge case: source missing title (shouldn't happen but handle it)
    useStore.setState({
      sources: [
        {
          id: 'source-1',
          project_id: 'test-project',
          // @ts-expect-error Testing edge case
          title: undefined,
          file_url: '/path/to/file.pdf',
          file_name: 'unnamed.pdf',
          storage_path: '/storage/unnamed.pdf',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ],
    });

    // Should render without crashing
    expect(() => render(<EntityExplorer />)).not.toThrow();
  });
});
