'use client';

import React, { useSyncExternalStore } from 'react';
import { Bookmark } from 'lucide-react';

interface BookmarkButtonProps {
  articleId: string;
  articleTitle?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const STORAGE_KEY = 'travel_blog_saved_articles';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('travel_blog_bookmark_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('travel_blog_bookmark_change', callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '[]';
  } catch {
    return '[]';
  }
}

function getServerSnapshot(): string {
  return '[]';
}

export function BookmarkButton({
  articleId,
  articleTitle,
  className = '',
  size = 'md',
}: BookmarkButtonProps) {
  const savedJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let isSaved = false;
  try {
    const savedIds = JSON.parse(savedJson) as string[];
    isSaved = savedIds.includes(articleId);
  } catch {
    isSaved = false;
  }

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const savedIds = stored ? (JSON.parse(stored) as string[]) : [];

      const updatedIds = savedIds.includes(articleId)
        ? savedIds.filter((id) => id !== articleId)
        : [...savedIds, articleId];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
      window.dispatchEvent(new Event('travel_blog_bookmark_change'));
    } catch {
      // Ignore quota errors
    }
  };

  const iconSizes = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonSizes = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      aria-label={isSaved ? `Remove ${articleTitle || 'article'} from saved` : `Save ${articleTitle || 'article'}`}
      title={isSaved ? 'Saved to bookmarks' : 'Save article'}
      className={`inline-flex items-center justify-center rounded-full border border-border/80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-2xs hover:scale-110 active:scale-95 transition-all cursor-pointer ${buttonSizes} ${
        isSaved
          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100'
      } ${className}`}
    >
      <Bookmark
        className={`${iconSizes} transition-colors ${isSaved ? 'fill-emerald-600 dark:fill-emerald-400' : ''}`}
      />
    </button>
  );
}
