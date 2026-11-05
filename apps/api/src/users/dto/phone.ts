import { Transform } from 'class-transformer';
import { IsOptional, Matches, ValidateIf } from 'class-validator';

/** E.164: "+" then 8–15 digits. Mirrors CHK_users_phone_e164. */
export const E164_PATTERN = /^[+][1-9][0-9]{7,14}$/;

/** Spaces, dashes, and brackets are dropped; an empty string means "no phone". */
export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const compact = value.replace(/[\s()-]/g, '');
  return compact === '' ? null : compact;
}

/** Optional phone field; `null` (or "") clears it. */
export function PhoneField(): PropertyDecorator {
  return (target, key) => {
    Transform(({ value }: { value: unknown }) => normalizePhone(value))(target, key);
    IsOptional()(target, key);
    ValidateIf((_obj, value) => value !== null)(target, key);
    Matches(E164_PATTERN, {
      message: 'phone must be in international format, e.g. +8801767476724',
    })(target, key);
  };
}
