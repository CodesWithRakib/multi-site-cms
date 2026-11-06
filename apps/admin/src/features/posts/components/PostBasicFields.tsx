'use client';

import React from 'react';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';

const FIELD_SELECT_CLASS =
  'px-3 py-2 text-sm rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:border-emerald-400 focus:ring-emerald-400/20';

const POST_TYPE_OPTIONS: NativeSelectOption[] = [
  { value: 'article', label: 'Standard Article' },
  { value: 'guide', label: 'Travel Destination Guide' },
  { value: 'air_sports_update', label: 'Air Sports Update' },
  { value: 'event_update', label: 'Event Update' },
  { value: 'news', label: 'News Flash' },
  { value: 'live_update', label: 'Live Stream Update' },
];

const LOCALE_OPTIONS: NativeSelectOption[] = [
  { value: 'en', label: 'English (en)' },
  { value: 'bn', label: 'Bengali (bn)' },
];

interface PostBasicFieldsProps {
  title: string;
  onTitleChange: (title: string) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  sourceLocale: string;
  onLocaleChange: (locale: string) => void;
}

export function PostBasicFields({
  title,
  onTitleChange,
  excerpt,
  onExcerptChange,
  type,
  onTypeChange,
  sourceLocale,
  onLocaleChange,
}: PostBasicFieldsProps) {
  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
      {/* Title Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="post-title-input"
            className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Post Title *
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {title.length} / 255
          </span>
        </div>
        <input
          id="post-title-input"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter an engaging, descriptive title..."
          className="w-full px-4 py-3 text-lg font-bold border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-sans"
        />
      </div>

      {/* Summary / Excerpt Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="post-excerpt-input"
            className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Summary / Excerpt
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {excerpt.length} / 1000
          </span>
        </div>
        <textarea
          id="post-excerpt-input"
          rows={3}
          maxLength={1000}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="Short lead paragraph or social summary for cards and search snippets..."
          className="w-full px-4 py-2.5 text-sm border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-sans resize-y"
        />
      </div>

      {/* Secondary Meta Row: Type & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="post-type-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
          >
            Content Type
          </label>
          <NativeSelect
            id="post-type-select"
            value={type}
            onValueChange={onTypeChange}
            options={POST_TYPE_OPTIONS}
            className={FIELD_SELECT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="post-locale-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
          >
            Primary Language
          </label>
          <NativeSelect
            id="post-locale-select"
            value={sourceLocale}
            onValueChange={onLocaleChange}
            options={LOCALE_OPTIONS}
            className={FIELD_SELECT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
