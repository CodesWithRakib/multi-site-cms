import { Layers } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

/** Decorative platform mark: the layers glyph on a themed brand disc. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/30 [&_svg]:size-1/2',
        className,
      )}
    >
      <Layers strokeWidth={2.25} />
    </span>
  );
}
