import { b, callout, doc, h2, image, ol, p, quote, table, timeline, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'paragliding-pokhara-nepal',
  title: 'Paragliding in Pokhara: Flying With the Himalaya',
  excerpt:
    'Launch from Sarangkot, ride thermals beside the Annapurna range and land by Phewa Lake. What a tandem flight in Pokhara involves, and when the air is best.',
  type: 'article',
  featured: m.pokharaParagliders,
  categories: ['Paragliding'],
  tags: ['Nepal', 'Pokhara', 'Tandem', 'Himalaya'],
  seoTitle: 'Paragliding in Pokhara, Nepal: Season, Safety & Tandem Flights',
  seoDescription:
    'Tandem paragliding from Sarangkot over Pokhara: the flying season, what happens on the day, choosing a pilot and what to wear.',
  body: doc(
    p(
      'Pokhara is one of the world’s best-known paragliding sites. Pilots launch from ',
      b('Sarangkot'),
      ', a ridge above the town, and climb in thermals with the snow peaks of the Annapurna range ahead of them.',
    ),
    image(m.pokharaAnnapurna, m.pokharaAnnapurna.caption),
    h2('When to fly'),
    table(
      ['Months', 'Conditions'],
      [
        ['October–November', 'Clear mountain views, stable thermals: the best season'],
        ['December–February', 'Cool, calm mornings, gentle flights'],
        ['March–May', 'Strong thermals, more haze'],
        ['June–September', 'Monsoon: most commercial flights stop'],
      ],
    ),
    h2('Your flight, step by step'),
    timeline({
      time: '09:00',
      title: 'Drive to Sarangkot',
      description: 'A jeep climbs to the take-off field above Pokhara.',
      status: 'none',
      windSpeed: '5–10 km/h',
      weatherCondition: 'Clear',
      alertLevel: 'normal',
    }),
    timeline({
      time: '09:45',
      title: 'Briefing and launch',
      description:
        'Your pilot clips you in and explains the run. A few steps forward and you are airborne.',
      status: 'none',
      windSpeed: '8–12 km/h',
      weatherCondition: 'Thermals building',
      alertLevel: 'normal',
    }),
    timeline({
      time: '10:15',
      title: 'Landing by Phewa Lake',
      description: 'After 20–45 minutes in the air, you land on the field by the lakeshore.',
      status: 'none',
      windSpeed: '',
      weatherCondition: 'Sunny',
      alertLevel: 'normal',
    }),
    image(m.pokharaSarangkot, m.pokharaSarangkot.caption),
    h2('Choosing an operator'),
    ol(
      'Pick a company registered with the local tourism authority',
      'Ask about the pilot’s experience and the age of the glider',
      'Make sure a reserve parachute and helmet are included',
    ),
    callout('warning', [
      b('Weather comes first. '),
      'If your pilot postpones or cancels because of wind or cloud, accept it. Plan a spare day.',
    ]),
    h2('What to wear'),
    ul('Closed shoes with grip', 'A warm layer: it is cold at height', 'Sunglasses on a strap'),
    image(m.pokharaMachapuchare, m.pokharaMachapuchare.caption),
    image(m.pokharaPhewa, m.pokharaPhewa.caption),
    quote('Over Pokhara you share the thermals with eagles and the view with the Himalaya.'),
  ),
});
