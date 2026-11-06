import type { PublicArticleSummary, PublicCategoryItem } from '@multi-site-cms/types';

export interface TopicCard {
  readonly category: PublicCategoryItem;
  /** Featured image of the newest story in this topic, if any has one. */
  readonly image: PublicArticleSummary['featuredImage'];
}

export interface HomeFeed {
  readonly lead: PublicArticleSummary | undefined;
  readonly alsoNew: PublicArticleSummary[];
  readonly latest: PublicArticleSummary[];
  readonly more: PublicArticleSummary[];
  readonly topics: TopicCard[];
}

const ALSO_NEW = 3;
const LATEST = 5;
const MORE = 6;
const TOPICS = 4;

/**
 * Splits the newest published stories into the home page slots without
 * repeating a story. The cover prefers the newest story that has an image,
 * because the cover is built around it.
 */
export function buildHomeFeed(
  articles: readonly PublicArticleSummary[],
  categories: readonly PublicCategoryItem[],
): HomeFeed {
  const lead = articles.find((article) => article.featuredImage) ?? articles[0];
  const rest = articles.filter((article) => article !== lead);

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
    lead,
    alsoNew: rest.slice(0, ALSO_NEW),
    latest: rest.slice(ALSO_NEW, ALSO_NEW + LATEST),
    more: rest.slice(ALSO_NEW + LATEST, ALSO_NEW + LATEST + MORE),
    topics,
  };
}
