import type { ReactNode } from 'react';

import { cn } from '@multi-site-cms/ui';

import { ScenicArt, type ScenicVariant } from '@/components/illustrations/ScenicArt';

interface PageHeaderProps {
  /** Small label above the title, usually an icon plus a word. */
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly description?: string;
  /** Right-aligned fact such as "7 stories". */
  readonly meta?: string;
  readonly scene?: ScenicVariant;
  readonly className?: string;
  readonly children?: ReactNode;
}

/**
 * Compact illustrated header shared by the listing pages. It is deliberately
 * short so the first stories stay above the fold; the artwork sits behind the
 * text, fades out under it, and is hidden from assistive technology.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  scene = 'mountains',
  className,
  children,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-8 lg:p-10',
        className,
      )}
    >
      <ScenicArt
        variant={scene}
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-3/4 opacity-60 mask-[linear-gradient(to_right,transparent,black_55%)] sm:w-3/5 sm:opacity-100 lg:w-1/2"
      />

      <div className="max-w-2xl space-y-3">
        {eyebrow && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl font-extrabold leading-[1.12] tracking-tight text-balance text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        )}
        {meta && <p className="text-xs font-semibold text-primary sm:text-sm">{meta}</p>}
        {children}
      </div>
    </header>
  );
}
