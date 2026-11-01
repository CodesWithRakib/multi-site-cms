import { HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@multi-site-cms/types';

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
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'INTERNAL_ERROR';
    default:
      return 'HTTP_ERROR';
  }
}
