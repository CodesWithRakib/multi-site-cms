import {
  b,
  callout,
  center,
  destination,
  doc,
  h2,
  h3,
  i,
  image,
  p,
  table,
  ul,
} from '../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'coxs-bazar-beach-travel-guide',
  title: 'Cox’s Bazar Beyond the Main Beach: Inani, Himchari and the Marine Drive',
  excerpt:
    'Bangladesh’s favourite seaside town stretches along one of the world’s longest natural sea beaches. Here is how to see the best of it, stay safe in the water and eat well.',
  type: 'article',
  featured: m.coxsSunset,
  categories: ['Destinations', 'Travel Tips'],
  tags: ['Cox’s Bazar', 'Beach', 'Chattogram'],
  seoTitle: 'Cox’s Bazar Travel Guide: Beaches, Marine Drive & Safety',
  seoDescription:
    'A practical Cox’s Bazar guide: which beaches to visit, the Marine Drive, how to get there and sea safety.',
  body: doc(
    p(
      'Cox’s Bazar sits on a sandy coastline that runs for roughly 120 kilometres towards Teknaf, often described as the ',
      b('longest natural sea beach in the world'),
      '. Most visitors never leave the busy town beaches, but the best days here are spent heading south.',
    ),
    destination({
      destination: 'Cox’s Bazar',
      country: 'Bangladesh',
      region: 'Chattogram Division, south-east coast',
      bestSeason: 'November–March',
      currency: 'Bangladeshi taka (BDT)',
      language: 'Bengali',
      elevation: 'Sea level',
      highlights: [
        'Sunsets on Laboni and Sugandha beaches',
        'The Marine Drive along the Bay of Bengal',
        'Rocky shoreline at Inani',
        'Fresh seafood and dried fish markets',
      ],
    }),
    h2('The beaches, from north to south'),
    table(
      ['Beach', 'What it is like'],
      [
        ['Laboni & Sugandha', 'The busy town beaches: food stalls, horse rides, crowds at sunset'],
        ['Kolatoli', 'Hotel strip with easy beach access'],
        ['Himchari', 'Green hills meet the sea, with a viewpoint and seasonal waterfall'],
        ['Inani', 'Quieter, with rocks and pebbles along the waterline'],
      ],
    ),
    image(m.coxsUmbrellas, m.coxsUmbrellas.caption),
    h2('Drive the Marine Drive'),
    p(
      'The coastal road south from Cox’s Bazar runs between the hills and the sea for most of its length. Hire a CNG auto-rickshaw or car for half a day, stop at Himchari, continue to Inani, and come back for sunset.',
    ),
    image(m.inaniBoats, m.inaniBoats.caption),
    h2('Getting there'),
    ul(
      [b('By air: '), 'short domestic flights from Dhaka to Cox’s Bazar airport'],
      [
        b('By train: '),
        'direct trains from Dhaka began running in late 2023; book early in peak season',
      ],
      [b('By bus: '), 'overnight coaches from Dhaka; expect a long ride'],
    ),
    p(i('Schedules and fares change; check current timetables before you travel.')),
    callout('warning', [
      b('Swim only where lifeguards are on duty. '),
      'Rip currents are common, especially in the monsoon and at low tide. Watch the beach flags and stay in the marked zones.',
    ]),
    h3('What to eat'),
    ul(
      'Grilled fish and prawns from the beachside stalls',
      'Coral fish curry with rice',
      'Shutki (dried fish), the town’s famous souvenir',
    ),
    callout('tip', [
      b('Go early or late. '),
      'The beach is at its best at sunrise and in the hour before sunset, when the sand is cool and the light is soft.',
    ]),
    center(b('Pack light, respect the sea, and take the road south.')),
  ),
});
