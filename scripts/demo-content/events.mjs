/**
 * Real, recurring Bangladesh events for the demo sites. Times are Bangladesh
 * Standard Time (UTC+6), stored as UTC.
 *
 * Shakrain falls on the last day of Poush. Under Bangladesh's revised Bengali
 * calendar (Poush 1 = 16 December, Poush has 30 days) that is 14 January.
 */
export const EVENTS = [
  {
    site: 'air-sports',
    slug: 'shakrain-festival-2027',
    name: 'Shakrain Festival 2027, Old Dhaka',
    status: 'scheduled',
    startsAt: '2027-01-14T01:00:00.000Z', // 07:00 in Dhaka
    endsAt: '2027-01-14T16:00:00.000Z', // 22:00 in Dhaka
    description:
      'Old Dhaka’s kite festival on the last day of Poush. Rooftops in Shankhari Bazar, Sutrapur and Lakshmi Bazar fill with kite flyers from morning, with fireworks after dark.',
  },
  // The Fiesta runs for nine days from the first Saturday of October
  // (2 October in 2027). Mountain Daylight Time is UTC-6.
  {
    site: 'air-sports',
    slug: 'albuquerque-balloon-fiesta-2027',
    name: 'Albuquerque International Balloon Fiesta 2027',
    status: 'scheduled',
    startsAt: '2027-10-02T11:45:00.000Z', // 05:45 in Albuquerque
    endsAt: '2027-10-10T17:00:00.000Z', // 11:00 in Albuquerque
    description:
      'Nine days of mass ascensions, balloon glows and special shapes at Balloon Fiesta Park, New Mexico. Dates follow the usual first-Saturday-of-October pattern; confirm on the official Fiesta schedule.',
  },
];
