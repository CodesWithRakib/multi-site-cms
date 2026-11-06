import { b, callout, doc, h2, h3, i, image, p, quote, timeline, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'shakrain-kite-festival-old-dhaka',
  title: 'Shakrain: The Day Old Dhaka’s Rooftops Take to the Sky',
  excerpt:
    'Every January, on the last day of Poush, thousands of kites rise over Old Dhaka. A flyer’s guide to Shakrain: kite fights, string, timing and staying safe on the roof.',
  type: 'air_sports_update',
  featured: m.shakrainSky,
  categories: ['Kite Flying'],
  event: 'shakrain-festival-2027',
  tags: ['Shakrain', 'Old Dhaka', 'Kites', 'Festival'],
  seoTitle: 'Shakrain Kite Festival in Old Dhaka: A Flyer’s Guide',
  seoDescription:
    'What happens at Shakrain in Old Dhaka: kite fights, manja string, the timeline of the day and rooftop safety tips.',
  body: doc(
    p(
      'Shakrain is Old Dhaka’s kite festival, held on ',
      b('Poush Sankranti'),
      ', the last day of the Bengali month of Poush, which falls on 14 January under Bangladesh’s revised Bengali calendar. From morning until dark, families and friends crowd the rooftops of Shankhari Bazar, Sutrapur, Lakshmi Bazar and the surrounding neighbourhoods, and the sky fills with kites.',
    ),
    h2('How the day unfolds'),
    timeline({
      time: 'Morning',
      title: 'Rooftops fill up',
      description: 'Flyers carry reels and stacks of paper kites to the roofs; music starts early.',
      status: 'none',
      windSpeed: '',
      weatherCondition: 'Cool, often hazy',
      alertLevel: 'normal',
    }),
    timeline({
      time: 'Midday',
      title: 'Kite fights begin',
      description:
        'Flyers try to cut each other’s strings; a cut kite drifts away to cheers from the winning roof.',
      status: 'none',
      windSpeed: '',
      weatherCondition: 'Light winter breeze',
      alertLevel: 'normal',
    }),
    timeline({
      time: 'Evening',
      title: 'Lights and fire',
      description: 'After sunset, fireworks and lanterns take over from the kites.',
      status: 'none',
      windSpeed: '',
      weatherCondition: 'Clear',
      alertLevel: 'advisory',
    }),
    image(m.shakrainReel, m.shakrainReel.caption),
    h2('The kit'),
    ul(
      [b('Ghuri (kite): '), 'light paper kites on bamboo spars, bought in bulk before the day'],
      [b('Latai (reel): '), 'the wooden reel that holds the string'],
      [b('Manja: '), 'string coated with glue and fine glass powder, used to cut rival lines'],
    ),
    callout('warning', [
      b('Manja cuts skin and birds. '),
      'Handle glass-coated string with gloves or taped fingers, keep it away from children, and collect broken string afterwards so it does not trap birds.',
    ]),
    h3('Rooftop safety'),
    ul(
      'Stay well away from roof edges, especially when looking up at a kite',
      'Watch for loose wires and electric lines near the roof',
      'Keep a bucket of water nearby once fireworks start',
    ),
    callout('tip', [
      b('Visiting? '),
      'Ask a local host to take you up to a roof in Shankhari Bazar. Visitors are usually welcomed, and someone will hand you a reel.',
    ]),
    quote('On Shakrain the whole neighbourhood looks up at the same time.'),
    p(i('Dates follow the Bengali calendar; check the date each year.')),
  ),
});
