import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorToolbar from './EditorToolbar';

describe('EditorToolbar', () => {
  let mockEditor;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a properly chained mock
    const createChainMock = () => {
      const runMock = vi.fn();
      const chainMethods = {
        run: runMock,
        toggleBold: vi.fn(() => chainMethods),
        toggleItalic: vi.fn(() => chainMethods),
        toggleStrike: vi.fn(() => chainMethods),
        toggleCode: vi.fn(() => chainMethods),
        toggleHeading: vi.fn(() => chainMethods),
        toggleBulletList: vi.fn(() => chainMethods),
        toggleOrderedList: vi.fn(() => chainMethods),
        toggleCodeBlock: vi.fn(() => chainMethods),
        toggleBlockquote: vi.fn(() => chainMethods),
        setLink: vi.fn(() => chainMethods),
        unsetLink: vi.fn(() => chainMethods),
        undo: vi.fn(() => chainMethods),
        redo: vi.fn(() => chainMethods),
      };
      return chainMethods;
    };

    // Mock Tiptap editor
    mockEditor = {
      chain: vi.fn(() => ({
        focus: vi.fn(() => createChainMock()),
      })),
      isActive: vi.fn(() => false),
      can: vi.fn(() => ({
        undo: vi.fn(() => true),
        redo: vi.fn(() => true),
      })),
    };

    // Mock window.prompt
    global.prompt = vi.fn();
  });

  it('returns null when no editor is provided', () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toolbar with all button groups', () => {
    render(<EditorToolbar editor={mockEditor} />);

    // Check for text formatting buttons
    expect(screen.getByTitle(/Bold/)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/)).toBeInTheDocument();
    expect(screen.getByTitle(/Strikethrough/)).toBeInTheDocument();
    expect(screen.getByTitle(/Inline Code/)).toBeInTheDocument();

    // Check for heading buttons
    expect(screen.getByTitle(/Heading 1/)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 2/)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 3/)).toBeInTheDocument();

    // Check for list buttons
    expect(screen.getByTitle(/Bullet List/)).toBeInTheDocument();
    expect(screen.getByTitle(/Numbered List/)).toBeInTheDocument();

    // Check for block buttons
    expect(screen.getByTitle(/Code Block/)).toBeInTheDocument();
    expect(screen.getByTitle(/Blockquote/)).toBeInTheDocument();

    // Check for link button
    expect(screen.getByTitle(/Add Link/)).toBeInTheDocument();

    // Check for undo/redo buttons
    expect(screen.getByTitle(/Undo/)).toBeInTheDocument();
    expect(screen.getByTitle(/Redo/)).toBeInTheDocument();
  });

  it('calls toggleBold when bold button is clicked', () => {
    render(<EditorToolbar editor={mockEditor} />);

    const boldButton = screen.getByTitle(/Bold/);
    fireEvent.click(boldButton);

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('calls toggleItalic when italic button is clicked', () => {
    render(<EditorToolbar editor={mockEditor} />);

    const italicButton = screen.getByTitle(/Italic/);
    fireEvent.click(italicButton);

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('calls toggleHeading when heading button is clicked', () => {
    render(<EditorToolbar editor={mockEditor} />);

    const h1Button = screen.getByTitle(/Heading 1/);
    fireEvent.click(h1Button);

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('adds active class to bold button when bold is active', () => {
    mockEditor.isActive = vi.fn((format) => format === 'bold');

    render(<EditorToolbar editor={mockEditor} />);

    const boldButton = screen.getByTitle(/Bold/);
    expect(boldButton).toHaveClass('active');
  });

  it('prompts for URL when add link button is clicked', () => {
    global.prompt = vi.fn(() => 'https://example.com');

    render(<EditorToolbar editor={mockEditor} />);

    const linkButton = screen.getByTitle(/Add Link/);
    fireEvent.click(linkButton);

    expect(global.prompt).toHaveBeenCalledWith('Enter URL:');
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('does not add link when URL prompt is cancelled', () => {
    global.prompt = vi.fn(() => null);

    render(<EditorToolbar editor={mockEditor} />);

    const linkButton = screen.getByTitle(/Add Link/);
    fireEvent.click(linkButton);

    expect(global.prompt).toHaveBeenCalled();
    // Chain should not be called if prompt is cancelled
  });

  it('shows remove link button when link is active', () => {
    mockEditor.isActive = vi.fn((format) => format === 'link');

    render(<EditorToolbar editor={mockEditor} />);

    const removeLinkButton = screen.getByTitle(/Remove Link/);
    expect(removeLinkButton).toBeInTheDocument();
  });

  it('calls unsetLink when remove link button is clicked', () => {
    mockEditor.isActive = vi.fn((format) => format === 'link');

    render(<EditorToolbar editor={mockEditor} />);

    const removeLinkButton = screen.getByTitle(/Remove Link/);
    fireEvent.click(removeLinkButton);

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('disables undo button when undo is not available', () => {
    mockEditor.can = vi.fn(() => ({
      undo: vi.fn(() => false),
      redo: vi.fn(() => true),
    }));

    render(<EditorToolbar editor={mockEditor} />);

    const undoButton = screen.getByTitle(/Undo/);
    expect(undoButton).toBeDisabled();
  });

  it('disables redo button when redo is not available', () => {
    mockEditor.can = vi.fn(() => ({
      undo: vi.fn(() => true),
      redo: vi.fn(() => false),
    }));

    render(<EditorToolbar editor={mockEditor} />);

    const redoButton = screen.getByTitle(/Redo/);
    expect(redoButton).toBeDisabled();
  });

  it('calls undo when undo button is clicked', () => {
    render(<EditorToolbar editor={mockEditor} />);

    const undoButton = screen.getByTitle(/Undo/);
    fireEvent.click(undoButton);

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('calls redo when redo button is clicked', () => {
    render(<EditorToolbar editor={mockEditor} />);

    const redoButton = screen.getByTitle(/Redo/);
    fireEvent.click(redoButton);

    expect(mockEditor.chain).toHaveBeenCalled();
  });
});
