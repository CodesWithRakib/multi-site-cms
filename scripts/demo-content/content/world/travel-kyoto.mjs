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
  slug: 'kyoto-temples-shrines-three-days',
  title: 'Three Days in Kyoto: Golden Temples, Ten Thousand Gates and Quiet Bamboo',
  excerpt:
    'Kyoto rewards early starts. A three-day plan for Kinkaku-ji, Fushimi Inari, Arashiyama and the old streets of Gion, with tips to beat the crowds.',
  type: 'travel_guide',
  featured: m.kyotoKinkakuji,
  categories: ['Destinations', 'Culture', 'Guides'],
  tags: ['Japan', 'Kyoto', 'Temples', 'UNESCO'],
  seoTitle: 'Kyoto in Three Days: Temples, Shrines & Gion',
  seoDescription:
    'A practical three-day Kyoto itinerary: Kinkaku-ji, Fushimi Inari, Arashiyama bamboo grove, Kiyomizu-dera and Gion, plus seasons and etiquette.',
  body: doc(
    p(
      'For more than a thousand years Kyoto was Japan’s imperial capital, and it still holds ',
      b('seventeen sites'),
      ' listed together by UNESCO as the Historic Monuments of Ancient Kyoto. You cannot see them all in three days, and you should not try. Pick a few, arrive early and leave time to wander.',
    ),
    destination({
      destination: 'Kyoto',
      country: 'Japan',
      region: 'Kansai',
      bestSeason: 'Late March–early April, mid-November–early December',
      currency: 'Japanese yen (JPY)',
      language: 'Japanese',
      elevation: 'About 50 m',
      highlights: ['Kinkaku-ji', 'Fushimi Inari Taisha', 'Arashiyama', 'Gion'],
    }),
    h2('Day 1: Fushimi Inari at dawn'),
    p(
      'The tunnels of vermilion ',
      b('torii gates'),
      ' at Fushimi Inari Taisha are open all day and night. Arrive before 8 am and the lower paths are almost empty. The full loop to the top of Mount Inari takes two to three hours; most visitors turn back at the Yotsutsuji viewpoint, about halfway.',
    ),
    image(m.kyotoFushimi, m.kyotoFushimi.caption),
    h2('Day 2: Arashiyama and the Golden Pavilion'),
    p(
      'Start in the ',
      b('Arashiyama bamboo grove'),
      ' at opening light, then walk to Tenryu-ji’s garden. In the afternoon, cross the city to Kinkaku-ji, the Zen temple whose top two floors are covered in gold leaf. The building you see was rebuilt in 1955 after a fire.',
    ),
    image(m.kyotoArashiyama, m.kyotoArashiyama.caption),
    h2('Day 3: Kiyomizu-dera to Gion'),
    p(
      'Kiyomizu-dera’s wooden stage juts out over the hillside. From there, walk down the stone lanes of Sannenzaka and Ninenzaka into ',
      b('Gion'),
      ', where wooden machiya houses line the streets.',
    ),
    image(m.kyotoGion, m.kyotoGion.caption),
    callout('warning', [
      b('Respect Gion’s residents. '),
      'Some private lanes in Gion are closed to tourists. Never stop or photograph geiko and maiko without permission.',
    ]),
    h2('Getting around'),
    table(
      ['Option', 'Good for', 'Tip'],
      [
        ['City bus', 'Temples outside the centre', 'Very crowded at peak times; go early'],
        ['Subway and JR lines', 'Fushimi Inari, Arashiyama', 'Faster than buses for longer hops'],
        ['Bicycle', 'Flat central districts', 'Park only in marked bicycle lots'],
      ],
    ),
    h3('Before you go'),
    ol(
      'Load a rechargeable IC card (ICOCA, Suica) for trains and buses',
      'Book cherry-blossom and autumn stays months ahead',
      'Carry a little cash: some temples and small shops do not take cards',
    ),
    ul(
      'Take your shoes off where asked',
      'Keep voices low in temple grounds',
      'Carry your rubbish: public bins are rare',
    ),
    image(m.kyotoKiyomizu, m.kyotoKiyomizu.caption),
    quote('In Kyoto, the best hour of the day is the first one.'),
  ),
});
