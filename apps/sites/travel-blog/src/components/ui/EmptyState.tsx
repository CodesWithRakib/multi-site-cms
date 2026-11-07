import type { ReactNode } from 'react';

import { cn } from '@multi-site-cms/ui';

import { EmptyStateArt, type EmptyStateArtName } from '@/components/illustrations/EmptyStateArt';

interface EmptyStateProps {
  readonly art: EmptyStateArtName;
  readonly title: string;
  readonly description: string;
  /** Links or buttons that move the reader forward. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/** Illustrated "nothing here" block that always explains what to do next. */
export function EmptyState({ art, title, description, actions, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center sm:py-14',
        className,
      )}
    >
      <EmptyStateArt name={art} className="h-36 w-auto sm:h-44" />
      <h2 className="mt-4 font-serif text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
