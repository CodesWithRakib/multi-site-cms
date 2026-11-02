'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Globe } from 'lucide-react';
import type { PostPublicationItem, PublicationStatus, SiteItem } from '@multi-site-cms/types';
import { useListCategoriesQuery } from '@/lib/cms-api';
import type { PublishingActionType } from './PublishingModal';

export interface SitePubConfig {
  enabled: boolean;
  slug: string;
  status: PublicationStatus;
  scheduledFor?: string;
  categoryIds: string[];
  seoTitle: string;
  seoDescription: string;
}

interface PostSitePublicationCardProps {
  site: SiteItem;
  config: SitePubConfig;
  existingPub?: PostPublicationItem;
  onChange: (updated: SitePubConfig) => void;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PostSitePublicationCard({
  site,
  config,
  existingPub,
  onChange,
  onOpenPublishModal,
}: PostSitePublicationCardProps) {
  const { data: categories = [] } = useListCategoriesQuery(site.id, {
    skip: !config.enabled,
  });

  const getPublicSiteUrl = (siteKey: string, slug: string) => {
    if (siteKey === 'air-sports') return `http://localhost:5002/articles/${slug}`;
    if (siteKey === 'travel-blog') return `http://localhost:5001/articles/${slug}`;
    return `http://localhost:5001/articles/${slug}`;
  };

  return (
    <div
      className={`flex flex-col p-5 rounded-2xl border transition-all ${
        config.enabled
          ? 'border-emerald-500/70 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs'
          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
      }`}
    >
      {/* Site Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
        <label className="flex items-center gap-2.5 font-bold text-sm cursor-pointer text-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="size-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="flex items-center gap-1.5">
            <Globe className="size-4 text-emerald-500" />
            {site.name}
          </span>
        </label>
        <div className="flex items-center gap-2">
          {existingPub && existingPub.status === 'published' && (
            <Link
              href={getPublicSiteUrl(site.key, existingPub.slug)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>View Live</span>
              <ExternalLink className="size-3" />
            </Link>
          )}
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
            {site.key}
          </span>
        </div>
      </div>

      {config.enabled && (
        <div className="flex flex-col gap-3.5 pt-4 text-xs">
          {/* Slug */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              URL Slug *
            </label>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-slate-400">/articles/</span>
              <input
                type="text"
                required
                value={config.slug}
                onChange={(e) =>
                  onChange({
                    ...config,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, '-')
                      .replace(/^-|-$/g, ''),
                  })
                }
                className="flex-1 px-3 py-1.5 border rounded-lg border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Categories for this site */}
          {categories.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category ({site.name})
              </label>
              <select
                value={config.categoryIds[0] || ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    categoryIds: e.target.value ? [e.target.value] : [],
                  })
                }
                className="w-full px-3 py-1.5 border rounded-lg border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Initial Publication State */}
          {!existingPub && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Publication State
                </label>
                <select
                  value={config.status}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      status: e.target.value as PublicationStatus,
                    })
                  }
                  className="w-full px-3 py-1.5 border rounded-lg border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="published">Publish Immediately</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>

              {config.status === 'scheduled' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={config.scheduledFor || ''}
                    onChange={(e) => onChange({ ...config, scheduledFor: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* SEO Override */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              SEO Title Override (Optional)
            </label>
            <input
              type="text"
              value={config.seoTitle}
              onChange={(e) => onChange({ ...config, seoTitle: e.target.value })}
              placeholder="Site-specific headline for Google search"
              className="w-full px-3 py-1.5 border rounded-lg border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Existing Publication Lifecycle Controls */}
          {existingPub && (
            <div className="mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    existingPub.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : existingPub.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : existingPub.status === 'in_review'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {existingPub.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {existingPub.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => onOpenPublishModal(existingPub, 'publish')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Publish Now
                  </button>
                )}

                {existingPub.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => onOpenPublishModal(existingPub, 'schedule')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Schedule
                  </button>
                )}

                {existingPub.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => onOpenPublishModal(existingPub, 'reschedule')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Reschedule
                  </button>
                )}

                {existingPub.status === 'published' && (
                  <button
                    type="button"
                    onClick={() => onOpenPublishModal(existingPub, 'unpublish')}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
