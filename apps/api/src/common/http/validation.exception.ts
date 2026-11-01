import { HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import { ApiException } from '../exceptions/api.exception';
import { toFieldMessages } from '../i18n/validation-messages';

/**
 * `ValidationPipe` exception factory.
 *
 * Replaces Nest's default English message array with structured details that keep
 * the field, the constraint name (a stable code), and a message key. The filter
 * resolves the key against the request locale, so validation errors are localized
 * without duplicating class-validator configuration per locale.
 */
export function validationExceptionFactory(errors: ValidationError[]): ApiException {
  const details = toFieldMessages(errors).map((detail) => ({
    field: detail.field,
    code: detail.code,
    messageKey: detail.messageKey,
  }));

  return new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'validation.failed', {
    details,
  });
}
