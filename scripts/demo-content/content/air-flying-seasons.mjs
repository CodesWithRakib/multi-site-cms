import { b, callout, center, doc, h2, i, p, table, timeline, ul } from '../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'bangladesh-flying-seasons-weather-guide',
  title: 'Reading Bangladesh’s Sky: A Season-by-Season Guide for Kites, Drones and Gliders',
  excerpt:
    'Calm winter mornings, violent spring storms, the monsoon and cyclone months: when Bangladesh’s weather is kind to anything that flies, and when to stay on the ground.',
  type: 'article',
  featured: m.stormClouds,
  categories: ['Weather & Safety'],
  tags: ['Weather', 'Monsoon', 'Kalbaishakhi', 'Safety'],
  seoTitle: 'Bangladesh Flying Seasons: Weather Guide for Air Sports',
  seoDescription:
    'When to fly in Bangladesh: winter, pre-monsoon Nor’westers, the monsoon and the cyclone season explained for kite, drone and glider pilots.',
  body: doc(
    p(
      'Bangladesh has a tropical monsoon climate, and its year splits into clear flying seasons. Knowing them is the first skill of any pilot here, whether you fly a kite from a rooftop, a drone over the hills, or a paraglider.',
    ),
    h2('The year at a glance'),
    timeline({
      time: 'Dec–Feb',
      title: 'Winter: the calm season',
      description:
        'Dry, cool and mostly settled. Morning fog can be thick, especially in the north.',
      status: 'none',
      windSpeed: 'Usually light',
      weatherCondition: 'Dry, morning fog',
      alertLevel: 'normal',
    }),
    timeline({
      time: 'Mar–May',
      title: 'Pre-monsoon: storm season',
      description:
        'Hot and humid, with sudden Nor’westers (kalbaishakhi): violent afternoon storms with strong gusts and hail.',
      status: 'none',
      windSpeed: 'Sudden strong gusts',
      weatherCondition: 'Thunderstorms',
      alertLevel: 'warning',
    }),
    timeline({
      time: 'Jun–Sep',
      title: 'Monsoon',
      description: 'Heavy rain, low cloud and high humidity. Short windows between showers.',
      status: 'none',
      windSpeed: 'Variable',
      weatherCondition: 'Heavy rain',
      alertLevel: 'advisory',
    }),
    timeline({
      time: 'Oct–Nov',
      title: 'Post-monsoon',
      description:
        'Skies clear and the air cools, but this is also a cyclone season in the Bay of Bengal. Watch the forecasts.',
      status: 'none',
      windSpeed: 'Light, unless a storm is near',
      weatherCondition: 'Clearing',
      alertLevel: 'advisory',
    }),
    h2('What it means for each sport'),
    table(
      ['Activity', 'Best months', 'Watch out for'],
      [
        ['Kite flying', 'December–February', 'Power lines and rooftop edges'],
        ['Drones', 'November–February', 'Fog, haze and sudden gusts'],
        ['Paragliding', 'November–February', 'Thermals and spring storms'],
      ],
    ),
    callout('warning', [
      b('Never fly ahead of a Nor’wester. '),
      'In spring, a clear sky can turn into a squall within minutes. Dark clouds building in the north-west mean it is time to land.',
    ]),
    h2('Check the forecast'),
    ul(
      'Use the Bangladesh Meteorological Department forecasts and storm warnings',
      'Look for signal numbers issued for coastal areas during cyclones',
      i('When in doubt, do not fly'),
    ),
    callout('tip', [
      b('Best hours: '),
      'early morning, after any fog lifts, and the hour before sunset. Midday heat makes the air bumpy.',
    ]),
    center(b('The sky in Bangladesh is generous, but it keeps its own calendar.')),
  ),
});
