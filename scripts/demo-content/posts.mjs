import airDroneRules from './content/air-drone-rules.mjs';
import airFlyingSeasons from './content/air-flying-seasons.mjs';
import airShakrain from './content/air-shakrain-kites.mjs';
import travelBandarban from './content/travel-bandarban.mjs';
import travelCoxsBazar from './content/travel-coxs-bazar.mjs';
import travelOldDhaka from './content/travel-old-dhaka.mjs';
import travelRatargul from './content/travel-ratargul.mjs';
import travelSajek from './content/travel-sajek.mjs';
import travelSrimangal from './content/travel-srimangal.mjs';
import travelSundarbans from './content/travel-sundarbans.mjs';
import { WORLD_POSTS } from './content/world/index.mjs';

/** Published oldest first, so the list order on the sites matches this array reversed. */
export const POSTS = [
  travelOldDhaka,
  airFlyingSeasons,
  travelRatargul,
  travelBandarban,
  airDroneRules,
  travelSrimangal,
  travelCoxsBazar,
  airShakrain,
  travelSajek,
  travelSundarbans,
  ...WORLD_POSTS,
];
