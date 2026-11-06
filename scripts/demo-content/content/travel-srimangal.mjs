import {
  b,
  callout,
  code,
  destination,
  doc,
  h2,
  h3,
  i,
  image,
  p,
  quote,
  table,
  ul,
} from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'srimangal-tea-capital-weekend',
  title: 'A Weekend in Srimangal, the Tea Capital of Bangladesh',
  excerpt:
    'Endless tea gardens, gibbons in the rainforest at Lawachara and the famous seven-layer tea: a slow weekend plan for Srimangal.',
  type: 'travel_guide',
  featured: m.teaGarden,
  categories: ['Destinations', 'Nature', 'Food Travel'],
  tags: ['Srimangal', 'Sylhet', 'Tea'],
  seoTitle: 'Srimangal Weekend Guide: Tea Gardens & Lawachara',
  seoDescription:
    'Plan two days in Srimangal: tea estates, Lawachara National Park, the seven-layer tea and how to get there from Dhaka.',
  body: doc(
    p(
      'Srimangal, in Moulvibazar district, is surrounded by tea estates in every direction, which is why it is known as the ',
      b('tea capital of Bangladesh'),
      '. The Bangladesh Tea Research Institute is based here too. It is an easy, green escape from Dhaka.',
    ),
    destination({
      destination: 'Srimangal',
      country: 'Bangladesh',
      region: 'Moulvibazar, Sylhet Division',
      bestSeason: 'October–March (dry); June–September for the greenest gardens',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali',
      elevation: 'Low hills',
      highlights: [
        'Walks through working tea estates',
        'Lawachara National Park and its gibbons',
        'Seven-layer tea',
        'Pineapple and lemon gardens',
      ],
    }),
    h2('Two-day plan'),
    table(
      ['When', 'Plan'],
      [
        ['Day 1 morning', 'Train from Dhaka on the Sylhet line'],
        ['Day 1 afternoon', 'Walk or cycle through the tea estates around town'],
        ['Day 1 evening', 'Seven-layer tea'],
        ['Day 2 morning', 'Lawachara National Park with a local guide'],
        ['Day 2 afternoon', 'Return to Dhaka'],
      ],
    ),
    image(m.teaPath, m.teaPath.caption),
    h2('Lawachara National Park'),
    p(
      'Lawachara is a patch of evergreen forest just outside town, best known for the endangered ',
      b('western hoolock gibbon'),
      ', the only ape found in Bangladesh. Listen for their calls early in the morning. The Dhaka–Sylhet railway runs right through the forest.',
    ),
    image(m.lawachara, m.lawachara.caption),
    callout('tip', [
      b('Hire a local guide at the park entrance. '),
      'They know where the gibbons have been feeding and keep you on the right trails.',
    ]),
    h3('The seven-layer tea'),
    p(
      'Srimangal’s most famous drink stacks several colours of tea in a single glass. It was made popular by the Nilkantha Tea Cabin. Order the ',
      code('7 layer'),
      ' and drink it slowly, layer by layer.',
    ),
    callout('warning', [
      b('Leeches love the monsoon. '),
      'In the rainy season, wear long socks and closed shoes in the forest and the gardens.',
    ]),
    h2('Good to know'),
    ul(
      'Tea estates are workplaces: stay on paths and ask before entering a garden',
      'Mornings are the coolest and quietest time for walks',
      i('Bring cash; small shops may not take cards'),
    ),
    quote('In Srimangal, every road seems to end in another tea garden.'),
  ),
});
