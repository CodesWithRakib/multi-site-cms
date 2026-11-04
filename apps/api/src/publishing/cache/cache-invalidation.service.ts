import { Injectable, Logger } from '@nestjs/common';

import { env } from '../../config/env';
import type {
  PublicationPublishedPayload,
  PublicationUnpublishedPayload,
} from '../publishing.types';

export interface InvalidationResult {
  success: boolean;
  siteKey: string;
  paths: string[];
  revalidatedAt: string;
  /** True when no request was sent (no site URL or no shared secret). */
  skipped?: boolean;
  error?: string;
}

/**
 * Derives and triggers Next.js on-demand cache revalidation for affected sites and routes.
 * Never trusts client-supplied paths; routes are derived strictly from validated publication records.
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  /**
   * Derives affected paths for a published or updated publication.
   */
  derivePathsForPublication(
    payload: PublicationPublishedPayload | PublicationUnpublishedPayload,
  ): string[] {
    const paths = new Set<string>();

    // 1. Root / homepage listing is always affected
    paths.add('/');

    // 2. Specific article / publication detail path
    if (payload.slug) {
      paths.add(`/${payload.slug}`);
    }

    // 3. Category archive listings if present
    const publishedPayload = payload as PublicationPublishedPayload;
    if (publishedPayload.categorySlugs && Array.isArray(publishedPayload.categorySlugs)) {
      for (const catSlug of publishedPayload.categorySlugs) {
        if (catSlug) paths.add(`/categories/${catSlug}`);
      }
    }

    // 4. Tag archive listings if present
    if (publishedPayload.tagSlugs && Array.isArray(publishedPayload.tagSlugs)) {
      for (const tagSlug of publishedPayload.tagSlugs) {
        if (tagSlug) paths.add(`/tags/${tagSlug}`);
      }
    }

    return Array.from(paths);
  }

  /**
   * Revalidates paths on the target Next.js site application.
   */
  async revalidatePaths(
    siteKey: string,
    paths: string[],
    siteBaseUrl?: string,
    secret?: string,
  ): Promise<InvalidationResult> {
    const revalidationSecret = secret ?? env.REVALIDATE_SECRET;
    const targetUrl = siteBaseUrl ? `${siteBaseUrl.replace(/\/$/, '')}/api/revalidate` : null;

    if (!targetUrl || !revalidationSecret) {
      // Not a failure: without a site URL or shared secret there is nothing to
      // call, and retrying would only fill the dead-letter queue. Sites fall
      // back to time-based ISR. Reported as `skipped` so it is never mistaken
      // for a real revalidation.
      this.logger.debug(
        `Skipping on-demand revalidation for site [${siteKey}]: ${targetUrl ? 'REVALIDATE_SECRET not set' : 'no site URL'}`,
      );
      return {
        success: true,
        skipped: true,
        siteKey,
        paths,
        revalidatedAt: new Date().toISOString(),
      };
    }

    this.logger.log(
      `Triggering on-demand cache revalidation for site [${siteKey}] on paths: ${paths.join(', ')}`,
    );

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Header name is the contract in @multi-site-cms/config/revalidation.
          'x-revalidate-secret': revalidationSecret,
        },
        body: JSON.stringify({ paths, tags: [`site:${siteKey}`] }),
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown HTTP error');
        this.logger.warn(
          `Revalidation webhook returned HTTP ${response.status} for site [${siteKey}]: ${errorText}`,
        );
        return {
          success: false,
          siteKey,
          paths,
          revalidatedAt: new Date().toISOString(),
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      return {
        success: true,
        siteKey,
        paths,
        revalidatedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errMsg = (err as Error).message || 'Network error';
      this.logger.warn(`Failed to dispatch revalidation request to ${targetUrl}: ${errMsg}`);
      return {
        success: false,
        siteKey,
        paths,
        revalidatedAt: new Date().toISOString(),
        error: errMsg,
      };
    }
  }
}
