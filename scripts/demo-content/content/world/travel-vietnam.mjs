import { b, callout, destination, doc, h2, image, ol, p, quote, table } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'northern-central-vietnam-route',
  title: 'Vietnam North to Centre: Hanoi, Ha Long Bay, Sapa and Hoi An',
  excerpt:
    'Limestone islands rising from Ha Long Bay, terraced valleys around Sapa, Hanoi’s lake at dawn and lantern-lit Hoi An. Two weeks through northern and central Vietnam.',
  type: 'travel_guide',
  featured: m.vietnamHalong,
  categories: ['Destinations', 'Food Travel', 'Guides'],
  tags: ['Vietnam', 'Ha Long Bay', 'Hoi An', 'UNESCO'],
  seoTitle: 'Vietnam Itinerary: Hanoi, Ha Long, Sapa & Hoi An',
  seoDescription:
    'Plan two weeks in northern and central Vietnam: Hanoi, a Ha Long Bay cruise, Sapa’s rice terraces and Hoi An’s old town, with weather tips.',
  body: doc(
    p(
      'Vietnam stretches over 1,600 km from north to south, so the weather is never the same everywhere at once. This route covers the north and centre, ending in ',
      b('Hoi An'),
      '.',
    ),
    destination({
      destination: 'Northern & Central Vietnam',
      country: 'Vietnam',
      region: 'Hanoi, Quảng Ninh, Lào Cai, Quảng Nam',
      bestSeason: 'March–May, September–November (varies by region)',
      currency: 'Vietnamese đồng (VND)',
      language: 'Vietnamese',
      elevation: 'Sea level to Sapa about 1,500 m',
      highlights: ['Ha Long Bay', 'Sapa terraces', 'Hanoi Old Quarter', 'Hoi An'],
    }),
    h2('Hanoi'),
    image(m.vietnamHanoi, m.vietnamHanoi.caption),
    p(
      'Walk around Hoàn Kiếm Lake early, when people practise tai chi along the shore, then lose yourself in the Old Quarter. Eat phở for breakfast and bún chả for lunch.',
    ),
    h2('Ha Long Bay'),
    p(
      'Around ',
      b('1,600 limestone islands and islets'),
      ' rise from the bay, a UNESCO World Heritage Site. Overnight cruises let you see it at sunrise, before day boats arrive.',
    ),
    callout('tip', [
      b('Choose your cruise carefully. '),
      'Read recent reviews, check the route (Lan Ha Bay is quieter) and confirm safety equipment on board.',
    ]),
    h2('Sapa'),
    image(m.vietnamRiceTerraces, m.vietnamRiceTerraces.caption),
    p(
      'Rice terraces climb the valleys around Sapa, home to Hmong, Dao and other communities. Terraces are green in summer and golden before the harvest in September.',
    ),
    h2('Hoi An'),
    image(m.vietnamHoiAn, m.vietnamHoiAn.caption),
    image(m.vietnamLanterns, m.vietnamLanterns.caption),
    p(
      'The old trading port’s yellow houses, assembly halls and Japanese Covered Bridge are on the UNESCO list. At night, lanterns light the river.',
    ),
    table(
      ['Region', 'Driest months', 'Watch out for'],
      [
        ['North (Hanoi, Ha Long)', 'October–April', 'Cool, misty winters'],
        ['Sapa', 'September–November, March–May', 'Cold nights in winter'],
        ['Centre (Hoi An)', 'February–August', 'Typhoons and floods September–December'],
      ],
    ),
    ol(
      'Check visa rules before you fly',
      'Use ride-hailing apps for fair taxi prices',
      'Cross streets slowly and steadily: traffic flows around you',
    ),
    quote('Vietnam is best eaten slowly, one street stall at a time.'),
  ),
});
