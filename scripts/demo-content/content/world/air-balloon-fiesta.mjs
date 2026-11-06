import { b, callout, doc, h2, i, image, ol, p, quote, timeline, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'albuquerque-balloon-fiesta-guide',
  title: 'Albuquerque Balloon Fiesta: Hundreds of Balloons at Dawn',
  excerpt:
    'Every October, hundreds of hot-air balloons lift off together from Balloon Fiesta Park in New Mexico. Mass ascensions, night glows and how to plan your visit.',
  type: 'air_sports_update',
  featured: m.fiestaMassAscension,
  categories: ['Ballooning', 'Events'],
  event: 'albuquerque-balloon-fiesta-2027',
  tags: ['USA', 'New Mexico', 'Hot-Air Balloon', 'Festival'],
  seoTitle: 'Albuquerque International Balloon Fiesta: Visitor Guide',
  seoDescription:
    'Plan a visit to the Albuquerque International Balloon Fiesta: mass ascensions, balloon glows, special shapes, the Albuquerque Box and tips for the early start.',
  body: doc(
    p(
      'The ',
      b('Albuquerque International Balloon Fiesta'),
      ' in New Mexico is one of the world’s largest ballooning events. Over nine days in early October, hundreds of balloons launch from Balloon Fiesta Park.',
    ),
    h2('A typical Fiesta morning'),
    timeline({
      time: '05:45',
      title: 'Dawn Patrol',
      description: 'A few balloons launch in the dark, glowing as their burners fire.',
      status: 'none',
      windSpeed: 'Light',
      weatherCondition: 'Cold, clear',
      alertLevel: 'normal',
    }),
    timeline({
      time: '07:00',
      title: 'Mass Ascension',
      description:
        'Waves of balloons inflate and lift off from the launch field, guided by launch directors.',
      status: 'none',
      windSpeed: 'Calm',
      weatherCondition: 'Sunrise',
      alertLevel: 'normal',
    }),
    timeline({
      time: '10:00',
      title: 'Winds pick up',
      description: 'Flying ends for the morning; the field opens for food and visitors.',
      status: 'none',
      windSpeed: 'Rising',
      weatherCondition: 'Sunny',
      alertLevel: 'advisory',
    }),
    image(m.fiestaInflation, m.fiestaInflation.caption),
    h2('The Albuquerque Box'),
    p(
      'Albuquerque’s mornings often bring the ',
      b('“Box”'),
      ': light winds that blow one way near the ground and the opposite way higher up. Pilots can climb and descend to fly in a loop and land close to where they started.',
    ),
    h2('Shapes and glows'),
    image(m.fiestaShapes, m.fiestaShapes.caption),
    p(
      'Special-shape balloons, from animals to houses, fly on their own days. In the evening, tethered balloons fire their burners together during the Balloon Glow.',
    ),
    image(m.fiestaNight, m.fiestaNight.caption),
    h2('Plan your visit'),
    ol(
      'Book accommodation months ahead',
      'Use the park-and-ride buses to avoid traffic',
      'Arrive before dawn for the best views',
    ),
    ul(
      'Dress in layers: mornings are cold, middays warm',
      'Walk among the balloons, but follow crew instructions',
    ),
    callout('warning', [
      b('Weather decides. '),
      'Flights are cancelled or delayed in wind or rain. Plan to attend more than one morning.',
    ]),
    p(i('Check the official Fiesta schedule for this year’s dates and events.')),
    quote('Standing on the field as the first wave lifts off is something you do not forget.'),
  ),
});
