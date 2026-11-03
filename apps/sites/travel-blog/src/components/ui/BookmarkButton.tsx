'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import {
  isArticleSaved,
  removeArticle,
  saveArticle,
} from '@/lib/bookmarks';

export interface BookmarkButtonProps {
  articleId: string;
  articleSlug?: string;
  articleTitle?: string;
  featuredImageUrl?: string | null;
  categoryName?: string | null;
  readingTimeMinutes?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function BookmarkButton({
  articleId,
  articleSlug,
  articleTitle,
  featuredImageUrl,
  categoryName,
  readingTimeMinutes,
  className = '',
  size = 'md',
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const checkSaved = () => {
      setIsSaved(
        isArticleSaved(articleId) ||
          (Boolean(articleSlug) && isArticleSaved(articleSlug ?? '')),
      );
    };

    checkSaved();
    window.addEventListener('storage', checkSaved);
    window.addEventListener('travel_blog_bookmark_change', checkSaved);
    return () => {
      window.removeEventListener('storage', checkSaved);
      window.removeEventListener('travel_blog_bookmark_change', checkSaved);
    };
  }, [articleId, articleSlug]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      removeArticle(articleId);
    } else {
      saveArticle({
        id: articleId,
        slug: articleSlug || articleId,
        title: articleTitle || 'Travel Dispatch',
        featuredImageUrl: featuredImageUrl ?? null,
        categoryName: categoryName ?? null,
        readingTimeMinutes,
      });
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
