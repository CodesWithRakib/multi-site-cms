'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import type { DashboardRecentContentItem } from '@multi-site-cms/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Skeleton,
} from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';
import { DashboardEmptyState } from './dashboard-empty-state';

export interface RecentContentProps {
  items: DashboardRecentContentItem[];
  isLoading: boolean;
  isPlatformView: boolean;
}

export function RecentContent({ items, isLoading, isPlatformView }: RecentContentProps) {
  const { t, locale, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 text-[10px] font-semibold"
          >
            {t.status.published}
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/40 text-[10px] font-semibold"
          >
            {t.status.scheduled}
          </Badge>
        );
      case 'draft':
      case 'in_review':
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 text-[10px] font-semibold"
          >
            {status === 'in_review' ? t.status.in_review : t.status.draft}
          </Badge>
        );
      case 'archived':
      default:
        return (
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground text-[10px] font-semibold"
          >
            {t.status.archived}
          </Badge>
        );
    }
  };

  return (
    <Card className="rounded-xl border border-border bg-card shadow-2xs">
      <CardHeader className="p-5 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {t.dashboard.recentContent}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Latest editorial articles and publications
            </CardDescription>
          </div>
          <Link
            href="/posts"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t.dashboard.viewAll}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <DashboardEmptyState
              icon={FileText}
              title={t.dashboard.noContent}
              description="Start drafting articles or guides to publish across your sites."
              actionLabel={t.dashboard.newPost}
              actionHref="/posts/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Title</TableHead>
                  {isPlatformView && <TableHead className="text-xs font-semibold">Site</TableHead>}
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Updated</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-border/40 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-medium text-xs max-w-xs truncate">
                      <Link
                        href={`/posts/${item.postId}/edit`}
                        className="hover:text-primary transition-colors font-semibold text-foreground block truncate"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate">
                        /{item.slug}
                      </span>
                    </TableCell>

                    {isPlatformView && (
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {item.siteName}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell className="text-xs capitalize text-muted-foreground">
                      {item.type.replace(/_/g, ' ')}
                    </TableCell>

                    <TableCell className="text-xs">{renderStatusBadge(item.status)}</TableCell>

                    <TableCell className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                      {formatDateTime(item.updatedAt, locale, timezone)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/posts/${item.postId}/edit`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {t.actions.edit}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
