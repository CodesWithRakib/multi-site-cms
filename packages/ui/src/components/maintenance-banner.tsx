import { cn } from '../lib/cn';

export interface MaintenanceBannerProps {
  /** Notice in the site's primary language (English). */
  readonly notice: string;
  /** Optional Bangla notice, rendered with `lang="bn"`. */
  readonly noticeBn?: string;
  readonly className?: string;
}

/**
 * Site-wide notice shown while the platform is in maintenance mode
 * (admin: Settings → Maintenance). Informational, not blocking: published
 * content stays readable. A polite live region, so it is announced once.
 */
export function MaintenanceBanner({ notice, noticeBn, className }: MaintenanceBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
        className,
      )}
    >
      <p>{notice}</p>
      {noticeBn ? (
        <p lang="bn" className="mt-0.5">
          {noticeBn}
        </p>
      ) : null}
    </div>
  );
}
