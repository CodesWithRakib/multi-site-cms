'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@multi-site-cms/ui';

export interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/40 my-2">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">{description}</p>
      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <Button size="sm" variant="outline" asChild className="rounded-xl text-xs h-8">
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : onAction ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onAction}
              className="rounded-xl text-xs h-8"
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
