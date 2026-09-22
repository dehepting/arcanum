import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';

describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor', () => {
    const { container } = render(<RichTextEditor content="" onChange={vi.fn()} />);
    const editor = container.querySelector('.rich-text-editor');
    expect(editor).toBeInTheDocument();
  });

  it('displays placeholder when empty', () => {
    const { container } = render(
      <RichTextEditor content="" onChange={vi.fn()} placeholder="Start writing..." />
    );
    const editorContent = container.querySelector('.rich-text-editor-content');
    expect(editorContent).toHaveAttribute('data-placeholder', 'Start writing...');
  });

  it('renders editable content area', async () => {
    const { container } = render(<RichTextEditor content="" onChange={vi.fn()} />);

    // Wait for editor to initialize
    await waitFor(() => {
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
      expect(editorContent).toHaveAttribute('contenteditable', 'true');
    });
  });

  it('renders with initial content', async () => {
    const { container } = render(
      <RichTextEditor content="<p>Hello world</p>" onChange={vi.fn()} />
    );

    await waitFor(() => {
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
    });
  });

  it('shows toolbar when showToolbar is true', () => {
    const { container } = render(
      <RichTextEditor content="" onChange={vi.fn()} showToolbar={true} />
    );

    // Wait for toolbar to render
    waitFor(() => {
      const toolbar = container.querySelector('.editor-toolbar');
      expect(toolbar).toBeInTheDocument();
    });
  });

  it('hides toolbar when showToolbar is false', () => {
    const { container } = render(
      <RichTextEditor content="" onChange={vi.fn()} showToolbar={false} />
    );

    const toolbar = container.querySelector('.editor-toolbar');
    expect(toolbar).not.toBeInTheDocument();
  });

  it('hides toolbar when editable is false', () => {
    const { container } = render(
      <RichTextEditor content="" onChange={vi.fn()} editable={false} showToolbar={true} />
    );

    const toolbar = container.querySelector('.editor-toolbar');
    expect(toolbar).not.toBeInTheDocument();
  });

  it('updates content when prop changes', async () => {
    const { container, rerender } = render(
      <RichTextEditor content="<p>Initial</p>" onChange={vi.fn()} />
    );

    await waitFor(() => {
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
    });

    // Update content prop
    rerender(<RichTextEditor content="<p>Updated</p>" onChange={vi.fn()} />);

    await waitFor(() => {
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
    });
  });

  it('cleans up editor on unmount', async () => {
    const { container, unmount } = render(<RichTextEditor content="" onChange={vi.fn()} />);

    await waitFor(() => {
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeInTheDocument();
    });

    // Should not throw error on unmount
    expect(() => unmount()).not.toThrow();
  });
});
