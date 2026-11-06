/**
 * Video embeds in published content.
 *
 * The editor stores whatever URL the author pasted (watch page, short link,
 * embed URL). Public sites must never put an arbitrary URL into an <iframe>,
 * so only YouTube is accepted, normalised to the privacy-enhanced
 * youtube-nocookie.com embed player.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

function youtubeVideoId(url: URL): string | null {
  if (url.hostname === 'youtu.be') {
    return url.pathname.slice(1).split('/')[0] ?? null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  const [, kind, id] = url.pathname.split('/');
  return kind === 'embed' || kind === 'shorts' || kind === 'live' ? (id ?? null) : null;
}

/** Embed URL for a YouTube link, or null for anything else (do not render it). */
export function toYouTubeEmbedUrl(src: unknown): string | null {
  if (typeof src !== 'string') return null;
  let url: URL;
  try {
    url = new URL(src.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const id = youtubeVideoId(url);
  return id && YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
