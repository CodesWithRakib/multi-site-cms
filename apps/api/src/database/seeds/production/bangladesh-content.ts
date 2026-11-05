/**
 * Launch content for the production sites, written for readers in Bangladesh.
 *
 * Editorial rules: well-established facts only; anything that changes (fares,
 * permits, visitor caps, drone rules) is described as "check the current
 * rules" rather than given as numbers; no invented events, results, or
 * statistics. Covers are illustrations and their alt text says so.
 */

export type DocNode = Record<string, unknown>;

const text = (value: string): DocNode => ({ type: 'text', text: value });
export const p = (value: string): DocNode => ({ type: 'paragraph', content: [text(value)] });
export const h2 = (value: string): DocNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [text(value)],
});
export const ul = (items: readonly string[]): DocNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [p(item)] })),
});
export const doc = (...content: DocNode[]): DocNode => ({ type: 'doc', content });

export interface CoverArt {
  /** Short label on the illustration, e.g. "COX'S BAZAR". */
  readonly label: string;
  readonly background: readonly [string, string];
  readonly accent: string;
  /** SVG markup drawn around (0,0) in a 1200×800 canvas. */
  readonly motif: string;
}

export interface SeedArticle {
  readonly slug: string;
  readonly type: 'travel_guide' | 'article' | 'air_sports_update';
  readonly title: string;
  readonly excerpt: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly body: DocNode;
  readonly cover: CoverArt;
}

export interface SeedSite {
  readonly key: 'travel-blog' | 'air-sports';
  readonly name: string;
  readonly categories: ReadonlyArray<{ slug: string; name: string }>;
  readonly tags: ReadonlyArray<{ slug: string; name: string }>;
  readonly articles: readonly SeedArticle[];
}

const WAVES =
  '<path d="M-300 40 Q-225 0 -150 40 T0 40 T150 40 T300 40" fill="none" stroke="ACCENT" stroke-width="8" stroke-linecap="round"/><path d="M-300 100 Q-225 60 -150 100 T0 100 T150 100 T300 100" fill="none" stroke="ACCENT" stroke-width="6" opacity="0.6" stroke-linecap="round"/><circle cx="180" cy="-120" r="60" fill="ACCENT" opacity="0.85"/>';
const HILLS =
  '<path d="M-320 120 L-160 -80 L-40 40 L80 -140 L320 120 Z" fill="none" stroke="ACCENT" stroke-width="8" stroke-linejoin="round"/><path d="M-260 60 Q0 20 260 60" fill="none" stroke="ACCENT" stroke-width="5" opacity="0.5"/>';
const LEAVES =
  '<path d="M0 120 C-140 40 -120 -120 0 -160 C120 -120 140 40 0 120 Z" fill="none" stroke="ACCENT" stroke-width="8"/><path d="M0 120 L0 -150" stroke="ACCENT" stroke-width="5"/><path d="M0 -40 L-70 -90 M0 20 L70 -30" stroke="ACCENT" stroke-width="5" stroke-linecap="round"/>';
const DOME =
  '<path d="M-220 120 L-220 0 Q0 -200 220 0 L220 120 Z" fill="none" stroke="ACCENT" stroke-width="8"/><path d="M-80 120 L-80 40 Q0 -20 80 40 L80 120" fill="none" stroke="ACCENT" stroke-width="6"/><path d="M0 -100 L0 -170" stroke="ACCENT" stroke-width="6"/>';
const WING =
  '<path d="M-300 -40 Q0 -200 300 -40" fill="none" stroke="ACCENT" stroke-width="10" stroke-linecap="round"/><path d="M-220 -60 L-20 110 M220 -60 L20 110 M-80 -120 L-10 110 M80 -120 L10 110" stroke="ACCENT" stroke-width="3" opacity="0.7"/><circle cx="0" cy="130" r="16" fill="ACCENT"/>';
const CLOUD =
  '<path d="M-220 60 Q-240 -20 -150 -30 Q-120 -120 -10 -90 Q60 -150 140 -70 Q240 -70 230 40 Z" fill="none" stroke="ACCENT" stroke-width="8" stroke-linejoin="round"/><path d="M-120 110 L-150 170 M0 110 L-30 170 M120 110 L90 170" stroke="ACCENT" stroke-width="6" stroke-linecap="round"/>';
const SHIELD =
  '<path d="M0 -170 L170 -110 L150 60 Q100 150 0 180 Q-100 150 -150 60 L-170 -110 Z" fill="none" stroke="ACCENT" stroke-width="8" stroke-linejoin="round"/><path d="M-70 0 L-15 55 L80 -50" fill="none" stroke="ACCENT" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>';
const DRONE =
  '<rect x="-60" y="-30" width="120" height="60" rx="14" fill="none" stroke="ACCENT" stroke-width="8"/><path d="M-60 -20 L-160 -100 M60 -20 L160 -100 M-60 20 L-160 100 M60 20 L160 100" stroke="ACCENT" stroke-width="6"/><circle cx="-160" cy="-100" r="40" fill="none" stroke="ACCENT" stroke-width="5"/><circle cx="160" cy="-100" r="40" fill="none" stroke="ACCENT" stroke-width="5"/><circle cx="-160" cy="100" r="40" fill="none" stroke="ACCENT" stroke-width="5"/><circle cx="160" cy="100" r="40" fill="none" stroke="ACCENT" stroke-width="5"/>';

const art = (
  label: string,
  background: readonly [string, string],
  accent: string,
  motif: string,
): CoverArt => ({ label, background, accent, motif: motif.split('ACCENT').join(accent) });

export const TRAVEL_SITE: SeedSite = {
  key: 'travel-blog',
  name: 'Shomik Travel',
  categories: [
    { slug: 'beaches-islands', name: 'Beaches & Islands' },
    { slug: 'hills-forests', name: 'Hills & Forests' },
    { slug: 'heritage', name: 'Heritage' },
    { slug: 'travel-tips', name: 'Travel Tips' },
  ],
  tags: [
    { slug: 'coxs-bazar', name: "Cox's Bazar" },
    { slug: 'sylhet-division', name: 'Sylhet Division' },
    { slug: 'chittagong-hill-tracts', name: 'Chittagong Hill Tracts' },
    { slug: 'dhaka', name: 'Dhaka' },
    { slug: 'family-trip', name: 'Family trip' },
    { slug: 'budget', name: 'Budget' },
    { slug: 'winter-season', name: 'Winter season' },
    { slug: 'monsoon', name: 'Monsoon' },
  ],
  articles: [
    {
      slug: 'coxs-bazar-first-timers-guide',
      type: 'travel_guide',
      title: "Cox's Bazar for First-Timers: Beaches, Marine Drive and When to Go",
      excerpt:
        "How to plan a first trip to Cox's Bazar: getting there from Dhaka, the beaches beyond the main strip, and the best months for calm seas.",
      category: 'beaches-islands',
      tags: ['coxs-bazar', 'family-trip', 'winter-season'],
      cover: art("COX'S BAZAR", ['#0c4a6e', '#075985'], '#fbbf24', WAVES),
      body: doc(
        p(
          "Cox's Bazar is often called the longest natural sea beach in the world: an almost unbroken stretch of sand of around 120 kilometres along the Bay of Bengal. For most families in Bangladesh it is the first beach holiday, and it rewards a little planning.",
        ),
        h2('Getting there from Dhaka'),
        ul([
          'By air: domestic flights take about an hour and are the fastest option.',
          'By train: a direct rail link from Dhaka now reaches Cox’s Bazar; book on the official Bangladesh Railway e-ticket service.',
          'By bus: overnight coaches run daily; the trip usually takes ten hours or more depending on traffic.',
        ]),
        h2('Beyond the main beach'),
        p(
          'Kolatoli and Laboni are lively and close to the hotels. For quieter sand, take the Marine Drive south towards Teknaf: Himchari has hills meeting the sea, and Inani is known for its rocky shoreline at low tide.',
        ),
        h2('When to go'),
        p(
          'November to March brings dry weather and calmer water. During the monsoon the sea is rough and swimming can be dangerous; always follow the lifeguard flags and never swim after dark.',
        ),
        h2('Good habits on the beach'),
        ul([
          'Carry your rubbish back; the beach is cleaned, but plastics still reach the sea.',
          'Keep children within arm’s reach in the water; rip currents are common.',
          'Agree on prices for beach chairs and rides before you use them.',
        ]),
      ),
    },
    {
      slug: 'sundarbans-mangrove-trip-planning',
      type: 'travel_guide',
      title: 'Planning a Sundarbans Trip: Permits, Seasons and Responsible Tours',
      excerpt:
        'The world’s largest mangrove forest is best seen with a licensed operator. What to expect, when to go, and how to travel without harming the forest.',
      category: 'hills-forests',
      tags: ['winter-season', 'family-trip'],
      cover: art('SUNDARBANS', ['#064e3b', '#065f46'], '#a3e635', LEAVES),
      body: doc(
        p(
          'The Sundarbans, shared by Bangladesh and India, is the largest mangrove forest on Earth. The Bangladesh part is a UNESCO World Heritage Site and home to the Royal Bengal tiger, spotted deer, saltwater crocodiles and hundreds of bird species.',
        ),
        h2('How trips work'),
        p(
          'Most visitors join a multi-day boat tour that starts from Khulna or Mongla. Entry needs Forest Department permits; licensed operators arrange them together with guides and armed forest guards, so choose an operator that includes these in writing.',
        ),
        h2('Best season'),
        p(
          'November to February is cool and dry, with calmer rivers. Tiger sightings are rare at any time: come for the channels, birds and the silence of the forest rather than a guaranteed sighting.',
        ),
        h2('Travel responsibly'),
        ul([
          'Stay on marked trails and watchtowers; never leave the group on foot.',
          'Keep noise low on the boat and switch off music near the forest.',
          'Take every plastic item back with you.',
        ]),
      ),
    },
    {
      slug: 'sreemangal-tea-gardens-weekend',
      type: 'travel_guide',
      title: 'A Weekend in Sreemangal: Tea Gardens, Lawachara and Seven-Layer Tea',
      excerpt:
        'Bangladesh’s tea capital is an easy train ride from Dhaka. A two-day plan through the estates, the rainforest and the famous layered tea.',
      category: 'hills-forests',
      tags: ['sylhet-division', 'budget', 'monsoon'],
      cover: art('SREEMANGAL', ['#14532d', '#166534'], '#86efac', LEAVES),
      body: doc(
        p(
          'Sreemangal in Moulvibazar district is known as the tea capital of Bangladesh. Rolling estates, a protected rainforest and a calm small-town pace make it one of the easiest weekend escapes from Dhaka.',
        ),
        h2('Day one: the estates'),
        p(
          'Walk or take a rickshaw through the tea gardens in the morning, when the pickers are at work. Ask before photographing people and stay on the paths between the bushes.',
        ),
        h2('Day two: Lawachara National Park'),
        p(
          'Lawachara is a patch of tropical forest known for the western hoolock gibbon, the only ape found in Bangladesh. Go early with a local guide, walk quietly, and you may hear the gibbons calling before you see them.',
        ),
        h2('Do not miss'),
        ul([
          'Seven-layer tea: a local speciality served in several coloured layers.',
          'Fresh pineapple and citrus from the surrounding hills in season.',
          'The train journey itself, through paddy fields and small stations.',
        ]),
        p(
          'The gardens are greenest in the monsoon, but trails get muddy and leeches are common: wear closed shoes and long socks.',
        ),
      ),
    },
    {
      slug: 'sajek-valley-above-the-clouds',
      type: 'travel_guide',
      title: 'Sajek Valley: Waking Up Above the Clouds',
      excerpt:
        'The hill top known as the valley of clouds in Rangamati district. When the clouds settle below the ridge, how the trip works, and how to be a good guest.',
      category: 'hills-forests',
      tags: ['chittagong-hill-tracts', 'monsoon'],
      cover: art('SAJEK VALLEY', ['#1e3a8a', '#1e40af'], '#e0f2fe', CLOUD),
      body: doc(
        p(
          'Sajek Valley sits on a ridge in Rangamati district, usually reached through Khagrachhari. On the right morning the clouds settle below the ridge and the hills rise out of them like islands, which is why it is so often called the valley of clouds.',
        ),
        h2('When the clouds come'),
        p(
          'The late monsoon and early autumn give the best chance of a sea of clouds at sunrise. Winter mornings are clearer, with long views across the hills.',
        ),
        h2('Getting there'),
        p(
          'Jeeps (locally called chander gari) carry visitors from Khagrachhari. Movement in the hill tracts can be subject to security arrangements and set travel times; ask your hotel or driver about the current rules before you leave.',
        ),
        h2('Be a good guest'),
        ul([
          'Sajek is home to indigenous communities; ask before photographing people or homes.',
          'Electricity and water are limited; use them sparingly.',
          'Book rooms in advance on weekends and holidays.',
        ]),
      ),
    },
    {
      slug: 'saint-martins-island-what-to-know',
      type: 'travel_guide',
      title: "Saint Martin's Island: What to Know Before You Go",
      excerpt:
        'Bangladesh’s only coral island is fragile and visits are regulated. How the trip works, why the rules exist, and how to visit without harming the reef.',
      category: 'beaches-islands',
      tags: ['coxs-bazar', 'winter-season'],
      cover: art("SAINT MARTIN'S", ['#155e75', '#0e7490'], '#fde68a', WAVES),
      body: doc(
        p(
          "Saint Martin's Island, in the Bay of Bengal south of Teknaf, is the only coral island in Bangladesh. Clear water, coral, and coconut-lined beaches make it famous, and the same things make it fragile.",
        ),
        h2('Visits are regulated'),
        p(
          'To protect the island, the government regulates when tourists may visit, how many may go each day, and whether overnight stays are allowed. These rules have changed in recent seasons, so confirm the current ones with official sources and your tour operator before you book anything.',
        ),
        h2('Getting there'),
        p(
          "Boats leave from Teknaf or Cox's Bazar during the permitted season, weather allowing. Sailings are cancelled in rough seas; keep a spare day in your plan.",
        ),
        h2('Protect the reef'),
        ul([
          'Never break, collect, or stand on coral; it takes decades to grow back.',
          'Do not buy coral, shells, or dried marine animals.',
          'Avoid plastic bottles and bags; carry a refillable bottle.',
          'Keep beaches dark and quiet at night: turtles may nest there.',
        ]),
      ),
    },
    {
      slug: 'old-dhaka-heritage-walk',
      type: 'travel_guide',
      title: 'An Old Dhaka Heritage Walk: Lalbagh Fort to Ahsan Manzil',
      excerpt:
        'A half-day walk through Mughal forts, a pink palace and centuries-old lanes, with the best food stops along the way.',
      category: 'heritage',
      tags: ['dhaka', 'budget', 'family-trip'],
      cover: art('OLD DHAKA', ['#7c2d12', '#9a3412'], '#fed7aa', DOME),
      body: doc(
        p(
          'Old Dhaka is where the city began, and the best way to see it is on foot. Start early, wear comfortable shoes, and leave time to get lost in the lanes.',
        ),
        h2('Lalbagh Fort'),
        p(
          'The Mughal fort was begun in the seventeenth century and never completed. Its gardens, mosque and the tomb of Pari Bibi make a calm start before the streets get busy.',
        ),
        h2('Through the lanes'),
        p(
          'Walk east through the old neighbourhoods towards the river. Look out for the Star Mosque, decorated with ceramic tiles, and the Armenian Church, a reminder of the merchants who once traded here.',
        ),
        h2('Ahsan Manzil'),
        p(
          'The pink palace on the Buriganga was the residence of the Nawabs of Dhaka and is now a museum. Check opening days before you go; it is usually closed on one weekday.',
        ),
        h2('Eat like a local'),
        ul([
          'Kacchi biryani from one of the long-established restaurants.',
          'Bakarkhani, the flaky bread Old Dhaka is known for.',
          'Lassi or borhani to finish.',
        ]),
      ),
    },
    {
      slug: 'bandarban-hills-trekking-basics',
      type: 'travel_guide',
      title: 'Bandarban Hills: Trekking Basics for Your First Trip',
      excerpt:
        'Nilgiri views, Boga Lake and jungle waterfalls. How to plan safely, what to pack, and why a registered local guide matters.',
      category: 'hills-forests',
      tags: ['chittagong-hill-tracts', 'winter-season'],
      cover: art('BANDARBAN', ['#3f6212', '#4d7c0f'], '#fef08a', HILLS),
      body: doc(
        p(
          'Bandarban has some of the highest hills in Bangladesh, with viewpoints like Nilgiri, the crater lake of Boga, and remote waterfalls deeper in the forest. It is the country’s best region for trekking.',
        ),
        h2('Plan with a local guide'),
        p(
          'Many trails pass through areas where registration at checkpoints and a registered local guide are required. Rules differ by area and change over time; your guide or hotel will know the current ones.',
        ),
        h2('When to go'),
        p(
          'October to February is the safest season. In the monsoon, trails become slippery, streams rise fast, and landslides are a real risk.',
        ),
        h2('Pack light, pack right'),
        ul([
          'Shoes with good grip, a light rain jacket, and a head torch.',
          'Water purification tablets or a filter, and oral saline.',
          'A basic first-aid kit and any personal medicines.',
          'Cash: card machines and mobile coverage are limited in the hills.',
        ]),
        p(
          'The hills are home to many indigenous communities. Ask before photographing people, respect local customs, and buy food and crafts locally.',
        ),
      ),
    },
    {
      slug: 'domestic-travel-tips-bangladesh',
      type: 'article',
      title: 'Travel Smarter in Bangladesh: Tickets, Seasons and Safety',
      excerpt:
        'Practical habits for domestic trips: booking trains and buses, choosing the season, paying on the go, and staying safe.',
      category: 'travel-tips',
      tags: ['budget', 'family-trip', 'monsoon'],
      cover: art('TRAVEL TIPS', ['#312e81', '#3730a3'], '#c7d2fe', SHIELD),
      body: doc(
        p(
          'A little planning makes domestic travel in Bangladesh much easier, especially around the Eid holidays, when the whole country seems to be on the move.',
        ),
        h2('Book early, book officially'),
        ul([
          'Train tickets: use the official Bangladesh Railway e-ticket service; holiday tickets sell out within minutes.',
          'Buses and launches: buy from the operator’s own counter or website, and keep the ticket until the end of the trip.',
          'Avoid tickets from unofficial resellers; they are often overpriced or fake.',
        ]),
        h2('Pick the right season'),
        p(
          'October to March is the most comfortable time for most of the country. The monsoon brings green landscapes but also flooding, landslides in the hills, and rough seas on the coast; check the weather before every trip.',
        ),
        h2('Money and phones'),
        p(
          'Mobile financial services are widely accepted, even in small towns, but carry some cash for remote areas. Keep your phone charged and carry a power bank on long journeys.',
        ),
        h2('Stay safe'),
        ul([
          'Share your itinerary with family and check in each evening.',
          'Use registered guides in forests, hills, and on the water.',
          'Life jackets on boats are not optional, whatever the crew says.',
        ]),
      ),
    },
  ],
};

export const AIR_SPORTS_SITE: SeedSite = {
  key: 'air-sports',
  name: 'Shomik Air Sports',
  categories: [
    { slug: 'paragliding', name: 'Paragliding' },
    { slug: 'skydiving', name: 'Skydiving' },
    { slug: 'safety', name: 'Safety' },
    { slug: 'weather', name: 'Weather' },
  ],
  tags: [
    { slug: 'beginners', name: 'Beginners' },
    { slug: 'tandem', name: 'Tandem' },
    { slug: 'nepal', name: 'Nepal' },
    { slug: 'monsoon', name: 'Monsoon' },
    { slug: 'drones', name: 'Drones' },
    { slug: 'checklist', name: 'Checklist' },
  ],
  articles: [
    {
      slug: 'first-tandem-paragliding-flight-pokhara',
      type: 'air_sports_update',
      title: 'Your First Tandem Paragliding Flight: A Guide for Bangladeshi Travellers',
      excerpt:
        'Pokhara in Nepal is one of the most popular places for a first flight. How tandem flights work, the best season, and how to choose a safe operator.',
      category: 'paragliding',
      tags: ['beginners', 'tandem', 'nepal'],
      cover: art('TANDEM FLIGHT', ['#0f172a', '#1e293b'], '#38bdf8', WING),
      body: doc(
        p(
          'For many Bangladeshi travellers the first paragliding flight happens in Nepal. Pokhara, with launches above Phewa Lake and views of the Annapurna range, is one of the best-known tandem sites in the world and a short flight from Dhaka via Kathmandu.',
        ),
        h2('How a tandem flight works'),
        p(
          'You fly in the same harness system as a qualified pilot, who controls the wing. You will be asked to run a few steps at launch and to sit back once you are airborne. Flights usually last from about twenty minutes to under an hour, depending on the package and the air that day.',
        ),
        h2('Best season'),
        p(
          'Autumn after the monsoon and spring before the heat usually bring the most stable flying days. Flights are often paused in the monsoon and in poor visibility; a good operator will cancel rather than fly in bad conditions.',
        ),
        h2('Choosing an operator'),
        ul([
          'Ask about the pilot’s licence and experience, and whether the company is registered and insured.',
          'Check that a reserve parachute is carried on every flight.',
          'Be wary of unusually cheap offers from street touts.',
          'Tell the pilot about any medical condition, back problem, or pregnancy.',
        ]),
      ),
    },
    {
      slug: 'reading-bangladesh-weather-for-flying',
      type: 'air_sports_update',
      title: 'Reading Bangladesh Weather Before You Fly',
      excerpt:
        'Nor’westers, monsoon cloud and winter fog: the seasonal patterns that matter for anyone flying paragliders, small aircraft or drones in Bangladesh.',
      category: 'weather',
      tags: ['monsoon', 'beginners'],
      cover: art('FLYING WEATHER', ['#1e1b4b', '#312e81'], '#a5b4fc', CLOUD),
      body: doc(
        p(
          'Bangladesh has some of the most changeable weather in South Asia. Anyone who flies, from paraglider pilots to drone operators, should understand the seasonal patterns before planning a flight.',
        ),
        h2('Pre-monsoon storms'),
        p(
          'In spring, violent afternoon thunderstorms known as nor’westers (kalbaishakhi) can build quickly, with strong gusts, hail and lightning. Clear mornings can turn dangerous within an hour; plan flights early and land well before storm clouds arrive.',
        ),
        h2('The monsoon'),
        p(
          'From roughly June to September, low cloud, heavy rain and gusty winds make most recreational flying unsafe. Use this season for ground handling practice, theory and equipment checks.',
        ),
        h2('Winter fog'),
        p(
          'December and January often bring dense morning fog, especially in the north and over rivers. Visibility can drop suddenly; never fly into cloud or fog.',
        ),
        h2('Before every flight'),
        ul([
          'Check the forecast from the Bangladesh Meteorological Department and a second source.',
          'Watch the sky for towering cumulus and darkening bases.',
          'If in doubt, do not fly: the weather will be there tomorrow.',
        ]),
      ),
    },
    {
      slug: 'tandem-skydiving-first-timers',
      type: 'air_sports_update',
      title: 'Tandem Skydiving: What First-Timers Should Know',
      excerpt:
        'Many Bangladeshis make their first jump abroad. What happens on jump day, common requirements, and questions to ask before you pay.',
      category: 'skydiving',
      tags: ['beginners', 'tandem'],
      cover: art('SKYDIVING', ['#172554', '#1e3a8a'], '#fca5a5', WING),
      body: doc(
        p(
          'A tandem skydive is the simplest way to experience freefall: you are attached to an experienced instructor who handles the exit, the parachute and the landing. Bangladeshi travellers usually make their first jump at established drop zones abroad.',
        ),
        h2('What happens on jump day'),
        ul([
          'A short briefing on body position for exit, freefall and landing.',
          'Fitting of the harness, checked by your instructor.',
          'A flight to altitude, a period of freefall, then several minutes under the parachute.',
        ]),
        h2('Common requirements'),
        p(
          'Drop zones set minimum age, maximum weight and medical rules. Recent diving, some heart conditions, and certain back or neck problems may rule you out on the day; check the requirements in advance and answer the medical form honestly.',
        ),
        h2('Questions to ask before you pay'),
        ul([
          'Is the drop zone and the instructor certified by a recognised national body?',
          'What happens to my booking if weather cancels the jump?',
          'Is the video or photo package filmed by a separate camera flyer?',
        ]),
      ),
    },
    {
      slug: 'paragliding-preflight-checklist',
      type: 'air_sports_update',
      title: 'The Paragliding Pre-Flight Checklist Every Student Should Learn',
      excerpt:
        'A simple, repeatable check before every launch catches most avoidable accidents. Here is the routine instructors teach from day one.',
      category: 'safety',
      tags: ['checklist', 'beginners'],
      cover: art('PRE-FLIGHT', ['#022c22', '#064e3b'], '#5eead4', SHIELD),
      body: doc(
        p(
          'Most paragliding accidents involving students happen close to the ground, and many start with something a pre-flight check would have caught. Learn one routine and use it every time, however experienced you become.',
        ),
        h2('Before you lay out the wing'),
        ul([
          'Weather: wind strength and direction within your limits, no storms building.',
          'Site: launch clear, landing field identified, obstacles noted.',
          'You: rested, hydrated, and feeling ready to fly.',
        ]),
        h2('The equipment check'),
        ul([
          'Harness: all buckles closed, leg straps fastened first and checked twice.',
          'Reserve: handle in place and pin secure.',
          'Helmet: on and fastened.',
          'Lines: untangled and free of knots, risers not twisted.',
          'Carabiners: closed and locked.',
        ]),
        h2('Just before launch'),
        p(
          'Check the airspace and the wind once more, then commit. If anything feels wrong, stop, clear the launch, and start the checklist again. A good flight always starts with a calm, complete check.',
        ),
      ),
    },
    {
      slug: 'flying-drones-responsibly-bangladesh',
      type: 'air_sports_update',
      title: 'Flying Drones Responsibly in Bangladesh',
      excerpt:
        'Drones are regulated in Bangladesh. Why permission matters, where you must never fly, and habits that keep people and aircraft safe.',
      category: 'safety',
      tags: ['drones', 'beginners'],
      cover: art('DRONES', ['#18181b', '#27272a'], '#fcd34d', DRONE),
      body: doc(
        p(
          'Drones have made aerial photography easy, but in Bangladesh they are regulated aircraft, not toys. Flying without the required permission can lead to the drone being seized and to legal action.',
        ),
        h2('Permission comes first'),
        p(
          'The Civil Aviation Authority of Bangladesh (CAAB) and other authorities set the rules for registering and flying drones, and the requirements depend on the drone and the purpose of the flight. Check the current rules with CAAB before you buy, import, or fly.',
        ),
        h2('Never fly near'),
        ul([
          'Airports, airfields, and helicopter landing sites.',
          'Military areas and other restricted or sensitive locations.',
          'Crowds, public events, and people who have not agreed to be filmed.',
        ]),
        h2('Good habits'),
        ul([
          'Keep the drone within your direct line of sight.',
          'Check the battery and propellers before every flight.',
          'Respect privacy: do not film homes or people without consent.',
          'Land immediately if a manned aircraft approaches.',
        ]),
      ),
    },
  ],
};

export const PRODUCTION_SITES: readonly SeedSite[] = [TRAVEL_SITE, AIR_SPORTS_SITE];
