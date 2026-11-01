import type { ValidationError } from 'class-validator';

import type { MessageKey } from './messages';

/**
 * class-validator constraint name → message key.
 *
 * Only the constraints used by this codebase (and its early Phase 04 DTOs) are
 * mapped. An unmapped constraint degrades to a generic "invalid field" message
 * rather than leaking the English class-validator string to a Bangla client.
 */
const CONSTRAINT_KEYS: Readonly<Record<string, MessageKey>> = {
  isDefined: 'validation.isDefined',
  isNotEmpty: 'validation.isNotEmpty',
  isString: 'validation.isString',
  isEmail: 'validation.isEmail',
  isUUID: 'validation.isUuid',
  isIn: 'validation.isIn',
  isInt: 'validation.isInt',
  isNumber: 'validation.isNumber',
  isBoolean: 'validation.isBoolean',
  isUrl: 'validation.isUrl',
  minLength: 'validation.minLength',
  maxLength: 'validation.maxLength',
  matches: 'validation.matches',
  whitelistValidation: 'validation.unexpectedField',
};

export interface FieldMessage {
  field: string;
  code: string;
  messageKey: MessageKey;
}

function flatten(error: ValidationError, parentPath: string): FieldMessage[] {
  const field = parentPath.length > 0 ? `${parentPath}.${error.property}` : error.property;
  const messages: FieldMessage[] = [];

  for (const constraint of Object.keys(error.constraints ?? {})) {
    messages.push({
      field,
      code: constraint,
      messageKey: CONSTRAINT_KEYS[constraint] ?? 'validation.unknown',
    });
  }

  for (const child of error.children ?? []) {
    messages.push(...flatten(child, field));
  }

  return messages;
}

/**
 * Convert validation errors into stable, localized-later field messages.
 *
 * The message itself is resolved by the exception filter, which knows the request
 * locale; keeping only the key here means the pipe stays request-agnostic.
 */
export function toFieldMessages(errors: readonly ValidationError[]): FieldMessage[] {
  return errors.flatMap((error) => flatten(error, ''));
}
