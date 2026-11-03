'use client';

export interface SavedArticle {
  id: string;
  slug: string;
  title: string;
  featuredImageUrl?: string | null;
  categoryName?: string | null;
  readingTimeMinutes?: number;
  savedAt: string;
}

const STORAGE_KEY = 'travel_blog_saved_articles_data';
const LEGACY_STORAGE_KEY = 'travel_blog_saved_articles';

export function getSavedArticles(): SavedArticle[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as SavedArticle[];
      }
    }

    // Fallback: check if legacy ID array exists
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyIds = JSON.parse(legacyRaw) as string[];
      if (Array.isArray(legacyIds)) {
        return legacyIds.map((id) => ({
          id,
          slug: id,
          title: 'Saved Travel Dispatch',
          savedAt: new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return [];
}

export function saveArticle(article: Omit<SavedArticle, 'savedAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getSavedArticles().filter((item) => item.id !== article.id);
    const updated: SavedArticle[] = [
      {
        ...article,
        savedAt: new Date().toISOString(),
      },
      ...current,
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Also sync legacy key for backward compatibility
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated.map((a) => a.id)));

    window.dispatchEvent(new Event('travel_blog_bookmark_change'));
  } catch {
    // Ignore quota errors
  }
}

export function removeArticle(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getSavedArticles();
    const updated = current.filter((item) => item.id !== id && item.slug !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated.map((a) => a.id)));

    window.dispatchEvent(new Event('travel_blog_bookmark_change'));
  } catch {
    // Ignore quota errors
  }
}

export function clearAllSavedArticles(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.dispatchEvent(new Event('travel_blog_bookmark_change'));
  } catch {
    // Ignore
  }
}

export function isArticleSaved(idOrSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getSavedArticles();
  return current.some((item) => item.id === idOrSlug || item.slug === idOrSlug);
}

