import Image from 'next/image';
import { Wind } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

interface DispatchVisualProps {
  readonly article: PublicArticleSummary;
  readonly sizes: string;
  readonly className?: string;
}

/**
 * Featured image of a dispatch, or a branded sky gradient when the editor
 * did not attach one (never a stock photo pretending to be the story).
 */
export function DispatchVisual({ article, sizes, className }: DispatchVisualProps) {
  return (
    <div className={cn('relative overflow-hidden bg-neutral-900', className)}>
      {article.featuredImage ? (
        <Image
          src={article.featuredImage.url}
          alt={article.featuredImage.altText || ''}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-500)_0%,transparent_60%),linear-gradient(to_bottom,var(--color-brand-950),var(--color-neutral-950))]"
        >
          <Wind className="size-10 text-white/30" />
        </div>
      )}
    </div>
  );
}
