import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface StatusPageProps {
  /** Short status marker shown above the title, e.g. `404`. */
  readonly code?: string;
  readonly title: string;
  readonly description: string;
  /** Primary and secondary actions, typically `Button` elements or links. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * Full-width status message for route boundaries (`not-found`, `error`).
 * Presentation only: no data access and no client state, so it renders in
 * Server and Client Components alike. Colors come from semantic tokens, so
 * each site keeps its own branding.
 */
export function StatusPage({ code, title, description, actions, className }: StatusPageProps) {
  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28',
        className,
      )}
    >
      {code ? (
        <p className="font-mono text-sm font-semibold tracking-widest text-primary">{code}</p>
      ) : null}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      {actions ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : null}
    </section>
  );
}
