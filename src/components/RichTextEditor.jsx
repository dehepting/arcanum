import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import EditorToolbar from './EditorToolbar';
import './RichTextEditor.css';

/**
 * RichTextEditor - Tiptap-based WYSIWYG markdown editor
 * Features:
 * - Rich text formatting (bold, italic, headings, lists, etc.)
 * - Markdown shortcuts (e.g., # → H1, ** → bold)
 * - Link support
 * - Toolbar with formatting buttons
 * - Auto-save support
 * - Dark theme
 */
export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  showToolbar = true,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        code: {
          HTMLAttributes: {
            class: 'inline-code',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Update editor content when prop changes (for loading saved content)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      {showToolbar && editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
