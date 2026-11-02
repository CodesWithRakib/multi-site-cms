'use client';

import React from 'react';

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
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Post Title *
          </label>
          <span className="text-[11px] text-slate-400 font-mono">{title.length} / 255</span>
        </div>
        <input
          id="post-title-input"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter an engaging, descriptive title..."
          className="w-full px-4 py-3 text-lg font-bold border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-sans"
        />
      </div>

      {/* Summary / Excerpt Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="post-excerpt-input"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Summary / Excerpt
          </label>
          <span className="text-[11px] text-slate-400 font-mono">{excerpt.length} / 1000</span>
        </div>
        <textarea
          id="post-excerpt-input"
          rows={3}
          maxLength={1000}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="Short lead paragraph or social summary for cards and search snippets..."
          className="w-full px-4 py-2.5 text-sm border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-sans resize-y"
        />
      </div>

      {/* Secondary Meta Row: Type & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="post-type-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
          >
            Content Type
          </label>
          <select
            id="post-type-select"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-pointer"
          >
            <option value="article">Standard Article</option>
            <option value="guide">Travel Destination Guide</option>
            <option value="air_sports_update">Air Sports Update</option>
            <option value="event_update">Event Update</option>
            <option value="news">News Flash</option>
            <option value="live_update">Live Stream Update</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="post-locale-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
          >
            Primary Language
          </label>
          <select
            id="post-locale-select"
            value={sourceLocale}
            onChange={(e) => onLocaleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-pointer"
          >
            <option value="en">English (en)</option>
            <option value="bn">Bengali (bn)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

