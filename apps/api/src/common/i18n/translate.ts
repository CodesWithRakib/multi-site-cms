import { catalogs, type MessageKey } from './messages';
import { DEFAULT_LOCALE, type Locale } from './locale';

export type MessageParams = Readonly<Record<string, string | number>>;

function interpolate(template: string, params: MessageParams | undefined): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Translate a message key for a locale.
 *
 * Fallback order is locale → default locale → the key itself. Returning the key on
 * a miss is deliberate: it makes a missing translation obvious in development while
 * never inventing a user-facing sentence.
 */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const catalog = catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
  const template = catalog[key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;

  return interpolate(template, params);
}
