'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { getSavedArticles } from '@/lib/bookmarks';
import { SavedArticlesDrawer } from './SavedArticlesDrawer';

export function BookmarkNavTrigger() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setCount(getSavedArticles().length);
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('travel_blog_bookmark_change', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('travel_blog_bookmark_change', updateCount);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Open saved articles (${count} saved)`}
        title="Saved Dispatches"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs hover:scale-105"
      >
        <Bookmark className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-2xs animate-in zoom-in-50 duration-150">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <SavedArticlesDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
