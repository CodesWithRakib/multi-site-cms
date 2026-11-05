'use client';

import { useMemo, useState } from 'react';
import type { SiteStatus } from '@multi-site-cms/types';

import {
  useGetAnalyticsOverviewQuery,
  useGetPostStatsQuery,
  useListSitesQuery,
} from '@/lib/cms-api';

import { filterSites, sitesRegistryStats } from '../utils/sites-registry';

/** Views are reported over this window on the cards. */
export const REGISTRY_VIEWS_DAYS = 30;

/**
 * Data of the site registry. Every number comes from the API: site and domain
 * counts from the site list, published posts from `GET /posts/stats`, views
 * from analytics (real page views only).
 */
export function useSitesRegistry() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SiteStatus | ''>('');

  const { data: sites = [], isLoading, isFetching, refetch } = useListSitesQuery();
  const { data: postCounts, isLoading: isPostCountsLoading } = useGetPostStatsQuery();
  const { data: analytics } = useGetAnalyticsOverviewQuery({ days: REGISTRY_VIEWS_DAYS });

  const stats = useMemo(() => sitesRegistryStats(sites), [sites]);
  const visibleSites = useMemo(() => filterSites(sites, status, search), [sites, status, search]);
  const viewsBySite = useMemo(
    () => new Map((analytics?.sitePerformance ?? []).map((row) => [row.siteId, row.pageViews])),
    [analytics?.sitePerformance],
  );

  return {
    sites,
    visibleSites,
    stats,
    publishedPosts: postCounts?.byStatus.published ?? 0,
    isPostCountsLoading,
    /** Undefined while analytics has not loaded (shown as "—", never as 0). */
    viewsFor: (siteId: string): number | undefined =>
      analytics ? (viewsBySite.get(siteId) ?? 0) : undefined,
    isLoading,
    isFetching,
    refetch,
    search,
    setSearch,
    status,
    setStatus,
    hasFilters: Boolean(search || status),
    clearFilters: () => {
      setSearch('');
      setStatus('');
    },
  };
}

export type SitesRegistry = ReturnType<typeof useSitesRegistry>;
