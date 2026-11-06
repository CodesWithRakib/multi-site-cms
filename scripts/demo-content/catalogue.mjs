import { MEDIA } from './media.mjs';
import { WORLD_MEDIA } from './media-world.mjs';

/** Every photo the seeder uploads to the Media Library, keyed for the posts. */
export const CATALOGUE = { ...MEDIA, ...WORLD_MEDIA };
