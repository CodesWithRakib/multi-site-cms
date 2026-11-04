'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Link as LinkIcon,
  Table as TableIcon,
  Video as VideoIcon,
  Image as ImageIcon,
  Compass,
  Activity,
  Undo,
  Redo,
} from 'lucide-react';
import { EditorFormattingGroup } from './EditorFormattingGroup';

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

  const btn = (active: boolean) =>
    `p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
      active
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  const sep = <div className="w-[1px] h-4 bg-slate-200 dark:border-slate-800 my-auto mx-1" />;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
      <EditorFormattingGroup editor={editor} />

      {sep}

      {/* Table & Media */}
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={btn(editor.isActive('table'))}
        title="Insert 3x3 Table"
      >
        <TableIcon className="size-4" />
      </button>

      {onOpenMediaPicker && (
        <button
          type="button"
          onClick={onOpenMediaPicker}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
          title="Insert Media Asset"
        >
          <ImageIcon className="size-3.5" />
          <span className="hidden sm:inline">Media</span>
        </button>
      )}

      {onOpenLinkModal && (
        <button
          type="button"
          onClick={onOpenLinkModal}
          className={btn(editor.isActive('link'))}
          title="Add Hyperlink"
        >
          <LinkIcon className="size-4" />
        </button>
      )}

      {onOpenYoutubeModal && (
        <button
          type="button"
          onClick={onOpenYoutubeModal}
          className={btn(editor.isActive('youtube'))}
          title="Embed Video"
        >
          <VideoIcon className="size-4 text-rose-500" />
        </button>
      )}

      {/* Domain specific blocks */}
      {(showDestination || showTimeline) && sep}

      {showDestination && onOpenDestinationModal && (
        <button
          type="button"
          onClick={onOpenDestinationModal}
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
          title="Insert Destination Info Card"
        >
          <Compass className="size-3.5" />
          <span>Destination</span>
        </button>
      )}

      {showTimeline && onOpenTimelineModal && (
        <button
          type="button"
          onClick={onOpenTimelineModal}
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
          title="Insert Event Timeline Update"
        >
          <Activity className="size-3.5" />
          <span>Timeline</span>
        </button>
      )}

      {/* Undo / Redo */}
      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
