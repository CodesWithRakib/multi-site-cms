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
  slug: 'rome-in-three-days',
  title: 'Rome in Three Days: Ancient Ruins, the Vatican and Trastevere Nights',
  excerpt:
    'The Colosseum and the Forum, St Peter’s and the Vatican Museums, a coin in the Trevi Fountain and dinner in Trastevere. A realistic plan for a first visit.',
  type: 'article',
  featured: m.romeColosseum,
  categories: ['Destinations', 'Culture', 'Food Travel'],
  tags: ['Italy', 'Rome', 'History', 'City Break'],
  seoTitle: 'Rome in Three Days: Colosseum, Vatican & Trastevere',
  seoDescription:
    'A first-timer’s three-day Rome plan: the Colosseum, Roman Forum, Vatican, Trevi Fountain and Trastevere, with ticket and food tips.',
  body: doc(
    p(
      'Rome layers nearly three thousand years of history on top of each other. Three days is enough for the highlights if you ',
      b('book the big sights'),
      ' and walk everywhere else.',
    ),
    destination({
      destination: 'Rome',
      country: 'Italy',
      region: 'Lazio',
      bestSeason: 'April–June, September–October',
      currency: 'Euro (EUR)',
      language: 'Italian',
      elevation: 'About 20–50 m, on seven hills',
      highlights: ['Colosseum', 'Roman Forum', 'Vatican', 'Trastevere'],
    }),
    h2('Day 1: Ancient Rome'),
    p(
      'The Colosseum opened in 80 CE. One ticket usually covers it with the Roman Forum and the Palatine Hill; book a timed slot.',
    ),
    image(m.romeForum, m.romeForum.caption),
    h2('Day 2: The Vatican'),
    image(m.romeVatican, m.romeVatican.caption),
    p(
      'Bernini’s colonnade wraps around ',
      b('St Peter’s Square'),
      '. Book the Vatican Museums ahead and go early or late to see the Sistine Chapel with fewer people.',
    ),
    callout('info', [
      b('Dress code. '),
      'Shoulders and knees must be covered in St Peter’s Basilica and the Vatican Museums.',
    ]),
    h2('Day 3: Fountains and Trastevere'),
    image(m.romeTrevi, m.romeTrevi.caption),
    p(
      'Tradition says a coin thrown into the Trevi Fountain means you will return to Rome. In the evening, cross the river to Trastevere’s cobbled lanes.',
    ),
    image(m.romeTrastevere, m.romeTrastevere.caption),
    h2('Eat like a Roman'),
    table(
      ['Dish', 'What it is'],
      [
        ['Cacio e pepe', 'Pasta with pecorino cheese and black pepper'],
        ['Carbonara', 'Egg, guanciale, pecorino, pepper (no cream)'],
        ['Supplì', 'Fried rice ball with mozzarella'],
      ],
    ),
    ol(
      'Validate tickets on buses and trams',
      'Fill your bottle at the free street fountains (nasoni)',
      'Avoid restaurants with pictures on the menu near the big sights',
    ),
    ul('Wear comfortable shoes: cobblestones are hard on feet', 'Watch your bag on crowded buses'),
    quote('In Rome, look down as well as up: the past is under your feet.'),
  ),
});
