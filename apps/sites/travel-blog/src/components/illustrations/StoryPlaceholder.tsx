import { ScenicArt, sceneFor } from './ScenicArt';

/**
 * Stands in for a missing cover photo: an illustrated landscape on a soft sky,
 * never a stock photo that could misrepresent the place. Fills its parent.
 */
export function StoryPlaceholder({ seed }: { readonly seed: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative size-full overflow-hidden bg-linear-to-b from-primary/10 via-primary/5 to-card"
    >
      <ScenicArt variant={sceneFor(seed)} className="absolute inset-0 size-full" />
    </div>
  );
}
