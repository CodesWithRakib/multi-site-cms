import { Injectable, Logger } from '@nestjs/common';
import type {
  PublicationPublishedPayload,
  PublicationUnpublishedPayload,
} from '../publishing.types';

export interface InvalidationResult {
  success: boolean;
  siteKey: string;
  paths: string[];
  revalidatedAt: string;
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
    const revalidationSecret =
      secret || process.env.REVALIDATION_SECRET || 'dev_revalidation_secret';
    const targetUrl = siteBaseUrl ? `${siteBaseUrl.replace(/\/$/, '')}/api/revalidate` : null;

    this.logger.log(
      `Triggering on-demand cache revalidation for site [${siteKey}] on paths: ${paths.join(', ')}`,
    );

    if (!targetUrl) {
      // In local development or testing environments where sites are not running on separate ports,
      // simulate successful path invalidation without network timeouts.
      return {
        success: true,
        siteKey,
        paths,
        revalidatedAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidation-token': revalidationSecret,
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
