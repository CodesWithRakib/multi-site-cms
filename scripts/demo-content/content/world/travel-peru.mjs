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
  ul,
} from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'machu-picchu-cusco-sacred-valley',
  title: 'Machu Picchu, Cusco and the Sacred Valley: Planning the Andes Right',
  excerpt:
    'Altitude, timed tickets and trains: how to plan Peru’s classic Andean route so you arrive at Machu Picchu rested, on time and with the right ticket.',
  type: 'travel_guide',
  featured: m.peruMachuPicchu,
  categories: ['Destinations', 'Adventure', 'Guides'],
  tags: ['Peru', 'Machu Picchu', 'Andes', 'UNESCO'],
  seoTitle: 'Machu Picchu & Cusco Guide: Altitude, Tickets, Trains',
  seoDescription:
    'Plan Machu Picchu, Cusco and the Sacred Valley: acclimatising to altitude, timed entry tickets, trains and the best season.',
  body: doc(
    p(
      'Built by the Inca in the 15th century and rediscovered by the wider world in 1911, ',
      b('Machu Picchu'),
      ' sits on a ridge at about 2,430 m above the Urubamba River. Getting there well is mostly about two things: altitude and tickets.',
    ),
    destination({
      destination: 'Machu Picchu & Cusco',
      country: 'Peru',
      region: 'Cusco Region',
      bestSeason: 'May–September (dry season)',
      currency: 'Peruvian sol (PEN)',
      language: 'Spanish, Quechua',
      elevation: 'Cusco about 3,400 m; Machu Picchu about 2,430 m',
      highlights: ['Machu Picchu', 'Sacred Valley', 'Cusco', 'Lake Titicaca'],
    }),
    h2('Acclimatise first'),
    p(
      'Cusco is higher than Machu Picchu. Many travellers start lower, in the ',
      b('Sacred Valley'),
      ' (about 2,800–2,900 m), and move up to Cusco after a couple of days.',
    ),
    image(m.peruSacredValley, m.peruSacredValley.caption),
    callout('warning', [
      b('Altitude sickness is common. '),
      'Headache, nausea and breathlessness are warning signs. Rest, drink water, avoid alcohol on the first days and descend if symptoms get worse. Ask your doctor before you travel.',
    ]),
    h2('Tickets and circuits'),
    p(
      'Entry is by ',
      b('timed ticket'),
      ' on a set circuit through the site, and numbers are capped. Book weeks or months ahead for the dry season, and book Huayna Picchu or Machu Picchu Mountain separately if you want the climb.',
    ),
    table(
      ['Way in', 'Time', 'Notes'],
      [
        [
          'Train to Aguas Calientes + bus',
          'About 3–4 hours from Ollantaytambo area',
          'Easiest option',
        ],
        ['Classic Inca Trail', '4 days', 'Permits sell out; trail closed in February'],
        ['Short Inca Trail', '1–2 days', 'Arrive through the Sun Gate'],
      ],
    ),
    h2('Cusco'),
    image(m.peruCusco, m.peruCusco.caption),
    p(
      'Inca stone walls carry colonial churches in the old capital. Give it at least two days: Sacsayhuamán, San Pedro market and the San Blas quarter.',
    ),
    h3('Add-ons'),
    ul(
      [b('Vinicunca (Rainbow Mountain): '), 'a long, very high day hike, around 5,000 m'],
      [b('Lake Titicaca: '), 'the Uros floating islands near Puno, around 3,800 m'],
    ),
    image(m.peruRainbow, m.peruRainbow.caption),
    image(m.peruTiticaca, m.peruTiticaca.caption),
    ol(
      'Carry your passport: it is checked at the gate',
      'Bring rain gear even in the dry season',
      'Stay on the marked circuit',
    ),
    quote('The Andes set the pace. Let them.'),
  ),
});
