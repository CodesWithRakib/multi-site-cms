import { HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@multi-site-cms/types';

import type { MessageKey } from '../i18n/messages';

export function errorCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return 'PAYLOAD_TOO_LARGE';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'INTERNAL_ERROR';
    default:
      return 'HTTP_ERROR';
  }
}

/**
 * Default message key for a status. Used when a thrown `HttpException` carries no
 * application message key of its own (for example a framework guard rejection).
 */
export function messageKeyForStatus(status: number): MessageKey {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'http.badRequest';
    case HttpStatus.UNAUTHORIZED:
      return 'http.unauthenticated';
    case HttpStatus.FORBIDDEN:
      return 'http.forbidden';
    case HttpStatus.NOT_FOUND:
      return 'http.notFound';
    case HttpStatus.CONFLICT:
      return 'http.conflict';
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return 'http.payloadTooLarge';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'http.unprocessable';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'http.rateLimited';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'http.serviceUnavailable';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'http.internal';
    default:
      return 'http.generic';
  }
}
