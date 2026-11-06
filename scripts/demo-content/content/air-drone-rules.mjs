import { b, callout, doc, h2, i, link, ol, p, table, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'flying-drones-in-bangladesh-guide',
  title: 'Flying a Drone in Bangladesh: Permission, No-Fly Zones and Good Practice',
  excerpt:
    'Drones are subject to registration and permission rules in Bangladesh. Here is what recreational pilots should check before taking off, and how to fly safely.',
  type: 'article',
  featured: m.dhakaAerial,
  categories: ['Drones'],
  tags: ['Drones', 'CAAB', 'Safety', 'Rules'],
  seoTitle: 'Drone Rules in Bangladesh: What to Check Before You Fly',
  seoDescription:
    'A practical guide to flying drones in Bangladesh: registration and permission, restricted areas near airports and safe flying habits.',
  body: doc(
    p(
      'Drones have opened up a new way to see Bangladesh, from city flyovers to the tea hills. But drones are not toys in the eyes of the law. Bangladesh has a ',
      b('drone registration and flying policy'),
      ' (adopted in 2020), and flights need the right permission.',
    ),
    callout('warning', [
      b('Rules change. '),
      'This guide is general advice, not legal advice. Always confirm the current requirements with the ',
      link('Civil Aviation Authority of Bangladesh (CAAB)', 'https://caab.gov.bd/'),
      ' before you fly.',
    ]),
    h2('Before you take off'),
    ol(
      [b('Register your drone '), 'as the current policy requires for its weight class'],
      [b('Get permission '), 'for your flight, especially in cities and near sensitive sites'],
      [b('Check the area '), 'for restrictions such as airports and protected installations'],
      [b('Check the weather: '), 'wind and haze change quickly'],
    ),
    h2('Where not to fly'),
    table(
      ['Area', 'Why'],
      [
        [
          'Near airports such as Hazrat Shahjalal International',
          'Risk to aircraft; controlled airspace',
        ],
        ['Military areas and key installations', 'Security restrictions'],
        ['Over crowds, rallies and events', 'Injury risk if the drone falls'],
        ['Over private homes without consent', 'Privacy'],
      ],
    ),
    h2('Fly like a professional'),
    ul(
      'Keep the drone in sight at all times',
      'Do a pre-flight check: propellers, batteries, compass',
      'Land with at least 25% battery left',
      'Respect people’s privacy: no filming into homes',
    ),
    callout('tip', [
      b('Monsoon flying: '),
      'humid air and sudden gusts drain batteries and push small drones off course. Keep flights short and close.',
    ]),
    p(i('Wondering when the sky is calmest? See our guide to Bangladesh’s flying seasons.')),
  ),
});
