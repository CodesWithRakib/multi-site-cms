'use client';

import React from 'react';
import type { SiteItem, PostPublicationItem } from '@multi-site-cms/types';
import { PostSitePublicationCard, type SitePubConfig } from './PostSitePublicationCard';
import { slugifyTitle } from '../utils/slugify';
import type { PublishingActionType } from './PublishingModal';

export interface PostPublicationsSectionProps {
  sites: SiteItem[];
  title: string;
  siteConfigs: Record<string, SitePubConfig>;
  existingPublications?: PostPublicationItem[];
  latestRevisionId?: string;
  onConfigChange: (siteId: string, updated: SitePubConfig) => void;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PostPublicationsSection({
  sites,
  title,
  siteConfigs,
  existingPublications,
  latestRevisionId,
  onConfigChange,
  onOpenPublishModal,
}: PostPublicationsSectionProps) {
  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
          Site Publications
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Publish this canonical post across independent websites with site-specific slugs,
          categories, and SEO configuration.
        </p>
        {existingPublications !== undefined && (
          <p className="mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Autosave keeps your text safe, but a live site only changes when you publish or click
            Update live. Site settings and the featured image are saved with Save Changes.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => {
          const defaultSlug = slugifyTitle(title);
          const existingPub = existingPublications?.find((p) => p.siteId === site.id);
          const currentConfig = siteConfigs[site.id] || {
            enabled: Boolean(existingPub),
            slug: existingPub?.slug || defaultSlug,
            status: existingPub?.status || 'draft',
            categoryIds: existingPub?.categoryIds ?? [],
            eventId: existingPub?.eventId ?? '',
            seoTitle: existingPub?.seoTitle || '',
            seoDescription: existingPub?.seoDescription || '',
          };

          return (
            <PostSitePublicationCard
              key={site.id}
              site={site}
              config={currentConfig}
              existingPub={existingPub}
              latestRevisionId={latestRevisionId}
              onChange={(updated) => onConfigChange(site.id, updated)}
              onOpenPublishModal={onOpenPublishModal}
            />
          );
        })}
      </div>
    </div>
  );
}
