'use client';

import type { Editor } from '@tiptap/react';

export interface WordCountBarProps {
  editor: Editor | null;
  modeLabel?: string;
}

export function WordCountBar({ editor, modeLabel }: WordCountBarProps) {
  if (!editor) return null;

  const characters = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/50 rounded-b-xl">
      <div className="flex items-center gap-4">
        <span>
          <strong className="text-slate-700 dark:text-slate-300">{words}</strong> words
        </span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span>
          <strong className="text-slate-700 dark:text-slate-300">{characters}</strong> characters
        </span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span>
          ~<strong className="text-slate-700 dark:text-slate-300">{readingTimeMinutes}</strong> min
          read
        </span>
      </div>

      {modeLabel && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {modeLabel}
        </span>
      )}
    </div>
  );
}
