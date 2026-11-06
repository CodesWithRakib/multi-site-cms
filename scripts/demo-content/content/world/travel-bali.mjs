import { b, callout, destination, doc, h2, image, ol, p, quote, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'bali-temples-rice-terraces-volcano',
  title: 'Bali Beyond the Beach: Temples, Rice Terraces and a Volcano Sunrise',
  excerpt:
    'Sea temples at sunset, terraced rice fields watered by a thousand-year-old system and a pre-dawn climb up Mount Batur. A culture-first week in Bali.',
  type: 'article',
  featured: m.baliUlunDanu,
  categories: ['Destinations', 'Culture', 'Nature'],
  tags: ['Indonesia', 'Bali', 'Temples', 'Rice Terraces'],
  seoTitle: 'Bali Culture Guide: Temples, Terraces & Mount Batur',
  seoDescription:
    'A week in Bali beyond the beach: Ulun Danu Beratan, Tanah Lot, Uluwatu, Tegallalang rice terraces and the Mount Batur sunrise trek.',
  body: doc(
    p(
      'Bali is a Hindu island in mostly Muslim Indonesia, and its ',
      b('temples'),
      ' are in daily use. Offerings of flowers and rice appear on doorsteps every morning.',
    ),
    destination({
      destination: 'Bali',
      country: 'Indonesia',
      region: 'Lesser Sunda Islands',
      bestSeason: 'April–October (dry season)',
      currency: 'Indonesian rupiah (IDR)',
      language: 'Indonesian, Balinese',
      elevation: 'Mount Batur 1,717 m',
      highlights: ['Ulun Danu Beratan', 'Tanah Lot', 'Uluwatu', 'Tegallalang'],
    }),
    h2('Rice terraces and subak'),
    p(
      'Bali’s rice fields are watered by ',
      b('subak'),
      ', a cooperative irrigation system run through water temples. UNESCO lists its landscapes as World Heritage. Tegallalang, north of Ubud, is the easiest terrace to visit.',
    ),
    image(m.baliTegallalang, m.baliTegallalang.caption),
    h2('Temples by the water'),
    image(m.baliTanahLot, m.baliTanahLot.caption),
    p(
      'Tanah Lot stands on a rock in the sea; at high tide it becomes an island. Uluwatu sits on a clifftop at the south of the island, where the Kecak dance is performed at sunset.',
    ),
    image(m.baliUluwatu, m.baliUluwatu.caption),
    callout('warning', [
      b('Hold on to your things at Uluwatu. '),
      'The temple’s monkeys grab sunglasses, hats and phones. Keep them in a closed bag.',
    ]),
    h2('Mount Batur at dawn'),
    image(m.baliBatur, m.baliBatur.caption),
    p(
      'Treks start around 4 am to reach the crater rim for sunrise. It is a steady climb of about two hours; go with a licensed local guide.',
    ),
    h2('Temple etiquette'),
    ol(
      'Wear a sarong and sash (often lent at the entrance)',
      'Do not step on offerings',
      'Do not climb shrines or walls for photos',
    ),
    ul(
      'Pay the tourist levy for foreign visitors online before you arrive',
      'Avoid the midday heat on hikes',
      'Use reef-safe sunscreen',
    ),
    quote('In Bali, every morning begins with an offering.'),
  ),
});
