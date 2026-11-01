import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/core';

import { CalloutBlock } from '../extensions/callout-block';
import { DestinationInfoBlock } from '../extensions/destination-info-block';
import { EventTimelineBlock } from '../extensions/event-timeline-block';

export interface EditorPresetOptions {
  contentType?: string;
  placeholder?: string;
}

export function getEditorExtensions(options: EditorPresetOptions = {}): Extensions {
  const { contentType = 'article', placeholder = 'Write your story, press "/" for commands...' } =
    options;

  const baseExtensions: Extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      dropcursor: {
        color: '#3b82f6',
        width: 2,
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class:
          'text-blue-600 dark:text-blue-400 underline underline-offset-2 font-medium cursor-pointer',
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class:
          'rounded-xl max-w-full h-auto my-4 border border-slate-200 dark:border-slate-800 shadow-sm mx-auto',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class:
          'border-collapse table-auto w-full my-4 text-sm border border-slate-200 dark:border-slate-700',
      },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: {
        class:
          'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 font-semibold text-left',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-slate-200 dark:border-slate-700 px-3 py-2 align-top',
      },
    }),
    Youtube.configure({
      width: 640,
      height: 360,
      HTMLAttributes: {
        class: 'rounded-xl overflow-hidden my-4 mx-auto aspect-video w-full max-w-2xl',
      },
    }),
    CharacterCount,
    Placeholder.configure({
      placeholder,
    }),
    CalloutBlock,
  ];

  if (contentType === 'travel_guide' || contentType === 'article' || contentType === 'guide') {
    baseExtensions.push(DestinationInfoBlock);
  }

  if (
    contentType === 'air_sports_update' ||
    contentType === 'live_update' ||
    contentType === 'event_update' ||
    contentType === 'news'
  ) {
    baseExtensions.push(EventTimelineBlock);
  }

  // If general or untyped, include all
  if (contentType === 'general' || !contentType) {
    baseExtensions.push(DestinationInfoBlock, EventTimelineBlock);
  }

  return baseExtensions;
}
