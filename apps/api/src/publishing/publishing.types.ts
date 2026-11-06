import type { PublicationStatus } from '../database/entities/types';

/**
 * Valid publication lifecycle state transitions.
 */
export const ALLOWED_PUBLICATION_TRANSITIONS: Record<
  PublicationStatus,
  readonly PublicationStatus[]
> = {
  draft: ['in_review', 'scheduled', 'published', 'archived'],
  in_review: ['draft', 'scheduled', 'published', 'archived'],
  scheduled: ['draft', 'in_review', 'scheduled', 'published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

export function isValidPublicationTransition(
  currentStatus: PublicationStatus,
  targetStatus: PublicationStatus,
): boolean {
  if (currentStatus === targetStatus && targetStatus !== 'scheduled') {
    return false; // No-op transitions not allowed unless rescheduling
  }
  const allowed = ALLOWED_PUBLICATION_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Outbox Event types emitted across the publishing lifecycle.
 */
export const OUTBOX_EVENT_TYPES = {
  PUBLICATION_PUBLISHED: 'publication.published',
  /** A published publication moved to a newer revision (content edited). */
  PUBLICATION_UPDATED: 'publication.updated',
  PUBLICATION_UNPUBLISHED: 'publication.unpublished',
  PUBLICATION_SCHEDULED: 'publication.scheduled',
  PUBLICATION_RESCHEDULED: 'publication.rescheduled',
  PUBLICATION_CANCELLED: 'publication.cancelled',
  PUBLICATION_ARCHIVED: 'publication.archived',
  PUBLICATION_RESTORED: 'publication.restored',
  AIR_SPORTS_UPDATE_PUBLISHED: 'air_sports.update.published',
} as const;

export type OutboxEventType = (typeof OUTBOX_EVENT_TYPES)[keyof typeof OUTBOX_EVENT_TYPES];

export interface PublicationPublishedPayload {
  publicationId: string;
  siteId: string;
  siteKey: string;
  postId: string;
  postType: string;
  slug: string;
  title: string;
  publishedAt: string;
  revisionId: string;
  categorySlugs?: string[];
  tagSlugs?: string[];
  templateKey?: string | null;
}

export interface PublicationUnpublishedPayload {
  publicationId: string;
  siteId: string;
  siteKey: string;
  postId: string;
  slug: string;
  previousStatus: string;
  unpublishedAt: string;
}

export interface PublicationScheduledPayload {
  publicationId: string;
  siteId: string;
  siteKey: string;
  postId: string;
  slug: string;
  scheduledFor: string;
  previousScheduledFor?: string | null;
}

export interface AirSportsUpdatePayload {
  publicationId: string;
  siteId: string;
  siteKey: string;
  postId: string;
  slug: string;
  title: string;
  publishedAt: string;
  alertLevel?: string;
  windConditions?: string;
  weather?: string;
  timestamp?: string;
}

export interface PublishingHealthStats {
  scheduledPublicationsPending: number;
  oldestPendingScheduledFor: string | null;
  outboxBacklogPending: number;
  outboxDeadLetterCount: number;
  isScheduledWorkerActive: boolean;
  isOutboxDispatcherActive: boolean;
}
