'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, Clock, Trash2, X, Compass, ExternalLink } from 'lucide-react';
import {
  clearAllSavedArticles,
  getSavedArticles,
  removeArticle,
  type SavedArticle,
} from '@/lib/bookmarks';

interface SavedArticlesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    return JSON.stringify(getSavedArticles());
  } catch {
    return '[]';
  }
}

function getServerSnapshot(): string {
  return '[]';
}

export function SavedArticlesDrawer({ isOpen, onClose }: SavedArticlesDrawerProps) {
  const savedArticlesJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let articles: SavedArticle[] = [];
  try {
    articles = JSON.parse(savedArticlesJson) as SavedArticle[];
  } catch {
    articles = [];
  }

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-articles-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bookmark className="h-5 w-5 fill-emerald-600 dark:fill-emerald-400" />
            </div>
            <div>
              <h2
                id="saved-articles-title"
                className="font-serif text-lg font-bold text-foreground"
              >
                Saved Dispatches
              </h2>
              <p className="text-xs text-muted-foreground">
                {articles.length} {articles.length === 1 ? 'story' : 'stories'} bookmarked
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved articles panel"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar (Clear All) */}
        {articles.length > 0 && (
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-2.5 text-xs text-muted-foreground">
            <span>Saved in your browser</span>
            <button
              type="button"
              onClick={clearAllSavedArticles}
              className="text-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {articles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60 text-muted-foreground">
                <Compass className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                Your collection is empty
              </h3>
              <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
                Tap the bookmark icon on any dispatch or destination to save it for reading later.
              </p>
              <Link
                href="/articles"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <span>Browse Dispatches</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            articles.map((item) => (
              <div
                key={item.id}
                className="group relative flex gap-3.5 rounded-2xl border border-border/70 bg-background/60 p-3.5 transition-all hover:border-emerald-500/40 hover:shadow-xs"
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.featuredImageUrl ? (
                    <Image
                      src={item.featuredImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-emerald-600">
                      <Bookmark className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between min-w-0 pr-6">
                  <div>
                    {item.categoryName && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {item.categoryName}
                      </span>
                    )}
                    <h4 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                      <Link href={`/articles/${item.slug}`} onClick={onClose}>
                        {item.title}
                      </Link>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    {item.readingTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.readingTimeMinutes} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeArticle(item.id)}
                  aria-label={`Remove ${item.title} from bookmarks`}
                  className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
