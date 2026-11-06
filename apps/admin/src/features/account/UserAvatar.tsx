import { cn } from '@multi-site-cms/ui';

/** "Ashiqur Rahaman" → "AR". */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return letters.join('') || 'U';
}

interface UserAvatarProps {
  readonly name: string;
  readonly avatarUrl: string | null | undefined;
  readonly className?: string;
}

/** Profile photo when set, otherwise the person's initials. */
export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground',
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- media host varies by storage provider; next/image would need every host allow-listed
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
