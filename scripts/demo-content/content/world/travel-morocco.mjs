import {
  b,
  callout,
  destination,
  doc,
  h2,
  image,
  ol,
  p,
  quote,
  table,
  ul,
} from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'morocco-marrakech-to-the-sahara',
  title: 'Marrakech to the Sahara: Ten Days Across Morocco',
  excerpt:
    'Souks and storytellers in Marrakech, a mud-brick ksar over the High Atlas, a night under the stars in the Erg Chebbi dunes and the blue lanes of Chefchaouen.',
  type: 'travel_guide',
  featured: m.moroccoMerzouga,
  categories: ['Destinations', 'Culture', 'Adventure'],
  tags: ['Morocco', 'Sahara', 'Marrakech', 'Desert'],
  seoTitle: 'Morocco Itinerary: Marrakech, Sahara & Chefchaouen',
  seoDescription:
    'A ten-day Morocco route from Marrakech over the High Atlas to the Sahara at Merzouga and north to Chefchaouen, with tips on souks and seasons.',
  body: doc(
    p(
      'Morocco packs mountains, desert and medieval cities into one trip. This route runs from ',
      b('Marrakech'),
      ' over the High Atlas to the dunes at Merzouga, then north to Fes and Chefchaouen.',
    ),
    destination({
      destination: 'Marrakech, High Atlas & Sahara',
      country: 'Morocco',
      region: 'Marrakech-Safi and Drâa-Tafilalet',
      bestSeason: 'March–May, September–November',
      currency: 'Moroccan dirham (MAD)',
      language: 'Arabic, Amazigh (Berber), French widely used',
      elevation: 'Tizi n’Tichka pass about 2,260 m',
      highlights: ['Jemaa el-Fnaa', 'Aït Benhaddou', 'Erg Chebbi', 'Chefchaouen'],
    }),
    h2('Marrakech'),
    p(
      'By evening, ',
      b('Jemaa el-Fnaa'),
      ' fills with food stalls, musicians and storytellers. UNESCO lists the square’s living traditions as intangible heritage. By day, escape the heat in the Jardin Majorelle.',
    ),
    image(m.moroccoJemaa, m.moroccoJemaa.caption),
    image(m.moroccoMajorelle, m.moroccoMajorelle.caption),
    h2('Over the High Atlas'),
    p(
      'The road climbs over the Tizi n’Tichka pass to ',
      b('Aït Benhaddou'),
      ', a fortified village of earthen buildings and a UNESCO World Heritage Site that has appeared in many films.',
    ),
    image(m.moroccoAitBenhaddou, m.moroccoAitBenhaddou.caption),
    h2('A night in the dunes'),
    p(
      'At Merzouga the Erg Chebbi dunes rise up to about 150 m. Ride or walk out to a desert camp for sunset, and climb a dune again for sunrise.',
    ),
    callout('tip', [
      b('Pack layers. '),
      'Desert nights are cold, even after a hot day. A warm jacket and a scarf against blowing sand make the night much better.',
    ]),
    h2('Chefchaouen'),
    image(m.moroccoChefchaouen, m.moroccoChefchaouen.caption),
    h2('Route at a glance'),
    table(
      ['Days', 'Base', 'Highlights'],
      [
        ['1–3', 'Marrakech', 'Medina, souks, gardens'],
        ['4', 'Aït Benhaddou', 'High Atlas crossing'],
        ['5–6', 'Merzouga', 'Desert camp, dunes'],
        ['7–8', 'Fes', 'Medina and tanneries'],
        ['9–10', 'Chefchaouen', 'Blue lanes, Rif mountains'],
      ],
    ),
    h2('In the souks'),
    ol(
      'Ask the price first and bargain with a smile',
      'Say no firmly but politely to unwanted guides',
      'Ask before photographing people',
    ),
    ul(
      'Dress modestly outside resorts',
      'Carry small notes for taxis and tips',
      'Drink bottled or filtered water',
    ),
    quote('Morocco is loud in the medina and silent in the dunes. You need both.'),
  ),
});
