import { b, callout, destination, doc, h2, h3, i, image, p, table, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'bandarban-hills-nilgiri-boga-lake',
  title: 'Bandarban’s Hills: Nilgiri Views and the Road to Boga Lake',
  excerpt:
    'Bangladesh’s highest hills, cool mornings above the clouds and a lake hidden among the peaks. A practical guide to planning a Bandarban trip.',
  type: 'travel_guide',
  featured: m.nilgiriView,
  categories: ['Adventure', 'Nature', 'Guides'],
  tags: ['Bandarban', 'Hill Tracts', 'Trekking'],
  seoTitle: 'Bandarban Travel Guide: Nilgiri, Boga Lake & Permits',
  seoDescription:
    'Plan a Bandarban trip: Nilgiri viewpoint, Boga Lake, the Golden Temple, the best season and travel permissions.',
  body: doc(
    p(
      'Bandarban, in the Chittagong Hill Tracts, holds some of the highest hills in Bangladesh. It is home to the Marma, Bawm, Mro and other indigenous communities, and it rewards travellers who come slowly and respectfully.',
    ),
    destination({
      destination: 'Bandarban',
      country: 'Bangladesh',
      region: 'Chittagong Hill Tracts',
      bestSeason: 'October–March',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali and indigenous languages',
      elevation: 'Some of the highest hills in Bangladesh',
      highlights: [
        'Cloud views from Nilgiri',
        'Boga Lake, a natural lake high in the hills',
        'The Buddha Dhatu Jadi (Golden Temple) near town',
        'The Sangu river',
      ],
    }),
    callout('warning', [
      b('Check permissions before you go. '),
      'Access to parts of the Hill Tracts, especially remote trekking routes, is periodically restricted, and foreign visitors may need prior permission. Confirm the current rules with local authorities or a registered guide.',
    ]),
    h2('Where to go'),
    table(
      ['Place', 'Why go', 'Getting there'],
      [
        ['Nilgiri', 'Wide hill views, often above the clouds', 'By jeep from Bandarban town'],
        ['Buddha Dhatu Jadi', 'A golden Buddhist temple on a hill', 'Short ride from town'],
        [
          'Boga Lake',
          'A calm lake surrounded by hills',
          'By road via Ruma, then on foot or by jeep',
        ],
      ],
    ),
    image(m.nilgiriResort, m.nilgiriResort.caption),
    h2('Boga Lake'),
    p(
      'Boga Lake sits high in the hills beyond Ruma. Many visitors stay overnight in simple homestays run by the Bawm community and continue on foot to nearby peaks. Guides are usually required for the onward trails.',
    ),
    image(m.bogaLake, m.bogaLake.caption),
    h3('Packing for the hills'),
    ul(
      'Sturdy shoes with good grip',
      'A warm layer: nights are cool in winter',
      'Cash, a power bank and a torch',
      i('Your ID or passport, which checkpoints may ask to see'),
    ),
    callout('tip', [
      b('Hire a local guide. '),
      'They know the paths, the weather and the communities, and your money stays in the hills.',
    ]),
  ),
});
