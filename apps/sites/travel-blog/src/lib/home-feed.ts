import type { PublicArticleSummary, PublicCategoryItem } from '@multi-site-cms/types';

export interface TopicCard {
  readonly category: PublicCategoryItem;
  /** Featured image of the newest story in this topic, if any has one. */
  readonly image: PublicArticleSummary['featuredImage'];
}

export interface HomeFeed {
  /** Hero slides: the newest stories that have a cover image. */
  readonly slides: PublicArticleSummary[];
  readonly latest: PublicArticleSummary[];
  readonly more: PublicArticleSummary[];
  readonly topics: TopicCard[];
}

const SLIDES = 4;
const LATEST = 5;
const MORE = 6;
const TOPICS = 4;

/**
 * Splits the newest published stories into the home page slots without
 * repeating a story. The hero is built around images, so it takes the newest
 * stories that have one (falling back to the newest story when none do).
 */
export function buildHomeFeed(
  articles: readonly PublicArticleSummary[],
  categories: readonly PublicCategoryItem[],
): HomeFeed {
  const withImage = articles.filter((article) => article.featuredImage).slice(0, SLIDES);
  const slides = withImage.length > 0 ? withImage : articles.slice(0, 1);
  const rest = articles.filter((article) => !slides.includes(article));

  const topics = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, TOPICS)
    .map((category) => ({
      category,
      image:
        articles.find(
          (article) =>
            article.featuredImage && article.categories.some((c) => c.id === category.id),
        )?.featuredImage ?? null,
    }));

  return {
    slides,
    latest: rest.slice(0, LATEST),
    more: rest.slice(LATEST, LATEST + MORE),
    topics,
  };
}
