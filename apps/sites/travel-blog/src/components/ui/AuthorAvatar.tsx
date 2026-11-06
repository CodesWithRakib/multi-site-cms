import { cn } from '@multi-site-cms/ui';

/** "Super Admin" → "SA". Never more than two letters. */
export function authorInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

interface AuthorAvatarProps {
  readonly name: string;
  readonly className?: string;
}

/**
 * Initials avatar. Authors have no photo field in the CMS, so we never show
 * a stock portrait that would misrepresent who wrote the story.
 */
export function AuthorAvatar({ name, className }: AuthorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-primary/20',
        className,
      )}
    >
      {authorInitials(name)}
    </span>
  );
}
