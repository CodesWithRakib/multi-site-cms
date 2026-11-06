import { b, callout, doc, h2, i, image, ol, p, quote, table, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'gliding-flying-without-an-engine',
  title: 'Gliding: How to Fly for Hours Without an Engine',
  excerpt:
    'Gliders climb on rising air and can cross hundreds of kilometres in a day. How launches work, where the lift comes from and how to start with a trial flight.',
  type: 'article',
  featured: m.gliderFlight,
  categories: ['Gliding'],
  tags: ['Gliding', 'Sailplanes', 'Thermals', 'Beginners'],
  seoTitle: 'Gliding for Beginners: Launches, Lift & First Lessons',
  seoDescription:
    'An introduction to gliding: winch and aerotow launches, thermals, ridge and wave lift, glide ratios and how to book a trial lesson.',
  body: doc(
    p(
      'A glider, or ',
      b('sailplane'),
      ', has no engine. Once launched, it is always gliding down through the air. The pilot’s skill is finding air that rises faster than the glider sinks.',
    ),
    h2('Getting into the air'),
    table(
      ['Launch', 'How it works', 'Height'],
      [
        ['Winch', 'A ground winch pulls a cable fast, like a kite', 'Typically 300–600 m'],
        ['Aerotow', 'A powered tug tows the glider on a rope', 'Wherever the tug releases you'],
      ],
    ),
    image(m.gliderAerotow, m.gliderAerotow.caption),
    h2('Where the lift comes from'),
    ul(
      [b('Thermals: '), 'columns of warm rising air, often marked by cumulus clouds'],
      [b('Ridge lift: '), 'wind deflected upward by a hill or ridge'],
      [b('Wave: '), 'air rising in waves downwind of mountains, reaching great heights'],
    ),
    image(m.gliderClouds, m.gliderClouds.caption),
    p(
      'Modern high-performance gliders can have glide ratios of ',
      b('40:1 or more'),
      ': from 1 km up they can glide over 40 km in still air.',
    ),
    h2('Start with a trial flight'),
    ol(
      'Book a trial lesson at a gliding club',
      'Fly from the front seat with an instructor behind you',
      'Take the controls once you are in the air',
    ),
    image(m.gliderCockpit, m.gliderCockpit.caption),
    callout('info', [
      b('Learning to fly solo. '),
      'Training usually happens at clubs, with dual flights until your instructor sends you solo. The number of flights needed varies a lot from person to person.',
    ]),
    p(i('Rules and licences differ by country; ask your national gliding association.')),
    quote('A good day of gliding is a long conversation with the sky.'),
  ),
});
