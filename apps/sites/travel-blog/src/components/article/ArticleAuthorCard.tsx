import Image from 'next/image';
import { Compass } from 'lucide-react';
import type { PublicArticleDetail } from '@multi-site-cms/types';
import { PillButton } from '@/components/ui/PillButton';

interface ArticleAuthorCardProps {
  author: PublicArticleDetail['author'];
}

export function ArticleAuthorCard({ author }: ArticleAuthorCardProps) {
  const authorName = author?.displayName || 'Rakib Islam';

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs">
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/30">
        <Image
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
          alt={authorName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="space-y-2 text-center sm:text-left flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">{authorName}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Compass className="h-3 w-3" /> Senior Travel Explorer & Storyteller
            </p>
          </div>

          <PillButton
            href="/about"
            size="sm"
            variant="outline"
            className="self-center sm:self-auto text-xs"
          >
            View Author Bio
          </PillButton>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Exploring high-altitude trails, hidden archipelagos, and ancient cultures. Writing
          field-tested dispatches and itineraries designed to inspire mindful, conscious travel.
        </p>
      </div>
    </section>
  );
}
