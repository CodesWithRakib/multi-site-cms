import { cn } from '@multi-site-cms/ui';

/** Placeholder with the same shape as `ArticleCard` (row on phones, card from `sm`). */
export function ArticleCardSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex gap-4 overflow-hidden rounded-3xl border border-border/80 bg-card p-3',
        'sm:flex-col sm:gap-0 sm:p-0',
        className,
      )}
    >
      <div className="size-28 shrink-0 animate-pulse rounded-2xl bg-foreground/10 sm:aspect-16/10 sm:size-auto sm:w-full sm:rounded-none" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 sm:p-5">
        <div className="h-3 w-20 animate-pulse rounded-full bg-foreground/10" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-foreground/10" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-foreground/10" />
        </div>
        <div className="hidden space-y-2 sm:block">
          <div className="h-3 w-full animate-pulse rounded-full bg-foreground/10" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-foreground/10" />
        </div>
        <div className="mt-1 h-3 w-28 animate-pulse rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}
