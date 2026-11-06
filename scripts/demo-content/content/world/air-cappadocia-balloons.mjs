import { b, callout, doc, h2, image, ol, p, quote, ul } from '../../lib/doc.mjs';

export default (m) => ({
  site: 'air-sports',
  slug: 'hot-air-balloon-cappadocia',
  title: 'Sunrise Over Cappadocia: A Hot-Air Balloon Guide',
  excerpt:
    'At dawn, dozens of balloons lift over the fairy chimneys of Göreme. How the flights work, why they are often cancelled and how to choose a safe operator.',
  type: 'article',
  featured: m.cappadociaBalloons,
  categories: ['Ballooning'],
  tags: ['Türkiye', 'Cappadocia', 'Hot-Air Balloon', 'Sunrise'],
  seoTitle: 'Cappadocia Hot-Air Balloon Ride: Season, Safety & Tips',
  seoDescription:
    'What to expect from a Cappadocia balloon flight: the early start, weather cancellations, best months and how to pick an operator.',
  body: doc(
    p(
      'Cappadocia, in central Türkiye, is one of the busiest ballooning areas in the world. On calm mornings the valleys around ',
      b('Göreme'),
      ' fill with balloons drifting over cave churches and rock towers known as fairy chimneys.',
    ),
    image(m.cappadociaChimneys, m.cappadociaChimneys.caption),
    h2('How a flight works'),
    ol(
      'Pick-up from your hotel before dawn',
      'Watch the crew inflate the envelope with fans and the burner',
      'About an hour in the air, drifting with the wind',
      'A gentle landing, often onto the trailer itself',
    ),
    image(m.cappadociaBasket, m.cappadociaBasket.caption),
    h2('Why flights get cancelled'),
    p(
      'Flights are allowed only when the authorities confirm that ',
      b('wind and visibility'),
      ' are safe, and the decision often comes that morning. Book your balloon for the first morning of your stay so you have spare days if it is called off.',
    ),
    callout('info', [
      b('Best months. '),
      'Spring and autumn have the most reliable flying weather. Winter mornings are beautiful but cancellations are more frequent.',
    ]),
    image(m.cappadociaSunrise, m.cappadociaSunrise.caption),
    h2('Choosing an operator'),
    ul(
      'Check that the company is licensed and insured',
      'Ask about the pilot’s experience and the basket size',
      'Very cheap offers often mean very crowded baskets',
    ),
    callout('warning', [
      b('Landing position. '),
      'Listen to the pilot’s landing briefing: bend your knees, hold the rope handles and stay in the basket until told to get out.',
    ]),
    image(m.cappadociaGoreme, m.cappadociaGoreme.caption),
    quote('In Cappadocia, the sunrise comes with company.'),
  ),
});
