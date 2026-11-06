import { b, callout, doc, h2, h3, image, ol, p, quote, table, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'first-tandem-skydive-guide',
  title: 'Your First Tandem Skydive: What Really Happens',
  excerpt:
    'From the briefing to the open door, sixty seconds of freefall and a quiet canopy ride: a minute-by-minute guide to a first tandem jump.',
  type: 'article',
  featured: m.skydiveCanopy,
  categories: ['Skydiving'],
  tags: ['Skydiving', 'Tandem', 'Beginners', 'Safety'],
  seoTitle: 'First Tandem Skydive: Briefing, Freefall & Landing',
  seoDescription:
    'What to expect on your first tandem skydive: training, the climb, freefall, opening the parachute and landing, plus limits and what to wear.',
  body: doc(
    p(
      'A tandem skydive is the easiest way to feel freefall. You are attached by a harness to an ',
      b('experienced instructor'),
      ' who handles everything: the exit, the parachute and the landing.',
    ),
    h2('Before the jump'),
    ol(
      'Sign the forms and confirm your weight and health',
      'A short briefing: the exit position, the arch, and legs up for landing',
      'Fit the harness; your instructor checks every buckle',
    ),
    image(m.skydivePlane, m.skydivePlane.caption),
    h2('The jump in numbers'),
    table(
      ['Stage', 'Typical'],
      [
        ['Exit altitude', '3,000–4,500 m (10,000–15,000 ft)'],
        ['Freefall', 'About 30–60 seconds'],
        ['Freefall speed', 'About 200 km/h'],
        ['Canopy ride', 'About 5–7 minutes'],
      ],
    ),
    image(m.skydiveFreefall, m.skydiveFreefall.caption),
    h2('Under the canopy'),
    p(
      'At about 1,500 m the instructor opens the main parachute. The noise stops and the ride becomes calm. Many instructors let you ',
      b('steer'),
      ' for a few turns.',
    ),
    h3('Landing'),
    p(
      'Lift your legs as briefed and let the instructor touch down first. Most landings are a gentle slide or a few running steps.',
    ),
    image(m.skydiveLanding, m.skydiveLanding.caption),
    callout('info', [
      b('Two parachutes. '),
      'Every tandem rig carries a main and a reserve, plus an automatic activation device that opens the reserve if needed.',
    ]),
    h2('Check before you book'),
    ul(
      'Weight limits (often around 95–100 kg) and minimum age',
      'Medical conditions: ask your doctor if unsure',
      'Wait 24 hours after scuba diving before flying or jumping',
    ),
    callout('warning', [
      b('Weather holds are normal. '),
      'Clouds and wind can delay jumps for hours. Leave the whole day free.',
    ]),
    quote('The door opens, and then everything goes quiet.'),
  ),
});
