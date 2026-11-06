import { b, callout, destination, doc, h2, image, ol, p, quote, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'santorini-beyond-the-sunset',
  title: 'Santorini Beyond the Sunset: Caldera Walks, Black Beaches and Ancient Akrotiri',
  excerpt:
    'Oia’s sunset is famous for a reason, but Santorini has much more: the cliff path from Fira to Oia, volcanic beaches and a Bronze Age town buried in ash.',
  type: 'article',
  featured: m.santoriniOia,
  categories: ['Destinations', 'Travel Tips'],
  tags: ['Greece', 'Santorini', 'Islands', 'Hiking'],
  seoTitle: 'Santorini Guide: Caldera Hike, Beaches & Akrotiri',
  seoDescription:
    'How to enjoy Santorini beyond Oia’s sunset: the Fira–Oia caldera hike, volcanic beaches, Akrotiri and when to visit.',
  body: doc(
    p(
      'Santorini is the rim of a volcano. A huge eruption in the Late Bronze Age, around 3,600 years ago, collapsed the centre of the island and the sea poured in, leaving the ',
      b('caldera'),
      ': a lagoon ringed by cliffs, with white villages balanced on top.',
    ),
    destination({
      destination: 'Santorini (Thira)',
      country: 'Greece',
      region: 'Cyclades, South Aegean',
      bestSeason: 'May–June, September–October',
      currency: 'Euro (EUR)',
      language: 'Greek',
      elevation: 'Cliffs up to about 300 m',
      highlights: ['Fira–Oia caldera path', 'Akrotiri excavations', 'Volcanic beaches'],
    }),
    h2('Walk the caldera rim'),
    p(
      'The path from ',
      b('Fira to Oia'),
      ' runs about 10 km along the clifftops through Firostefani and Imerovigli. Allow three to four hours and start early: there is little shade.',
    ),
    image(m.santoriniFira, m.santoriniFira.caption),
    h2('Beaches of black and red'),
    p(
      'Santorini’s beaches are volcanic: dark sand at Perissa and Kamari, and red cliffs near Akrotiri.',
    ),
    image(m.santoriniBeach, m.santoriniBeach.caption),
    callout('warning', [
      b('Rockfalls. '),
      'Parts of Red Beach have been closed because of falling rock. Obey the signs and do not sit under the cliffs.',
    ]),
    h2('Akrotiri: a Bronze Age town under ash'),
    p(
      'The eruption buried the town of Akrotiri, preserving multi-storey houses, streets and wall paintings. A roof now covers the excavations; give yourself at least an hour.',
    ),
    image(m.santoriniDomes, m.santoriniDomes.caption),
    h2('Sunset without the crush'),
    ol(
      'Oia’s castle viewpoint fills an hour before sunset: arrive early or skip it',
      'Imerovigli and Firostefani have almost the same view with fewer people',
      'A boat trip in the caldera puts the sunset on the water',
    ),
    image(m.santoriniSunset, m.santoriniSunset.caption),
    ul(
      'Wear shoes with grip: marble steps are slippery',
      'Carry water on the caldera path',
      'Visit in shoulder season for calmer villages',
    ),
    quote('Santorini looks best from the path, not from the crowd.'),
  ),
});
