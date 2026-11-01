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

  'auth.invalidCredentials': 'Invalid email or password.',
  'auth.accountInactive': 'This account is not active.',
  'auth.accountLocked': 'Account is temporarily locked. Please try again later.',
  'auth.sessionExpired': 'Your session has expired. Sign in to continue.',
  'auth.csrfFailed': 'Invalid or missing CSRF token.',
  'auth.lastSuperAdmin': 'Cannot deactivate or remove the last Super Admin.',
  'auth.cannotSelfDemote': 'You cannot remove your own Super Admin role.',
  'auth.roleNotAssignable': 'You do not have permission to assign this role.',
  'auth.siteRequired': 'A site identifier is required for site-scoped roles.',
  'auth.siteForbidden': 'A site identifier cannot be provided for platform-scoped roles.',
  'auth.siteNotFound': 'The specified site was not found.',

  'user.notFound': 'User not found.',
  'user.emailConflict': 'A user with this email address already exists.',
  'role.notFound': 'Role not found.',
  'role.assignmentNotFound': 'Role assignment not found.',

  'sites.notFound': 'Site not found.',
  'sites.keyConflict': 'A site with this key already exists.',
  'sites.cannotDeleteActive': 'Active sites cannot be deleted. Archive the site first.',
  'sites.cannotDeleteWithContent': 'Sites with existing content cannot be deleted.',
  'domains.notFound': 'Domain not found.',
  'domains.conflict': 'This domain is already registered to a site.',
  'domains.invalidHostname': 'Invalid domain hostname.',
  'domains.verificationFailed': 'Domain verification failed.',
  'domains.alreadyVerified': 'Domain is already verified.',
  'domains.cannotRemovePrimary':
    'Cannot remove the primary domain. Set another domain as primary first.',
  'settings.invalidColor': 'Invalid color format. Hex color code expected.',
  'settings.invalidUrl': 'Invalid navigation URL.',
  'settings.cycleDetected': 'Navigation item cannot have itself or its descendants as parent.',

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

  'auth.invalidCredentials': 'অবৈধ ইমেইল অথবা পাসওয়ার্ড।',
  'auth.accountInactive': 'এই অ্যাকাউন্টটি সক্রিয় নয়।',
  'auth.accountLocked': 'অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
  'auth.sessionExpired': 'আপনার সেশনের মেয়াদ শেষ হয়েছে। চালিয়ে যেতে আবার সাইন ইন করুন।',
  'auth.csrfFailed': 'অবৈধ অথবা অনুপস্থিত CSRF টোকেন।',
  'auth.lastSuperAdmin': 'সর্বশেষ সুপার অ্যাডমিনকে নিষ্ক্রিয় বা অপসারণ করা যাবে না।',
  'auth.cannotSelfDemote': 'আপনি নিজের সুপার অ্যাডমিন রোল অপসারণ করতে পারবেন না।',
  'auth.roleNotAssignable': 'এই রোল নির্ধারণ করার অনুমতি আপনার নেই।',
  'auth.siteRequired': 'সাইট-ভিত্তিক রোলের জন্য সাইট আইডি আবশ্যক।',
  'auth.siteForbidden': 'প্ল্যাটফর্ম রোলের জন্য সাইট আইডি প্রদান করা যাবে না।',
  'auth.siteNotFound': 'নির্দিষ্ট সাইটটি পাওয়া যায়নি।',

  'user.notFound': 'ব্যবহারকারী পাওয়া যায়নি।',
  'user.emailConflict': 'এই ইমেইল ঠিকানার একজন ব্যবহারকারী ইতিমধ্যে বিদ্যমান।',
  'role.notFound': 'রোল পাওয়া যায়নি।',
  'role.assignmentNotFound': 'রোল অ্যাসাইনমেন্ট পাওয়া যায়নি।',

  'sites.notFound': 'সাইটটি পাওয়া যায়নি।',
  'sites.keyConflict': 'এই কি (key) দিয়ে একটি সাইট ইতিমধ্যে বিদ্যমান।',
  'sites.cannotDeleteActive': 'সক্রিয় সাইট মুছে ফেলা যাবে না। প্রথমে সাইটটি আর্কাইভ করুন।',
  'sites.cannotDeleteWithContent': 'কন্টেন্ট বিদ্যমান থাকা সাইট মুছে ফেলা যাবে না।',
  'domains.notFound': 'ডোমেন পাওয়া যায়নি।',
  'domains.conflict': 'এই ডোমেনটি ইতিমধ্যে একটি সাইটে নিবন্ধিত।',
  'domains.invalidHostname': 'অবৈধ ডোমেন হোস্টনেম।',
  'domains.verificationFailed': 'ডোমেন যাচাইকরণ ব্যর্থ হয়েছে।',
  'domains.alreadyVerified': 'ডোমেনটি ইতিমধ্যে যাচাইকৃত।',
  'domains.cannotRemovePrimary':
    'প্রাইমারি ডোমেন মুছে ফেলা যাবে না। প্রথমে অন্য একটি ডোমেনকে প্রাইমারি হিসেবে নির্ধারণ করুন।',
  'settings.invalidColor': 'অবৈধ রঙের ফরম্যাট। হেক্স কালার কোড প্রত্যাশিত।',
  'settings.invalidUrl': 'অবৈধ নেভিগেশন URL।',
  'settings.cycleDetected':
    'নেভিগেশন আইটেম নিজের বা অধীনস্থ আইটেমকে প্যারেন্ট হিসেবে রাখতে পারে না।',

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
