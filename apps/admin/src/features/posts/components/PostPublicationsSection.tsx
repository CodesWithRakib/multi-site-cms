'use client';

import React from 'react';
import type { SiteItem, PostPublicationItem } from '@multi-site-cms/types';
import { PostSitePublicationCard, type SitePubConfig } from './PostSitePublicationCard';
import type { PublishingActionType } from './PublishingModal';

export interface PostPublicationsSectionProps {
  sites: SiteItem[];
  title: string;
  siteConfigs: Record<string, SitePubConfig>;
  existingPublications?: PostPublicationItem[];
  onConfigChange: (siteId: string, updated: SitePubConfig) => void;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PostPublicationsSection({
  sites,
  title,
  siteConfigs,
  existingPublications,
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => {
          const defaultSlug = (title || 'post-slug')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const existingPub = existingPublications?.find((p) => p.siteId === site.id);
          const currentConfig = siteConfigs[site.id] || {
            enabled: Boolean(existingPub),
            slug: existingPub?.slug || defaultSlug,
            status: existingPub?.status || 'draft',
            categoryIds: [],
            seoTitle: existingPub?.seoTitle || '',
            seoDescription: existingPub?.seoDescription || '',
          };

          return (
            <PostSitePublicationCard
              key={site.id}
              site={site}
              config={currentConfig}
              existingPub={existingPub}
              onChange={(updated) => onConfigChange(site.id, updated)}
              onOpenPublishModal={onOpenPublishModal}
            />
          );
        })}
      </div>
    </div>
  );
}
