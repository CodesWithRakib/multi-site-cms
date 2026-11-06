import { b, callout, destination, doc, h2, image, ol, p, quote, table } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'norway-fjords-lofoten-northern-lights',
  title: 'Norway’s Fjords, Lofoten and the Northern Lights',
  excerpt:
    'Sheer fjord walls, a cliff that hangs 600 m over the water, fishing villages under jagged peaks and the aurora over Tromsø. When to go for each.',
  type: 'article',
  featured: m.norwayLofoten,
  categories: ['Destinations', 'Nature'],
  tags: ['Norway', 'Fjords', 'Lofoten', 'Aurora'],
  seoTitle: 'Norway Guide: Fjords, Lofoten & Northern Lights',
  seoDescription:
    'Plan a trip to Norway: Geirangerfjord, Preikestolen, Bergen, the Lofoten islands and northern lights in Tromsø, with the best season for each.',
  body: doc(
    p(
      'Norway’s coast is cut by fjords, long arms of the sea carved by glaciers. Two of them, ',
      b('Geirangerfjord'),
      ' and Nærøyfjord, are UNESCO World Heritage Sites.',
    ),
    destination({
      destination: 'Western Fjords & Lofoten',
      country: 'Norway',
      region: 'Vestland, Møre og Romsdal, Nordland',
      bestSeason: 'June–August (fjords), September–March (aurora)',
      currency: 'Norwegian krone (NOK)',
      language: 'Norwegian',
      elevation: 'Preikestolen 604 m above the fjord',
      highlights: ['Geirangerfjord', 'Preikestolen', 'Bergen', 'Lofoten'],
    }),
    h2('Geirangerfjord'),
    image(m.norwayGeiranger, m.norwayGeiranger.caption),
    p(
      'Take the ferry between Geiranger and Hellesylt for the Seven Sisters and the Suitor waterfalls, then drive up to the Dalsnibba viewpoint.',
    ),
    h2('Preikestolen (Pulpit Rock)'),
    p(
      'This flat-topped cliff stands ',
      b('604 m'),
      ' above Lysefjord. The hike is about 8 km return and takes around four hours.',
    ),
    image(m.norwayPreikestolen, m.norwayPreikestolen.caption),
    callout('warning', [
      b('No railings. '),
      'Keep well back from the edge, especially in wind or rain, and do not hike in winter without a guide.',
    ]),
    h2('Bergen'),
    image(m.norwayBergen, m.norwayBergen.caption),
    p(
      'The wooden buildings of Bryggen, the old Hanseatic wharf, are on the UNESCO list. Bergen is also the start of many fjord cruises and the Norway in a Nutshell route.',
    ),
    h2('Lofoten'),
    p(
      'Red fishing cabins, white beaches and peaks straight out of the sea. From late May to mid-July the sun does not set.',
    ),
    h2('Chasing the aurora'),
    image(m.norwayAurora, m.norwayAurora.caption),
    table(
      ['Season', 'What you get'],
      [
        ['Late May–mid July', 'Midnight sun in the north'],
        ['June–August', 'Hiking, open mountain roads'],
        ['September–March', 'Dark skies for northern lights'],
      ],
    ),
    ol(
      'Go well away from city lights',
      'Check the aurora and cloud forecasts',
      'Dress for -10 °C or colder and be patient',
    ),
    quote('In Norway, the light changes the whole trip.'),
  ),
});
