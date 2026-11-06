import Image from 'next/image';
import Link from 'next/link';

import type { PublicArticleSummary } from '@multi-site-cms/types';

interface CoverStoryAsideProps {
  readonly articles: readonly PublicArticleSummary[];
}

/** "Also new" glass panel on the cover: the next few published stories. */
export function CoverStoryAside({ articles }: CoverStoryAsideProps) {
  return (
    <aside
      aria-labelledby="also-new-heading"
      className="w-full shrink-0 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl motion-safe:animate-rise [animation-delay:400ms] lg:w-80"
    >
      <h2
        id="also-new-heading"
        className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70"
      >
        Also new
      </h2>
      <ul className="divide-y divide-white/10">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/articles/${article.slug}`}
              className="group flex items-center gap-3 rounded-2xl p-2 transition-colors duration-200 hover:bg-white/10"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {article.featuredImage && (
                  <Image
                    src={article.featuredImage.url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                )}
              </span>
              <span className="min-w-0">
                {article.categories[0] && (
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                    {article.categories[0].name}
                  </span>
                )}
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                  {article.title}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
