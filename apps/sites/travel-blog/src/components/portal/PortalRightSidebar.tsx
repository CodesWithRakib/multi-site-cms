'use client';

import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass, Eye, Flame, Search, Send, Loader2, Check } from 'lucide-react';
import type { PublicArticle, PublicCategory } from '@/lib/api';
import { subscribeNewsletter } from '@/lib/api';

interface PortalRightSidebarProps {
  categories: PublicCategory[];
  popularArticles: PublicArticle[];
}

export function PortalRightSidebar({ categories, popularArticles }: PortalRightSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subFeedback, setSubFeedback] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setSubStatus('error');
      setSubFeedback('Please enter a valid email.');
      return;
    }

    setSubStatus('loading');
    const res = await subscribeNewsletter(trimmed);
    if (res.success) {
      setSubStatus('success');
      setSubFeedback('Subscribed successfully!');
      setEmail('');
    } else {
      setSubStatus('error');
      setSubFeedback(res.message);
    }
  };

  const displayCategories =
    categories.length > 0
      ? categories.slice(0, 5)
      : [
          { id: '1', name: 'Travel Tips', slug: 'travel-tips', postCount: 24 },
          { id: '2', name: 'Destinations', slug: 'destinations', postCount: 32 },
          { id: '3', name: 'Guides', slug: 'guides', postCount: 18 },
          { id: '4', name: 'Stories', slug: 'stories', postCount: 20 },
        ];

  return (
    <aside className="space-y-6">
      {/* Blog Quick Search */}
      <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-4 shadow-2xs">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            id="portal-search-query"
            name="q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories, tips & places..."
            aria-label="Search blog archive"
            className="w-full rounded-full border border-border/80 bg-background/80 px-4 py-2.5 pr-11 text-xs text-foreground placeholder-muted-foreground transition focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Categories Widget */}
      <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Explore Categories</h3>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <ul className="space-y-1.5">
          {displayCategories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <span>{cat.name}</span>
                <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {cat.postCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular Dispatches Widget */}
      <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Trending Reads</h3>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {popularArticles.slice(0, 3).map((article, idx) => {
            const views = idx === 0 ? '8.2K' : idx === 1 ? '6.5K' : '5.9K';
            return (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-muted/50"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={
                      article.featuredImage?.url ??
                      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={article.title}
                    fill
                    sizes="56px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h4 className="line-clamp-2 text-xs font-bold text-foreground leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Eye className="h-3 w-3 text-emerald-500/70" />
                    <span>{views} reads</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Subscribe to Newsletter Widget */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-background p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <Send className="h-4 w-4" />
          <h3 className="text-sm font-bold">Newsletter Dispatch</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Get weekly curated travel guides, hidden locations and packing checklists in your inbox.
        </p>

        <form onSubmit={handleSubscribe} className="space-y-2">
          <div className="relative flex items-center">
            <input
              id="portal-newsletter-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              aria-label="Newsletter email address"
              disabled={subStatus === 'loading' || subStatus === 'success'}
              required
              className="w-full rounded-full border border-border/80 bg-background/90 px-4 py-2.5 pr-11 text-xs text-foreground placeholder-muted-foreground transition focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={subStatus === 'loading' || subStatus === 'success'}
              aria-label="Submit newsletter subscription"
              className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
            >
              {subStatus === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : subStatus === 'success' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          {subFeedback && (
            <p
              className={`text-xs ${
                subStatus === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-rose-500'
              }`}
              role="status"
            >
              {subFeedback}
            </p>
          )}
        </form>
      </div>
    </aside>
  );
}
