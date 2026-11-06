import {
  b,
  br,
  callout,
  destination,
  doc,
  h2,
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
  slug: 'sajek-valley-kingdom-of-clouds',
  title: 'Sajek Valley: Waking Up Above the Clouds in the Chittagong Hill Tracts',
  excerpt:
    'Bangladesh’s “kingdom of clouds” is a hilltop village where mornings start above a white sea. How to get there, when to go, and how to be a good guest.',
  type: 'article',
  featured: m.sajekCottages,
  categories: ['Destinations', 'Adventure', 'Nature'],
  tags: ['Sajek', 'Rangamati', 'Hill Tracts'],
  seoTitle: 'Sajek Valley Travel Guide: Route, Season & Tips',
  seoDescription:
    'How to visit Sajek Valley in Rangamati: the jeep route from Khagrachhari, best season for clouds, and local etiquette.',
  body: doc(
    p(
      'Sajek is a small ridge-top settlement in the Baghaichhari area of Rangamati district. It became famous for one thing: on many mornings the valleys below fill with cloud, and the village seems to float above it. Locals call it the ',
      i('kingdom of clouds'),
      '.',
    ),
    destination({
      destination: 'Sajek Valley',
      country: 'Bangladesh',
      region: 'Rangamati, Chittagong Hill Tracts',
      bestSeason: 'June–November for clouds; December–February for clear views',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali and local indigenous languages',
      elevation: 'About 1,800 ft (550 m)',
      highlights: [
        'Sunrise over a sea of clouds',
        'Konglak Para, the highest point nearby',
        'Hill views in every direction',
        'Simple cottages run by local families',
      ],
    }),
    h2('Getting there'),
    ol(
      [b('Dhaka to Khagrachhari'), ' by overnight bus'],
      [
        b('Khagrachhari to Sajek'),
        ' by hired jeep (locally called chander gari) along a winding hill road',
      ],
      [b('Check in'), ' at your cottage and walk the ridge before sunset'],
    ),
    callout('info', [
      b('Vehicles usually travel at set times. '),
      'On the road to Sajek, jeeps typically move in escorted groups at fixed hours. Ask your driver or guesthouse for the current schedule before you set off.',
    ]),
    image(m.sajekSunrise, m.sajekSunrise.caption),
    h2('Clouds or views? Pick your season'),
    table(
      ['Season', 'What to expect'],
      [
        [
          'June–September (monsoon)',
          'Green hills and frequent cloud seas; the road can be slippery',
        ],
        ['October–November', 'Often the best balance of clouds and clear skies'],
        ['December–February', 'Cool, dry and clear; fewer clouds, long views'],
        ['March–May', 'Hot and hazy, with occasional storms'],
      ],
    ),
    image(m.sajekVillage, m.sajekVillage.caption),
    h2('Be a good guest'),
    ul(
      'Sajek is home to indigenous communities: ask before you photograph people or homes',
      'Keep noise down at night; sound carries far on the ridge',
      'Carry your rubbish back down the hill',
    ),
    quote('Set an alarm for five. The clouds do not wait.'),
    p(
      b('Before you go:'),
      br(),
      'bring a light jacket even in summer, carry cash, and expect a weak mobile signal on the ridge.',
    ),
  ),
});
