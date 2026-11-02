import Image from 'next/image';
import type { PublicArticleDetail } from '@multi-site-cms/types';

interface ArticleHeroImageProps {
  featuredImage: PublicArticleDetail['featuredImage'];
  title: string;
}

export function ArticleHeroImage({ featuredImage, title }: ArticleHeroImageProps) {
  if (!featuredImage) return null;

  return (
    <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-muted border border-border/80 shadow-md">
      <Image
        src={featuredImage.url}
        alt={featuredImage.altText || title}
        fill
        priority
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-cover"
      />
      {featuredImage.caption && (
        <figcaption className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-3 text-center text-xs text-white">
          {featuredImage.caption}
        </figcaption>
      )}
    </figure>
  );
}

