import type { Request } from 'express';

import type { Locale } from '../i18n/locale';

/**
 * Per-request context attached by middleware.
 *
 * Exactly two framework-level facts belong here: the correlation id and the
 * negotiated locale. Anything user-specific (identity, site scope) is deliberately
 * absent because it does not exist yet and must not be faked.
 */
export interface RequestContext extends Request {
  requestId: string;
  locale: Locale;
}
