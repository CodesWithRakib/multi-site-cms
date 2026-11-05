import { cn } from '../lib/cn';

export interface SkipLinkProps {
  /** id of the main content element (which needs tabIndex={-1} to take focus). */
  readonly targetId?: string;
  readonly label?: string;
  readonly className?: string;
}

/**
 * First focusable element on every page: lets keyboard and screen-reader users
 * jump past the header and navigation (WCAG 2.4.1 Bypass Blocks). Invisible
 * until it receives keyboard focus.
 */
export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg',
        className,
      )}
    >
      {label}
    </a>
  );
}
