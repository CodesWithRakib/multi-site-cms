import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse } from '@multi-site-cms/types';

import type { Locale } from '../i18n/locale';
import type { MessageKey } from '../i18n/messages';
import { translate } from '../i18n/translate';

export interface ErrorDetailInput {
  field?: string;
  code: string;
  messageKey: MessageKey;
}

export interface ErrorResponseInput {
  code: ApiErrorCode;
  messageKey: MessageKey;
  params?: Readonly<Record<string, string | number>>;
  details?: readonly ErrorDetailInput[];
}

/**
 * Single builder for the error envelope.
 *
 * Both the exception filter and the pre-routing body-parser guard use it, so the
 * contract has exactly one implementation. Message resolution happens here, which
 * is why callers pass message *keys* rather than sentences.
 */
export function buildErrorResponse(
  locale: Locale,
  requestId: string,
  input: ErrorResponseInput,
): ApiErrorResponse {
  const details: ApiErrorDetail[] | undefined =
    input.details && input.details.length > 0
      ? input.details.map((detail) => ({
          ...(detail.field ? { field: detail.field } : {}),
          code: detail.code,
          message: translate(locale, detail.messageKey),
        }))
      : undefined;

  return {
    error: {
      code: input.code,
      message: translate(locale, input.messageKey, input.params),
      ...(details ? { details } : {}),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
