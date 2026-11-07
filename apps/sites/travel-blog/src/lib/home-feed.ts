import type { PublicArticleSummary, PublicCategoryItem } from '@multi-site-cms/types';

import { assignTopicImages } from './topic-images';

export interface TopicCard {
  readonly category: PublicCategoryItem;
  /** Featured image of the newest story in this topic, if any has one. */
  readonly image: PublicArticleSummary['featuredImage'];
}

export interface HomeFeed {
  /** Hero slides: the newest stories that have a cover image. */
  readonly slides: PublicArticleSummary[];
  readonly latest: PublicArticleSummary[];
  /** One story given room to breathe: large cover, excerpt, byline. */
  readonly spotlight: PublicArticleSummary | null;
  readonly more: PublicArticleSummary[];
  /** Destination guides for the trip-planning rail; may repeat a story shown elsewhere. */
  readonly guides: PublicArticleSummary[];
  /** Cover photos for the mosaic; may repeat a story shown elsewhere. */
  readonly photos: PublicArticleSummary[];
  readonly topics: TopicCard[];
}

const SLIDES = 4;
const LATEST = 6;
const MORE = 9;
const GUIDES = 8;
const PHOTOS = 7;
const TOPICS = 8;

/**
 * Splits the newest published stories into the home page slots. The hero,
 * latest, spotlight and "more" slots never repeat a story; the guides rail and
 * the photo mosaic are themed views and may. The hero is built around images,
 * so it takes the newest stories that have one (falling back to the newest
 * story when none do), and the spotlight prefers a story with an image too.
 */
export function buildHomeFeed(
  articles: readonly PublicArticleSummary[],
  categories: readonly PublicCategoryItem[],
): HomeFeed {
  const withImage = articles.filter((article) => article.featuredImage).slice(0, SLIDES);
  const slides = withImage.length > 0 ? withImage : articles.slice(0, 1);
  const afterHero = articles.filter((article) => !slides.includes(article));

  const latest = afterHero.slice(0, LATEST);
  const afterLatest = afterHero.slice(LATEST);

  const spotlight = afterLatest.find((article) => article.featuredImage) ?? afterLatest[0] ?? null;
  const more = afterLatest.filter((article) => article !== spotlight).slice(0, MORE);

  const topCategories = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, TOPICS);
  const images = assignTopicImages(articles, topCategories);
  const topics = topCategories.map((category): TopicCard => ({
    category,
    image: images.get(category.id) ?? null,
  }));

  return {
    slides,
    latest,
    spotlight,
    more,
    guides: articles.filter((article) => article.type === 'travel_guide').slice(0, GUIDES),
    photos: articles.filter((article) => article.featuredImage).slice(0, PHOTOS),
    topics,
  };
}
