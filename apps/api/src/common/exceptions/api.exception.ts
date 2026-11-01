import { HttpException } from '@nestjs/common';
import type { ApiErrorCode } from '@multi-site-cms/types';

import type { MessageKey } from '../i18n/messages';

export interface ApiErrorDetailInput {
  field?: string;
  code: string;
  messageKey: MessageKey;
}

export interface ApiExceptionOptions {
  details?: readonly ApiErrorDetailInput[];
  params?: Readonly<Record<string, string | number>>;
  /** Internal context for logs. Never sent to the client. */
  logContext?: string;
}

/**
 * An application exception with a stable machine code and a message *key*.
 *
 * The message is resolved in the exception filter against the request locale, so
 * no service or controller has to know about translations. Codes are never
 * localized; `code` is the contract, `message` is presentation.
 */
export class ApiException extends HttpException {
  readonly code: ApiErrorCode;
  readonly messageKey: MessageKey;
  readonly details: readonly ApiErrorDetailInput[];
  readonly params: Readonly<Record<string, string | number>> | undefined;
  readonly logContext: string | undefined;

  constructor(
    status: number,
    code: ApiErrorCode,
    messageKey: MessageKey,
    options?: ApiExceptionOptions,
  ) {
    super({ code, messageKey }, status);

    this.code = code;
    this.messageKey = messageKey;
    this.details = options?.details ?? [];
    this.params = options?.params;
    this.logContext = options?.logContext;
  }
}
