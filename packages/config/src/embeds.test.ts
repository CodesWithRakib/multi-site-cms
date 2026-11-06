import { describe, expect, it } from 'vitest';

import { toYouTubeEmbedUrl } from './embeds';

const EMBED = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

describe('toYouTubeEmbedUrl', () => {
  it('normalises every common YouTube URL shape to the nocookie embed player', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(EMBED);
    expect(toYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe(EMBED);
    expect(toYouTubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(EMBED);
    expect(toYouTubeEmbedUrl('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toBe(EMBED);
    expect(toYouTubeEmbedUrl('  https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ ')).toBe(EMBED);
  });

  it('rejects other hosts, bad ids and non-http schemes', () => {
    expect(toYouTubeEmbedUrl('https://evil.example/embed/dQw4w9WgXcQ')).toBeNull();
    expect(toYouTubeEmbedUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(toYouTubeEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(toYouTubeEmbedUrl('not a url')).toBeNull();
    expect(toYouTubeEmbedUrl(undefined)).toBeNull();
  });
});
