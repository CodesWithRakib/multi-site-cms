import type {
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventSummary,
} from '@multi-site-cms/types';
import { assignTopicImages } from '@multi-site-cms/ui';

import { upcomingEvents } from './format';

export interface DisciplineCard {
  readonly category: PublicCategoryItem;
  /** Cover of the newest dispatch in this discipline, if any has one. */
  readonly image: PublicArticleSummary['featuredImage'];
}

/** Figures for the telemetry strip, all counted from CMS data. */
export interface HomeStats {
  readonly dispatches: number;
  readonly liveEvents: number;
  readonly upcomingEvents: number;
  readonly disciplines: number;
}

export interface HomeFeed {
  /** The opening dispatch: the newest one with an image. */
  readonly lead: PublicArticleSummary | undefined;
  /** The big card and "wire" beside it. */
  readonly top: PublicArticleSummary[];
  /** Further dispatches in the closing grid. */
  readonly more: PublicArticleSummary[];
  readonly disciplines: DisciplineCard[];
  /** Live events first, then the soonest scheduled. */
  readonly schedule: PublicEventSummary[];
  readonly stats: HomeStats;
}

const TOP_BLOCK = 7;
const MORE = 6;
const DISCIPLINES = 8;
const SCHEDULE = 5;

interface HomeFeedInput {
  readonly articles: readonly PublicArticleSummary[];
  /** Every published dispatch, not just the ones loaded here. */
  readonly totalDispatches: number;
  readonly categories: readonly PublicCategoryItem[];
  readonly events: readonly PublicEventSummary[];
}

/**
 * Splits the newest dispatches into the home page slots without repeating one.
 * The opener is built around an image, so it takes the newest dispatch that has
 * one (falling back to the newest dispatch when none do).
 */
export function buildHomeFeed({
  articles,
  totalDispatches,
  categories,
  events,
}: HomeFeedInput): HomeFeed {
  const lead = articles.find((article) => article.featuredImage) ?? articles[0];
  const rest = articles.filter((article) => article !== lead);

  const covered = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
  const shown = covered.slice(0, DISCIPLINES);
  const images = assignTopicImages(articles, shown);

  return {
    lead,
    top: rest.slice(0, TOP_BLOCK),
    more: rest.slice(TOP_BLOCK, TOP_BLOCK + MORE),
    disciplines: shown.map((category) => ({ category, image: images.get(category.id) ?? null })),
    schedule: upcomingEvents(events, SCHEDULE),
    stats: {
      dispatches: totalDispatches,
      liveEvents: events.filter((event) => event.status === 'live').length,
      upcomingEvents: events.filter((event) => event.status === 'scheduled').length,
      disciplines: covered.length,
    },
  };
}
