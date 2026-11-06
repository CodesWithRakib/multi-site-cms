import { b, callout, destination, doc, h2, image, ol, p, quote, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'istanbul-two-continents-guide',
  title: 'Istanbul: A City on Two Continents',
  excerpt:
    'Hagia Sophia and the Blue Mosque, the lanes of the Grand Bazaar, a ferry across the Bosphorus and the view from Galata Tower: Istanbul in four days.',
  type: 'article',
  featured: m.istanbulBosphorus,
  categories: ['Destinations', 'Culture', 'Food Travel'],
  tags: ['Turkey', 'Istanbul', 'History', 'City Break'],
  seoTitle: 'Istanbul in Four Days: Mosques, Bazaars & Bosphorus',
  seoDescription:
    'A four-day Istanbul guide: Hagia Sophia, the Blue Mosque, the Grand Bazaar, Bosphorus ferries and Galata, with etiquette and transport tips.',
  body: doc(
    p(
      'Istanbul has been Byzantium, Constantinople and the Ottoman capital. The ',
      b('Bosphorus'),
      ' splits it between Europe and Asia, and a public ferry is the cheapest way to cross from one continent to the other.',
    ),
    destination({
      destination: 'Istanbul',
      country: 'Türkiye',
      region: 'Marmara',
      bestSeason: 'April–May, September–November',
      currency: 'Turkish lira (TRY)',
      language: 'Turkish',
      elevation: 'Sea level to hills of about 100 m',
      highlights: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar', 'Bosphorus'],
    }),
    h2('Sultanahmet'),
    p(
      'Hagia Sophia was completed in 537 and is again a working ',
      b('mosque'),
      '. Across the square, the Sultan Ahmed Mosque, known as the Blue Mosque for its tiles, has six minarets.',
    ),
    image(m.istanbulHagiaSophia, m.istanbulHagiaSophia.caption),
    image(m.istanbulBlueMosque, m.istanbulBlueMosque.caption),
    callout('info', [
      b('Visiting mosques. '),
      'Cover shoulders and knees; women cover their hair. Remove your shoes, and avoid visiting during prayer times, especially Friday midday.',
    ]),
    h2('The Grand Bazaar'),
    image(m.istanbulBazaar, m.istanbulBazaar.caption),
    p(
      'One of the world’s oldest covered markets, with thousands of shops across dozens of lanes. Agree a price before you buy, and drink the tea you are offered.',
    ),
    h2('Galata and Beyoğlu'),
    image(m.istanbulGalata, m.istanbulGalata.caption),
    p(
      'Cross the Galata Bridge, where anglers line the rails, and climb to the medieval Galata Tower for a view over the Golden Horn.',
    ),
    h2('Practical tips'),
    ol(
      'Buy an Istanbulkart for trams, metro and ferries',
      'Visit big sights at opening time',
      'Eat where locals queue: try simit, balık ekmek and börek',
    ),
    ul('Carry a scarf for mosque visits', 'Watch for traffic: pedestrians rarely have priority'),
    quote('Take the ferry at sunset and Istanbul explains itself.'),
  ),
});
