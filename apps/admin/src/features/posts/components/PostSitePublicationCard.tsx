'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Globe } from 'lucide-react';
import type { PostPublicationItem, PublicationStatus, SiteItem } from '@multi-site-cms/types';
import { NativeSelect } from '@multi-site-cms/ui';
import { useListCategoriesQuery, useListEventsQuery } from '@/lib/cms-api';
import type { PublishingActionType } from './PublishingModal';
import { PublicationStatusActions } from './PublicationStatusActions';
import { publicationLiveUrl } from '../utils/post-display';

export interface SitePubConfig {
  enabled: boolean;
  slug: string;
  status: PublicationStatus;
  scheduledFor?: string;
  categoryIds: string[];
  /** Linked event on this site; '' when none. */
  eventId: string;
  seoTitle: string;
  seoDescription: string;
}

interface PostSitePublicationCardProps {
  site: SiteItem;
  latestRevisionId?: string;
  config: SitePubConfig;
  existingPub?: PostPublicationItem;
  onChange: (updated: SitePubConfig) => void;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PostSitePublicationCard({
  site,
  latestRevisionId,
  config,
  existingPub,
  onChange,
  onOpenPublishModal,
}: PostSitePublicationCardProps) {
  const { data: categories = [] } = useListCategoriesQuery(site.id, {
    skip: !config.enabled,
  });

  const { data: events = [] } = useListEventsQuery(site.id, { skip: !config.enabled });

  const liveUrl = publicationLiveUrl(site, existingPub ?? undefined);

  return (
    <div
      className={`flex min-w-0 flex-col p-4 sm:p-5 rounded-2xl border transition ${
        config.enabled
          ? 'border-emerald-500/70 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs'
          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
      }`}
    >
      {/* Site Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
        <label className="flex items-center gap-2.5 font-bold text-sm cursor-pointer text-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="size-4 rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
          />
          <span className="flex items-center gap-1.5">
            <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
            {site.name}
          </span>
        </label>
        <div className="flex items-center gap-2">
          {existingPub && existingPub.status === 'published' && liveUrl && (
            <Link
              href={liveUrl}
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
              <span className="text-slate-500 dark:text-slate-400">/articles/</span>
              <input
                type="text"
                required
                value={config.slug}
                onChange={(e) =>
                  onChange({
                    ...config,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="my-post-title"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Categories
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const selected = config.categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const nextIds = selected
                          ? config.categoryIds.filter((id) => id !== cat.id)
                          : [...config.categoryIds, cat.id];
                        onChange({ ...config, categoryIds: nextIds });
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event link (only offered when the site has events) */}
          {events.length > 0 && (
            <div>
              <label
                htmlFor={`pub-event-${site.id}`}
                className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1"
              >
                Reports on event
              </label>
              <NativeSelect
                id={`pub-event-${site.id}`}
                value={config.eventId}
                onValueChange={(eventId) => onChange({ ...config, eventId })}
                options={[
                  { value: '', label: 'No event' },
                  ...events.map((event) => ({ value: event.id, label: event.name })),
                ]}
                className="w-full px-3 py-1.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          {/* SEO Metadata Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Site SEO Title
              </label>
              <input
                type="text"
                value={config.seoTitle}
                onChange={(e) => onChange({ ...config, seoTitle: e.target.value })}
                placeholder="Custom title for this site..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Site SEO Description
              </label>
              <input
                type="text"
                value={config.seoDescription}
                onChange={(e) => onChange({ ...config, seoDescription: e.target.value })}
                placeholder="Custom description..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Live Publication Status & Quick Actions */}
          {existingPub && (
            <PublicationStatusActions
              pub={existingPub}
              latestRevisionId={latestRevisionId}
              onOpenPublishModal={onOpenPublishModal}
            />
          )}
        </div>
      )}
    </div>
  );
}
