import type { EntityManager } from 'typeorm';

import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { PostPublicationMedia } from '../database/entities/post-publication-media.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { removeImageNodes } from '../posts/utils/body-media';
import { OUTBOX_EVENT_TYPES } from '../publishing/publishing.types';

export interface MediaCleanupReport {
  featuredCleared: number;
  postsEdited: number;
}

interface LatestRevisionRow {
  id: string;
  post_id: string;
  revision_number: number;
  title: string;
  excerpt: string | null;
  body: Record<string, unknown>;
}

/**
 * Removes every reference to a media asset before it is deleted:
 * featured images, publication media links, and inline images in post
 * bodies. Revisions are immutable (ADR-0005), so a post whose latest
 * revision shows the image gets a new revision without it; publications
 * pinned to that latest revision move to the new one, and published ones
 * get a `publication.updated` event so the public sites refresh.
 * Must run inside the same transaction that deletes the asset row.
 */
export async function detachMediaEverywhere(
  manager: EntityManager,
  mediaId: string,
  urls: ReadonlySet<string>,
  actorId: string,
): Promise<MediaCleanupReport> {
  const publications = manager.getRepository(PostPublication);

  const featuredCleared = (
    await publications.update({ featuredImageId: mediaId }, { featuredImageId: null })
  ).affected;
  await manager.getRepository(PostPublicationMedia).delete({ mediaId });

  const patterns = [...urls].map((url) => `%${url.replace(/[%_\\]/g, '\\$&')}%`);
  const latest = (await manager.query(
    `SELECT DISTINCT ON (r."post_id") r."id", r."post_id", r."revision_number",
            r."title", r."excerpt", r."body"
       FROM "post_revisions" r
      WHERE r."post_id" IN (
        SELECT "post_id" FROM "post_revisions" WHERE "body"::text LIKE ANY($1::text[])
      )
      ORDER BY r."post_id", r."revision_number" DESC`,
    [patterns],
  )) as LatestRevisionRow[];

  let postsEdited = 0;
  for (const revision of latest) {
    const cleaned = removeImageNodes(revision.body, urls);
    if (cleaned.removed === 0) continue;
    postsEdited += 1;

    const revisions = manager.getRepository(PostRevision);
    const next = await revisions.save(
      revisions.create({
        postId: revision.post_id,
        revisionNumber: revision.revision_number + 1,
        title: revision.title,
        excerpt: revision.excerpt,
        body: cleaned.body,
        changeSummary: 'Removed a deleted media file',
        createdBy: actorId,
      }),
    );

    const pinned = await publications.find({ where: { revisionId: revision.id } });
    for (const publication of pinned) {
      publication.revisionId = next.id;
      await publications.save(publication);
      if (publication.status !== 'published') continue;

      const site = (await manager.query(`SELECT "key" FROM "sites" WHERE "id" = $1`, [
        publication.siteId,
      ])) as { key: string }[];
      const outbox = manager.getRepository(OutboxEvent);
      await outbox.save(
        outbox.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_UPDATED,
          eventVersion: 1,
          siteId: publication.siteId,
          publicationId: publication.id,
          postId: publication.postId,
          payload: {
            publicationId: publication.id,
            siteId: publication.siteId,
            siteKey: site[0]?.key ?? 'default',
            postId: publication.postId,
            slug: publication.slug,
            title: revision.title,
            publishedAt: (publication.publishedAt ?? new Date()).toISOString(),
            revisionId: next.id,
            templateKey: publication.templateKey,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );
    }
  }

  return { featuredCleared: featuredCleared ?? 0, postsEdited };
}
