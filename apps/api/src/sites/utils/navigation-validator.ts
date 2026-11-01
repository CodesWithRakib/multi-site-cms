import { HttpStatus } from '@nestjs/common';
import type { SiteNavigationItem } from '@multi-site-cms/types';

import { ApiException } from '../../common/exceptions/api.exception';

const SAFE_URL_PATTERN = /^(\/|#|https?:\/\/|mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9\-\s()]+)/i;
const DANGEROUS_SCHEME_PATTERN = /^(javascript|data|vbscript|file):/i;

/**
 * Validates a list of site navigation items:
 * 1. IDs must be unique non-empty strings.
 * 2. URLs must be safe (no javascript:, data:, vbscript:) and follow allowed schemes.
 * 3. Parent IDs must refer to existing items in the list.
 * 4. Hierarchy must be acyclic (no item may be an ancestor of itself).
 */
export function validateNavigationItems(items: SiteNavigationItem[]): void {
  const byId = new Map<string, SiteNavigationItem>();

  for (const item of items) {
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'validation.failed');
    }

    if (byId.has(item.id)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'validation.failed');
    }

    byId.set(item.id, item);

    // Validate URL safety
    const url = (item.url ?? '').trim();
    if (!url || DANGEROUS_SCHEME_PATTERN.test(url) || !SAFE_URL_PATTERN.test(url)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'settings.invalidUrl');
    }
  }

  // Cycle detection and parent reference check
  for (const item of items) {
    if (item.parentId) {
      if (!byId.has(item.parentId)) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'settings.cycleDetected',
        );
      }

      if (item.parentId === item.id) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'settings.cycleDetected',
        );
      }

      // Trace ancestry
      const seen = new Set<string>([item.id]);
      let currentParentId: string | null | undefined = item.parentId;

      while (currentParentId) {
        if (seen.has(currentParentId)) {
          throw new ApiException(
            HttpStatus.BAD_REQUEST,
            'VALIDATION_ERROR',
            'settings.cycleDetected',
          );
        }
        seen.add(currentParentId);
        const parentItem = byId.get(currentParentId);
        currentParentId = parentItem?.parentId;
      }
    }
  }
}
