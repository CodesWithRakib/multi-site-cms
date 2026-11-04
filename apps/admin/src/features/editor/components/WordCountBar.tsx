'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
import { BookOpen, Clock, FileText, CheckCircle2 } from 'lucide-react';

export interface WordCountBarProps {
  editor: Editor | null;
  modeLabel?: string;
  targetWordCount?: number;
}

export function WordCountBar({ editor, modeLabel, targetWordCount = 600 }: WordCountBarProps) {
  if (!editor) return null;

  const characters = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const progressPercent = Math.min(100, Math.round((words / targetWordCount) * 100));

  // Editorial depth status
  const depthBadge =
    words === 0
      ? { label: 'Empty Draft', color: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800' }
      : words < 300
        ? { label: 'Quick Read (<300 words)', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60' }
        : words < 900
          ? { label: 'Standard Feature (300-900 words)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60' }
          : { label: 'Deep Dive (900+ words)', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60' };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/60 rounded-b-xl">
      {/* Metrics Row */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="size-3.5 text-slate-400" />
          <strong className="text-slate-800 dark:text-slate-200 font-mono">{words}</strong>
          <span>words</span>
        </span>

        <span className="text-slate-300 dark:text-slate-700">•</span>

        <span className="font-medium">
          <strong className="text-slate-800 dark:text-slate-200 font-mono">{characters}</strong> characters
        </span>

        <span className="text-slate-300 dark:text-slate-700">•</span>

        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="size-3.5 text-slate-400" />
          <span>~</span>
          <strong className="text-slate-800 dark:text-slate-200 font-mono">{readingTimeMinutes}</strong>
          <span>min read</span>
        </span>

        {/* Target Progress Bar */}
        {targetWordCount > 0 && words > 0 && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {progressPercent}% target
            </span>
          </div>
        )}
      </div>

      {/* Right Badges */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${depthBadge.color}`}>
          {words >= 300 && <CheckCircle2 className="size-2.5" />}
          <span>{depthBadge.label}</span>
        </span>

        {modeLabel && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <BookOpen className="size-2.5" />
            <span>{modeLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}
