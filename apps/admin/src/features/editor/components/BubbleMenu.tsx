'use client';

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  Link as LinkIcon,
} from 'lucide-react';

export interface EditorBubbleMenuProps {
  editor: Editor | null;
  onOpenLinkModal?: () => void;
}

export function EditorBubbleMenu({ editor, onOpenLinkModal }: EditorBubbleMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const { selection } = editor.state;
      if (selection.empty || !editor.isFocused) {
        setPosition(null);
        return;
      }

      try {
        const { from, to } = selection;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);

        // Center horizontally over selection, 40px above
        const left = (start.left + end.left) / 2;
        const top = Math.min(start.top, end.top) - 44;

        setPosition({ top, left });
      } catch {
        setPosition(null);
      }
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => setPosition(null));

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('blur', () => setPosition(null));
    };
  }, [editor]);

  if (!editor || !position) return null;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded text-xs transition-colors ${
      isActive
        ? 'bg-blue-600 text-white font-bold'
        : 'text-slate-200 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
      className="z-40 flex items-center gap-0.5 p-1 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 text-xs backdrop-blur-md animate-in fade-in duration-100"
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        className={btnClass(editor.isActive('bold'))}
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        className={btnClass(editor.isActive('italic'))}
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleUnderline().run();
        }}
        className={btnClass(editor.isActive('underline'))}
        title="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleCode().run();
        }}
        className={btnClass(editor.isActive('code'))}
        title="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-700 my-auto mx-0.5" />

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </button>

      {onOpenLinkModal && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onOpenLinkModal();
          }}
          className={btnClass(editor.isActive('link'))}
          title="Add Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
