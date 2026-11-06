import { b, callout, destination, doc, h2, i, image, ol, p, quote, s, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'old-dhaka-heritage-walk',
  title: 'Old Dhaka in a Day: Lalbagh Fort, Ahsan Manzil and the Buriganga',
  excerpt:
    'A walking route through four centuries of Dhaka: a Mughal fort, the Nawabs’ pink palace, the river port at Sadarghat and the city’s best-loved food.',
  type: 'article',
  featured: m.ahsanManzil,
  categories: ['Culture', 'Destinations', 'Food Travel'],
  tags: ['Dhaka', 'Heritage', 'Walking'],
  seoTitle: 'Old Dhaka Heritage Walk: Lalbagh Fort & Ahsan Manzil',
  seoDescription:
    'A one-day Old Dhaka walking route: Lalbagh Fort, Ahsan Manzil, the Star Mosque, Sadarghat and what to eat.',
  body: doc(
    p(
      'Old Dhaka is loud, crowded and endlessly rewarding. Mughal governors, Armenian merchants and the Nawabs of Dhaka all left their mark on these lanes beside the ',
      b('Buriganga river'),
      '. Start early, wear comfortable shoes, and take your time.',
    ),
    destination({
      destination: 'Old Dhaka',
      country: 'Bangladesh',
      region: 'Dhaka, along the Buriganga',
      bestSeason: 'November–February (cooler and drier)',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali',
      elevation: 'River plain',
      highlights: [
        'Lalbagh Fort (17th-century Mughal fort)',
        'Ahsan Manzil, the Nawabs’ palace',
        'Star Mosque in Armanitola',
        'Sadarghat river port',
      ],
    }),
    h2('The route'),
    ol(
      [
        b('Lalbagh Fort. '),
        'Begun in 1678 by the Mughal prince Muhammad Azam and never finished. Inside are the tomb of Pari Bibi, a mosque and quiet gardens.',
      ],
      [
        b('Star Mosque (Tara Masjid). '),
        'A small mosque covered in star mosaics made from broken china.',
      ],
      [
        b('Ahsan Manzil. '),
        'The pink palace of the Nawabs of Dhaka on the riverbank, now a museum.',
      ],
      [b('Sadarghat. '), 'Watch the launches and wooden boats crossing the Buriganga.'],
    ),
    image(m.lalbagh, m.lalbagh.caption),
    callout('info', [
      b('Check opening days and times '),
      'for Lalbagh Fort and Ahsan Manzil before you go; both close on some days and for public holidays.',
    ]),
    h2('What to eat'),
    ul(
      [b('Kacchi biryani'), ' — slow-cooked rice and mutton, the pride of Old Dhaka'],
      [b('Bakarkhani'), ' — crisp, layered flatbread, perfect with tea'],
      [b('Morog polao'), ' — fragrant chicken pilaf'],
    ),
    p(i('Eat where the queue is longest: in Old Dhaka that is usually the best sign.')),
    h2('Tips for the walk'),
    ul(
      'Use rickshaws between stops; the lanes are too narrow for cars',
      'Dress modestly, especially when visiting mosques',
      [
        s('Driving yourself'),
        ' — the traffic is part of the experience, but leave it to the rickshaw pullers',
      ],
    ),
    quote('Every lane in Old Dhaka is a shortcut to somewhere older.'),
  ),
});
