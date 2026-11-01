import type { Locale } from './locale';

/**
 * Message catalog.
 *
 * Rules:
 * - Keys are stable identifiers; they are never sent to clients.
 * - Error *codes* are never translated. Only the human-readable message is.
 * - `en` is the reference catalog: its keys define `MessageKey`, so a missing
 *   translation in another locale fails type-checking instead of falling back at
 *   runtime.
 * - This is intentionally not a full CMS translation system. Domain messages are
 *   added here as the domain is implemented.
 */
export const en = {
  'http.badRequest': 'The request is not valid.',
  'http.unauthenticated': 'Sign in to continue.',
  'http.forbidden': 'You do not have permission to perform this action.',
  'http.notFound': 'The requested resource was not found.',
  'http.conflict': 'The request conflicts with the current state of the resource.',
  'http.unprocessable': 'The request was understood but cannot be processed.',
  'http.payloadTooLarge': 'The submitted data exceeds the allowed size.',
  'http.rateLimited': 'Too many requests. Try again shortly.',
  'http.serviceUnavailable': 'The service is temporarily unavailable.',
  'http.internal': 'An unexpected error occurred.',
  'http.generic': 'The request could not be completed.',

  'validation.failed': 'The request contains invalid fields.',
  'validation.unexpectedField': 'This field is not allowed.',
  'validation.isDefined': 'This field is required.',
  'validation.isNotEmpty': 'This field must not be empty.',
  'validation.isString': 'This field must be text.',
  'validation.isEmail': 'Enter a valid email address.',
  'validation.isUuid': 'Enter a valid identifier.',
  'validation.isIn': 'This value is not allowed.',
  'validation.isInt': 'This field must be a whole number.',
  'validation.isNumber': 'This field must be a number.',
  'validation.isBoolean': 'This field must be true or false.',
  'validation.isUrl': 'Enter a valid URL.',
  'validation.minLength': 'This value is too short.',
  'validation.maxLength': 'This value is too long.',
  'validation.matches': 'This value has an invalid format.',
  'validation.unknown': 'This field is not valid.',
} as const;

export type MessageKey = keyof typeof en;

export const bn: Record<MessageKey, string> = {
  'http.badRequest': 'অনুরোধটি সঠিক নয়।',
  'http.unauthenticated': 'চালিয়ে যেতে সাইন ইন করুন।',
  'http.forbidden': 'এই কাজটি করার অনুমতি আপনার নেই।',
  'http.notFound': 'অনুরোধ করা রিসোর্সটি পাওয়া যায়নি।',
  'http.conflict': 'অনুরোধটি রিসোর্সের বর্তমান অবস্থার সাথে সংঘর্ষ করছে।',
  'http.unprocessable': 'অনুরোধটি বোঝা গেছে, তবে প্রক্রিয়া করা যায়নি।',
  'http.payloadTooLarge': 'পাঠানো ডেটা অনুমোদিত আকারের চেয়ে বড়।',
  'http.rateLimited': 'অনেক বেশি অনুরোধ পাঠানো হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
  'http.serviceUnavailable': 'সেবাটি সাময়িকভাবে উপলব্ধ নয়।',
  'http.internal': 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।',
  'http.generic': 'অনুরোধটি সম্পন্ন করা যায়নি।',

  'validation.failed': 'অনুরোধে অবৈধ ফিল্ড রয়েছে।',
  'validation.unexpectedField': 'এই ফিল্ডটি অনুমোদিত নয়।',
  'validation.isDefined': 'এই ফিল্ডটি আবশ্যক।',
  'validation.isNotEmpty': 'এই ফিল্ডটি খালি রাখা যাবে না।',
  'validation.isString': 'এই ফিল্ডটি টেক্সট হতে হবে।',
  'validation.isEmail': 'একটি বৈধ ইমেইল ঠিকানা দিন।',
  'validation.isUuid': 'একটি বৈধ আইডি দিন।',
  'validation.isIn': 'এই মানটি অনুমোদিত নয়।',
  'validation.isInt': 'এই ফিল্ডটি পূর্ণসংখ্যা হতে হবে।',
  'validation.isNumber': 'এই ফিল্ডটি সংখ্যা হতে হবে।',
  'validation.isBoolean': 'এই ফিল্ডটি সত্য অথবা মিথ্যা হতে হবে।',
  'validation.isUrl': 'একটি বৈধ URL দিন।',
  'validation.minLength': 'এই মানটি খুব ছোট।',
  'validation.maxLength': 'এই মানটি খুব বড়।',
  'validation.matches': 'এই মানের ফরম্যাট সঠিক নয়।',
  'validation.unknown': 'এই ফিল্ডটি বৈধ নয়।',
};

export const catalogs: Record<Locale, Record<MessageKey, string>> = { en, bn };
