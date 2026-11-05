'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertCircle,
  Minus,
} from 'lucide-react';

interface EditorFormattingGroupProps {
  editor: Editor;
}

export function EditorFormattingGroup({ editor }: EditorFormattingGroupProps) {
  const btn = (active: boolean) =>
    `p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
      active
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  const sep = <div className="w-[1px] h-4 bg-slate-200 dark:border-slate-800 my-auto mx-1" />;

  return (
    <>
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btn(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="size-4" />
      </button>

      {sep}

      {/* Marks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btn(editor.isActive('underline'))}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive('code'))}
        title="Inline Code"
      >
        <Code className="size-4" />
      </button>

      {sep}

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btn(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
      >
        <AlignLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btn(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
      >
        <AlignCenter className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btn(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
      >
        <AlignRight className="size-4" />
      </button>

      {sep}

      {/* Lists, Quote, Code Block, HR */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        <Quote className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCalloutBlock({ type: 'info' }).run()}
        className={btn(editor.isActive('calloutBlock'))}
        title="Callout Box"
      >
        <AlertCircle className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btn(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <FileCode className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn(false)}
        title="Horizontal Divider"
      >
        <Minus className="size-4" />
      </button>
    </>
  );
}

