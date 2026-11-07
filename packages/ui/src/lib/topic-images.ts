import type { PublicArticleImage, PublicArticleSummary } from '@multi-site-cms/types';

/**
 * Picks a cover image for each topic from its newest stories. A story often sits
 * in several topics, so an image no earlier topic already shows is preferred;
 * the same photo is only repeated when a topic has nothing else.
 *
 * Topics are processed in the given order, so pass them in display order.
 */
export function assignTopicImages(
  articles: readonly PublicArticleSummary[],
  topics: readonly { readonly id: string }[],
): Map<string, PublicArticleImage | null> {
  const used = new Set<string>();
  const result = new Map<string, PublicArticleImage | null>();

  for (const topic of topics) {
    const inTopic = articles.filter(
      (article) => article.featuredImage && article.categories.some((c) => c.id === topic.id),
    );
    const fresh = inTopic.find((article) => !used.has(article.featuredImage?.id ?? ''));
    const image = (fresh ?? inTopic[0])?.featuredImage ?? null;
    if (image) used.add(image.id);
    result.set(topic.id, image);
  }

  return result;
}
