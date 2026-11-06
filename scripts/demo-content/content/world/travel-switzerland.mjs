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
  slug: 'swiss-alps-by-train',
  title: 'The Swiss Alps by Train: Zermatt, Lauterbrunnen and Lucerne',
  excerpt:
    'Switzerland’s trains reach the foot of the Matterhorn and the waterfall valley of Lauterbrunnen. How to plan a car-free Alpine week, and which pass to buy.',
  type: 'article',
  featured: m.swissMatterhorn,
  categories: ['Destinations', 'Travel Tips'],
  tags: ['Switzerland', 'Alps', 'Trains', 'Mountains'],
  seoTitle: 'Swiss Alps by Train: Zermatt, Lauterbrunnen, Lucerne',
  seoDescription:
    'A car-free week in the Swiss Alps: Zermatt and the Matterhorn, Lauterbrunnen valley, Oeschinensee and Lucerne, plus rail pass tips.',
  body: doc(
    p(
      'Swiss trains run on time, connect with buses and boats, and climb into the mountains. You do not need a car to see the Alps, and in ',
      b('Zermatt'),
      ' you cannot bring one: the village is car-free.',
    ),
    destination({
      destination: 'Swiss Alps',
      country: 'Switzerland',
      region: 'Valais, Bernese Oberland, Central Switzerland',
      bestSeason: 'June–September (hiking), December–March (snow)',
      currency: 'Swiss franc (CHF)',
      language: 'German, French, Italian, Romansh',
      elevation: 'Matterhorn summit 4,478 m',
      highlights: ['Matterhorn', 'Lauterbrunnen', 'Oeschinensee', 'Lucerne'],
    }),
    h2('Zermatt and the Matterhorn'),
    p(
      'The ',
      b('Matterhorn'),
      ' (4,478 m) appears over Zermatt’s rooftops. Take the Gornergrat railway for a view of it and the glaciers below Monte Rosa.',
    ),
    callout('tip', [
      b('Clear mornings. '),
      'The peak is often clearest early in the day; clouds tend to build by afternoon.',
    ]),
    h2('Lauterbrunnen'),
    p(
      'A deep glacial valley with sheer walls and dozens of waterfalls, Lauterbrunnen is the gateway to Wengen and Mürren. The ',
      b('Staubbach Falls'),
      ' drop almost 300 m just outside the village.',
    ),
    image(m.swissLauterbrunnen, m.swissLauterbrunnen.caption),
    h2('Oeschinensee'),
    image(m.swissOeschinen, m.swissOeschinen.caption),
    p(
      'A gondola from Kandersteg and a short walk bring you to this turquoise lake under steep cliffs. Hike the upper panorama trail for the classic view.',
    ),
    h2('Lucerne'),
    image(m.swissLucerne, m.swissLucerne.caption),
    p(
      'The covered wooden Chapel Bridge dates from the 14th century; much of it was rebuilt after a fire in 1993. Boats leave from the station for the lake and mountain railways.',
    ),
    h2('Scenic trains'),
    image(m.swissTrain, m.swissTrain.caption),
    table(
      ['Pass', 'Best for'],
      [
        [
          'Swiss Travel Pass',
          'Many journeys on consecutive days; includes most trains, buses and boats',
        ],
        ['Half Fare Card', 'Fewer journeys over a longer stay'],
        ['Point-to-point tickets', 'Two or three long trips only'],
      ],
    ),
    ol(
      'Reserve seats on panoramic trains in summer',
      'Check which mountain railways the pass discounts rather than covers',
      'Travel light: luggage can be sent ahead by rail',
    ),
    ul('Carry a rain shell even in summer', 'Mountain huts often take cash only'),
    quote('In Switzerland, the train window is the view.'),
  ),
});
