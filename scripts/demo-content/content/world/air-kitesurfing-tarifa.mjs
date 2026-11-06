import { b, callout, doc, h2, image, ol, p, quote, table, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'learn-kitesurfing-tarifa',
  title: 'Learning to Kitesurf in Tarifa, Europe’s Wind Capital',
  excerpt:
    'Between the Atlantic and the Mediterranean, Tarifa gets wind most days of the year. How lessons work, which wind to learn in and how long it takes to ride.',
  type: 'article',
  featured: m.kiteTarifa,
  categories: ['Kitesurfing'],
  tags: ['Spain', 'Tarifa', 'Kitesurfing', 'Beginners'],
  seoTitle: 'Learn to Kitesurf in Tarifa: Winds, Lessons & Safety',
  seoDescription:
    'A beginner’s guide to kitesurfing in Tarifa, Spain: Levante and Poniente winds, how lessons are structured, safety systems and the best beaches.',
  body: doc(
    p(
      'Tarifa sits at the southern tip of Spain, where the Strait of Gibraltar funnels the wind. It is one of Europe’s main ',
      b('kitesurfing'),
      ' centres, with long beaches and schools along the coast.',
    ),
    h2('Two winds'),
    table(
      ['Wind', 'From', 'For learners'],
      [
        ['Poniente', 'West (Atlantic)', 'Steadier and softer: good for lessons'],
        ['Levante', 'East (Mediterranean)', 'Often strong and gusty: for experienced riders'],
      ],
    ),
    h2('How lessons work'),
    ol(
      'Ground school: wind window, safety and setting up the kite',
      'Flying a trainer kite, then a full kite on the beach',
      'Body dragging in the water without a board',
      'Water start and first rides',
    ),
    p(
      'Most people need around ',
      b('9–12 hours'),
      ' of lessons before their first short rides. Choose a school with certified instructors and radio helmets.',
    ),
    image(m.kiteKites, m.kiteKites.caption),
    callout('warning', [
      b('Know your safety release. '),
      'Practise the quick release until it is automatic. Never fly near power lines, roads or swimmers, and never go out alone in offshore wind.',
    ]),
    h2('After the lessons'),
    image(m.kiteJump, m.kiteJump.caption),
    ul(
      'Respect bathing zones: kiting is restricted on some beaches in summer',
      'Rinse your gear in fresh water',
      'Ask locals which spot suits the day’s wind',
    ),
    image(m.kiteWindsurf, m.kiteWindsurf.caption),
    quote('In Tarifa, the question is never whether there is wind, but which one.'),
  ),
});
