import { describe, expect, it } from 'vitest';

import { sceneFor } from './ScenicArt';

describe('sceneFor', () => {
  it('always returns the same scene for the same seed', () => {
    expect(sceneFor('sundarbans-boat-trip-guide')).toBe(sceneFor('sundarbans-boat-trip-guide'));
  });

  it('returns a known scene, including for an empty seed', () => {
    for (const seed of ['', 'a', 'sajek-valley', 'ratargul-swamp-forest']) {
      expect(['mountains', 'coast', 'forest']).toContain(sceneFor(seed));
    }
  });

  it('spreads different seeds across more than one scene', () => {
    const seeds = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'];
    expect(new Set(seeds.map(sceneFor)).size).toBeGreaterThan(1);
  });
});
