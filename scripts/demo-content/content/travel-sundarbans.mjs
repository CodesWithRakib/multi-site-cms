import {
  b,
  callout,
  destination,
  doc,
  h2,
  h3,
  i,
  image,
  ol,
  p,
  quote,
  table,
  ul,
} from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'sundarbans-boat-trip-guide',
  title: 'The Sundarbans by Boat: A First-Timer’s Guide to the World’s Largest Mangrove Forest',
  excerpt:
    'Tidal rivers, spotted deer, crocodiles and the home of the Royal Bengal tiger: how a Sundarbans boat trip works, when to go and what to expect on board.',
  type: 'travel_guide',
  featured: m.sundarbansDeer,
  categories: ['Destinations', 'Nature', 'Guides'],
  tags: ['Sundarbans', 'Khulna', 'Wildlife', 'UNESCO'],
  seoTitle: 'Sundarbans Boat Trip Guide: Season, Route & Tips',
  seoDescription:
    'Plan a Sundarbans boat trip from Khulna or Mongla: best season, typical stops, wildlife and practical tips.',
  body: doc(
    p(
      'The Sundarbans is the largest mangrove forest on Earth, a maze of tidal rivers and mudbanks where the Ganges, Brahmaputra and Meghna meet the Bay of Bengal. Most of it lies in Bangladesh, and the only real way to see it is the way locals always have: ',
      b('by boat'),
      '.',
    ),
    destination({
      destination: 'Sundarbans',
      country: 'Bangladesh',
      region: 'Khulna Division, south-west Bangladesh',
      bestSeason: 'November–February',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali',
      elevation: 'Sea level (tidal forest)',
      highlights: [
        'UNESCO World Heritage Site (Bangladesh part, inscribed 1997)',
        'Home of the Royal Bengal tiger',
        'Spotted deer, crocodiles and hundreds of bird species',
        'Overnight trips on traditional launches',
      ],
    }),
    h2('How a trip works'),
    p(
      'Almost every visit is a guided boat trip. Licensed operators run launches from ',
      b('Khulna'),
      ' or ',
      b('Mongla'),
      ', arrange the Forest Department permits, and travel with an armed forest guard. You eat and sleep on board; short walks and smaller boats take you into the narrower creeks.',
    ),
    table(
      ['Trip length', 'What you can usually cover', 'Good for'],
      [
        ['Day trip', 'Karamjal near Mongla', 'A first look, tight schedules'],
        ['2–3 days', 'Deeper channels and coastal stops such as Kotka', 'Most first-time visitors'],
        ['4 days +', 'Remote areas towards the sea', 'Birders and photographers'],
      ],
    ),
    p(i('Routes depend on the operator, the tide and the permits issued for your dates.')),
    image(m.sundarbansCrocodile, m.sundarbansCrocodile.caption),
    h2('What you might see'),
    ul(
      [b('Spotted deer'), ' — common, often near the forest edge at low tide'],
      [b('Saltwater crocodiles'), ' — basking on mudbanks'],
      [b('Rhesus macaques'), ' — usually around the deer'],
      [b('Kingfishers, egrets and eagles'), ' — the forest is a birdwatcher’s favourite'],
      [b('Royal Bengal tiger'), ' — present, but sightings are rare; pugmarks are more likely'],
    ),
    image(m.sundarbansEgret, m.sundarbansEgret.caption),
    quote(
      'In the Sundarbans the tide sets the timetable. Everyone, from fishermen to tigers, lives by it.',
    ),
    h2('When to go'),
    p(
      'The dry winter months, ',
      b('November to February'),
      ', bring calm water, cooler days and the best wildlife viewing. The monsoon is wet and rough, and the cyclone seasons around April–May and October–November can cancel trips at short notice.',
    ),
    callout('warning', [
      b('Follow your guide and forest guard at all times. '),
      'Never leave the group on shore, and do not walk into the forest on your own. This is wild tiger country.',
    ]),
    h3('Packing list'),
    ol(
      'Light, long-sleeved clothes in neutral colours',
      'A warm layer for early-morning boat rides in winter',
      'Binoculars and a zoom lens',
      'Insect repellent and sunscreen',
      'Your national ID or passport (operators need it for permits)',
    ),
    callout('tip', [
      b('Leave no plastic behind. '),
      'The forest and its rivers feed millions of people. Carry a refillable bottle and bring all waste back to the boat.',
    ]),
    p(
      'Go slowly, listen to the forest, and let the river decide the pace. It is one of the most remarkable places in Bangladesh.',
    ),
  ),
});
