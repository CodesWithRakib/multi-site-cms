import {
  b,
  callout,
  destination,
  doc,
  h2,
  h3,
  image,
  ol,
  p,
  quote,
  table,
} from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'iceland-south-coast-road-trip',
  title: 'Iceland’s South Coast: Waterfalls, Black Sand and a Lagoon Full of Ice',
  excerpt:
    'From Seljalandsfoss to Jökulsárlón, the south coast packs Iceland’s classic sights along one road. A road-trip plan, with the safety rules that really matter.',
  type: 'travel_guide',
  featured: m.icelandSkogafoss,
  categories: ['Adventure', 'Nature', 'Guides'],
  tags: ['Iceland', 'Road Trip', 'Waterfalls', 'Glaciers'],
  seoTitle: 'Iceland South Coast Road Trip: Stops & Safety',
  seoDescription:
    'Plan a road trip along Iceland’s south coast: Seljalandsfoss, Skógafoss, Reynisfjara, Jökulsárlón and Kirkjufell, plus driving and beach safety.',
  body: doc(
    p(
      'Route 1, Iceland’s ',
      b('Ring Road'),
      ', circles the island in about 1,300 km. Its southern stretch is the most visited for good reason: waterfalls, glaciers and black beaches sit within sight of the road.',
    ),
    destination({
      destination: 'South Coast and Snæfellsnes',
      country: 'Iceland',
      region: 'Suðurland and Vesturland',
      bestSeason: 'June–August for driving; September–March for aurora',
      currency: 'Icelandic króna (ISK)',
      language: 'Icelandic',
      elevation: 'Sea level to glacier edges',
      highlights: ['Seljalandsfoss', 'Skógafoss', 'Reynisfjara', 'Jökulsárlón'],
    }),
    h2('The route'),
    table(
      ['Stop', 'From Reykjavík', 'Do not miss'],
      [
        ['Seljalandsfoss', 'About 2 hours', 'The path behind the falls (wet!)'],
        ['Skógafoss', 'About 2.5 hours', 'Stairs to the top viewpoint'],
        ['Reynisfjara', 'About 3 hours', 'Basalt columns and sea stacks'],
        ['Jökulsárlón', 'About 5 hours', 'Icebergs and Diamond Beach'],
      ],
    ),
    image(m.icelandSeljalandsfoss, m.icelandSeljalandsfoss.caption),
    h2('Reynisfjara: beautiful and dangerous'),
    image(m.icelandReynisfjara, m.icelandReynisfjara.caption),
    callout('warning', [
      b('Sneaker waves kill. '),
      'At Reynisfjara, waves can surge far up the beach without warning. Stay well back from the water, never turn your back on the sea and follow the warning lights.',
    ]),
    h2('Jökulsárlón glacier lagoon'),
    p(
      'Icebergs break off Breiðamerkurjökull and drift through the lagoon to the sea. Across the road, chunks of ice wash up on the black sand of ',
      b('Diamond Beach'),
      '.',
    ),
    image(m.icelandJokulsarlon, m.icelandJokulsarlon.caption),
    h3('A detour west: Kirkjufell'),
    p(
      'On the Snæfellsnes peninsula, Kirkjufell’s cone rises above a small waterfall. It is a long day from Reykjavík, but worth it.',
    ),
    image(m.icelandKirkjufell, m.icelandKirkjufell.caption),
    h2('Driving rules'),
    ol(
      'Never drive off-road: it is illegal and scars the land for decades',
      'F-roads (mountain roads) need a 4×4 and are open only in summer',
      'Check road conditions and weather alerts every morning',
      'Fill up when you can: fuel stations are far apart in the east',
    ),
    quote('In Iceland, the weather decides the plan. Keep a spare day.'),
  ),
});
