/** Placeholder with the shape of a standard `AirSportsCard`. */
export function DispatchSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
    >
      <div className="aspect-video w-full animate-pulse bg-foreground/10" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-foreground/10" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-foreground/10" />
          <div className="h-4 w-3/5 animate-pulse rounded-full bg-foreground/10" />
        </div>
        <div className="h-3 w-full animate-pulse rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}
