import { b, callout, destination, doc, h2, image, ol, p, quote, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'ratargul-swamp-forest-sylhet',
  title: 'Ratargul: Rowing Through Bangladesh’s Freshwater Swamp Forest',
  excerpt:
    'In the rainy season the trees of Ratargul stand in water and the forest becomes a maze you explore by wooden boat. When to go and how to visit from Sylhet.',
  type: 'article',
  featured: m.ratargulAerial,
  categories: ['Nature', 'Destinations'],
  tags: ['Ratargul', 'Sylhet', 'Monsoon'],
  seoTitle: 'Ratargul Swamp Forest Guide: Season & Boat Trips',
  seoDescription:
    'Visit Ratargul swamp forest near Sylhet: the best season, how the boat trips work and safety tips.',
  body: doc(
    p(
      'Ratargul, in the Gowainghat area of Sylhet, is a rare ',
      b('freshwater swamp forest'),
      '. For part of the year the trees stand in clear water, and the only way through is in a small wooden boat, gliding between the trunks.',
    ),
    destination({
      destination: 'Ratargul Swamp Forest',
      country: 'Bangladesh',
      region: 'Gowainghat, Sylhet',
      bestSeason: 'July–October (high water)',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali',
      elevation: 'Low-lying wetland',
      highlights: [
        'Boat rides between flooded trees',
        'A watchtower above the canopy',
        'Birds and quiet water',
      ],
    }),
    h2('How to visit'),
    ol(
      'Travel from Sylhet city by road (under two hours, depending on traffic)',
      'Hire a small wooden boat with a local boatman at the jetty',
      'Spend an hour or two exploring the channels',
    ),
    image(m.ratargulBoats, m.ratargulBoats.caption),
    h2('Timing matters'),
    p(
      'Come in the ',
      b('monsoon and just after'),
      ', roughly July to October, when the water is high. In the dry season the water drops and the forest looks very different.',
    ),
    callout('warning', [
      b('Do not swim or wade. '),
      'The water hides roots and snakes. Stay seated in the boat and keep your hands inside.',
    ]),
    h2('Respect the forest'),
    ul(
      'Keep voices low: you will see more birds',
      'Take every bit of rubbish back with you',
      'Pay the boatmen fairly; this is their living',
    ),
    quote('Ratargul is quietest in the early morning, when the only sound is the oar.'),
  ),
});
