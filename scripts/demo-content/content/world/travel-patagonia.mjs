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
} from '../../lib/doc.mjs';

export default (m) => ({
  site: 'travel-blog',
  slug: 'patagonia-torres-del-paine-fitz-roy',
  title: 'Patagonia: Torres del Paine, Fitz Roy and the Perito Moreno Glacier',
  excerpt:
    'Granite towers, a glacier that calves into a lake and winds that knock you sideways. How to combine Chile’s Torres del Paine with Argentina’s El Chaltén and El Calafate.',
  type: 'travel_guide',
  featured: m.patagoniaTorres,
  categories: ['Adventure', 'Nature', 'Guides'],
  tags: ['Patagonia', 'Chile', 'Argentina', 'Hiking'],
  seoTitle: 'Patagonia Guide: Torres del Paine, Fitz Roy, Perito Moreno',
  seoDescription:
    'Plan a Patagonia trip across Chile and Argentina: the W Trek, Laguna de los Tres, Perito Moreno Glacier, seasons and wind.',
  body: doc(
    p(
      'Patagonia spans the south of Chile and Argentina. Its most famous corner pairs Chile’s ',
      b('Torres del Paine'),
      ' with Argentina’s Los Glaciares National Park, a few hours apart by road.',
    ),
    destination({
      destination: 'Southern Patagonia',
      country: 'Chile & Argentina',
      region: 'Magallanes; Santa Cruz',
      bestSeason: 'November–March (southern summer)',
      currency: 'Chilean peso (CLP); Argentine peso (ARS)',
      language: 'Spanish',
      elevation: 'Fitz Roy summit 3,405 m',
      highlights: ['W Trek', 'Laguna de los Tres', 'Perito Moreno Glacier', 'Grey Glacier'],
    }),
    h2('Torres del Paine'),
    p(
      'The ',
      b('W Trek'),
      ' takes four to five days and links the park’s highlights: the Base of the Towers, the French Valley and Grey Glacier. Campsites and refugios must be booked ahead.',
    ),
    image(m.patagoniaGreyLake, m.patagoniaGreyLake.caption),
    image(m.patagoniaGuanaco, m.patagoniaGuanaco.caption),
    h2('El Chaltén and Fitz Roy'),
    image(m.patagoniaFitzRoy, m.patagoniaFitzRoy.caption),
    p(
      'El Chaltén calls itself Argentina’s trekking capital. The hike to Laguna de los Tres, under Fitz Roy, is about 20 km return with a steep final hour.',
    ),
    h2('Perito Moreno Glacier'),
    image(m.patagoniaPeritoMoreno, m.patagoniaPeritoMoreno.caption),
    p(
      'Walkways near El Calafate face the glacier’s ice wall, which reaches about 70 m above the lake. Wait, and you will hear and see ice falling into the water.',
    ),
    callout('warning', [
      b('Respect the wind. '),
      'Gusts in Patagonia can knock hikers over. Stay away from cliff edges on windy days and keep a hand free on exposed ridges.',
    ]),
    h3('Sample route'),
    table(
      ['Days', 'Where'],
      [
        ['1–5', 'Torres del Paine (W Trek)'],
        ['6', 'Cross to El Calafate'],
        ['7', 'Perito Moreno Glacier'],
        ['8–10', 'El Chaltén hikes'],
      ],
    ),
    ol(
      'Book park entry and refugios before you travel',
      'Pack layers, a wind shell and sunglasses',
      'Carry cash for the border towns',
    ),
    quote('Patagonia gives you four seasons before lunch.'),
  ),
});
