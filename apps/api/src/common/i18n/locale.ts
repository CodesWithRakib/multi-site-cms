export const SUPPORTED_LOCALES = ['en', 'bn'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const HEADER_LIMIT = 512;
const MAX_ENTRIES = 16;
const QUALITY_PATTERN = /^(?:0(?:\.\d{1,3})?|1(?:\.0{1,3})?)$/;

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

interface Candidate {
  locale: Locale;
  quality: number;
  order: number;
}

/**
 * Resolve `Accept-Language` to a supported locale.
 *
 * Deliberately small and total: an unparsable header, an unknown language, or a
 * wildcard all resolve to the default locale. The header is client input, so it is
 * length-bounded and never used to select files, modules, or templates.
 *
 * `bn-BD;q=0.9, en;q=0.8` resolves to `bn`; `fr, *;q=0.5` resolves to `en`.
 */
export function resolveLocale(acceptLanguage: string | undefined): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const header = acceptLanguage.slice(0, HEADER_LIMIT);
  const candidates: Candidate[] = [];

  header
    .split(',')
    .slice(0, MAX_ENTRIES)
    .forEach((entry, order) => {
      const [tagPart, ...parameters] = entry.trim().split(';');
      const tag = tagPart?.trim().toLowerCase();

      if (!tag || tag === '*') {
        return;
      }

      const language = tag.split('-')[0];
      if (!language || !isSupportedLocale(language)) {
        return;
      }

      let quality = 1;
      for (const parameter of parameters) {
        const [rawName, rawValue] = parameter.trim().split('=');
        if (rawName?.trim().toLowerCase() !== 'q' || rawValue === undefined) {
          continue;
        }

        const value = rawValue.trim();
        if (!QUALITY_PATTERN.test(value)) {
          quality = 0;
          break;
        }
        quality = Number(value);
      }

      if (!Number.isFinite(quality) || quality <= 0) {
        return;
      }

      candidates.push({ locale: language, quality, order });
    });

  candidates.sort((left, right) => right.quality - left.quality || left.order - right.order);

  return candidates[0]?.locale ?? DEFAULT_LOCALE;
}
