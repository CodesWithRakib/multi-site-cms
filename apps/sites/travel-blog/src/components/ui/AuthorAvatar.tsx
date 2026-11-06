import Image from 'next/image';

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
  /** Profile photo set by the author in the admin; initials when absent. */
  readonly avatarUrl?: string | null;
  readonly className?: string;
}

/**
 * The author's own profile photo (uploaded in the admin), or their initials.
 * Never a stock portrait that would misrepresent who wrote the story.
 */
export function AuthorAvatar({ name, avatarUrl, className }: AuthorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary ring-2 ring-primary/20',
        className,
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        authorInitials(name)
      )}
    </span>
  );
}
