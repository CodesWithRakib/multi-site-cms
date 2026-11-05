'use client';

import { AlertCircle, Archive, Clock, ExternalLink, Globe } from 'lucide-react';
import type { PostPublicationItem, SiteItem } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';

const NEUTRAL_BADGE =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

interface PostStatusCellProps {
  readonly status: string;
  readonly publication: PostPublicationItem | undefined;
  readonly site: SiteItem | undefined;
  readonly liveUrl: string | null;
}

export function PostStatusCell({ status, publication, site, liveUrl }: PostStatusCellProps) {
  const { t, locale, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  if (status === 'published') {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>{t.status.published}</span>
        </span>
        {site && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Globe className="size-3" aria-hidden="true" />
            <span>{site.name}</span>
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 ml-1 font-semibold"
              >
                <span>{t.content.liveSite || 'Live'}</span>
                <ExternalLink className="size-2.5" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === 'scheduled') {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
          <Clock className="size-3" aria-hidden="true" />
          <span>{t.status.scheduled}</span>
        </span>
        {publication?.scheduledFor && (
          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-mono">
            {formatDateTime(publication.scheduledFor, locale, timezone)}
          </span>
        )}
      </div>
    );
  }

  if (status === 'in_review') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
        <AlertCircle className="size-3" aria-hidden="true" />
        <span>{t.status.in_review}</span>
      </span>
    );
  }

  if (status === 'archived') {
    return (
      <span className={NEUTRAL_BADGE}>
        <Archive className="size-3" aria-hidden="true" />
        <span>{t.status.archived}</span>
      </span>
    );
  }

  return (
    <span className={NEUTRAL_BADGE}>
      <Clock className="size-3" aria-hidden="true" />
      <span>{t.status.draft}</span>
    </span>
  );
}
