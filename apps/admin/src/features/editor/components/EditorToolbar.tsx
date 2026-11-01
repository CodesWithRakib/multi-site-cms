'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Table as TableIcon,
  Video as VideoIcon,
  Image as ImageIcon,
  Compass,
  Activity,
  AlertCircle,
  Undo,
  Redo,
} from 'lucide-react';

export interface EditorToolbarProps {
  editor: Editor | null;
  contentType?: string;
  onOpenMediaPicker?: () => void;
  onOpenLinkModal?: () => void;
  onOpenYoutubeModal?: () => void;
  onOpenDestinationModal?: () => void;
  onOpenTimelineModal?: () => void;
}

export function EditorToolbar({
  editor,
  contentType,
  onOpenMediaPicker,
  onOpenLinkModal,
  onOpenYoutubeModal,
  onOpenDestinationModal,
  onOpenTimelineModal,
}: EditorToolbarProps) {
  if (!editor) return null;

  const showDestination =
    contentType === 'travel_guide' ||
    contentType === 'article' ||
    contentType === 'guide' ||
    !contentType;
  const showTimeline =
    contentType === 'air_sports_update' ||
    contentType === 'live_update' ||
    contentType === 'event_update' ||
    contentType === 'news' ||
    !contentType;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  const separator = <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 my-auto mx-1" />;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      {separator}

      {/* Basic Marks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btnClass(editor.isActive('code'))}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      {separator}

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      {separator}

      {/* Lists & Quotes */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCalloutBlock({ type: 'info' }).run()}
        className={btnClass(editor.isActive('calloutBlock'))}
        title="Callout Box"
      >
        <AlertCircle className="w-4 h-4" />
      </button>

      {separator}

      {/* Table */}
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className={btnClass(editor.isActive('table'))}
        title="Insert 3x3 Table"
      >
        <TableIcon className="w-4 h-4" />
      </button>

      {/* Media & Embeds */}
      {onOpenMediaPicker && (
        <button
          type="button"
          onClick={onOpenMediaPicker}
          className={btnClass(false)}
          title="Insert Media / Image"
        >
          <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
      )}

      {onOpenLinkModal && (
        <button
          type="button"
          onClick={onOpenLinkModal}
          className={btnClass(editor.isActive('link'))}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      )}

      {onOpenYoutubeModal && (
        <button
          type="button"
          onClick={onOpenYoutubeModal}
          className={btnClass(editor.isActive('youtube'))}
          title="Embed Video"
        >
          <VideoIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      )}

      {/* Custom Blocks */}
      {(showDestination || showTimeline) && separator}

      {showDestination && onOpenDestinationModal && (
        <button
          type="button"
          onClick={onOpenDestinationModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
          title="Insert Destination Info Card"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Destination</span>
        </button>
      )}

      {showTimeline && onOpenTimelineModal && (
        <button
          type="button"
          onClick={onOpenTimelineModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
          title="Insert Event Timeline Update"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
