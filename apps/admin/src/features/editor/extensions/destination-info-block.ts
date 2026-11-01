import { mergeAttributes, Node } from '@tiptap/core';

export interface DestinationInfoBlockAttributes {
  destination: string;
  country: string;
  region?: string;
  bestSeason?: string;
  elevation?: string;
  highlights?: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    destinationInfoBlock: {
      setDestinationInfoBlock: (attrs: DestinationInfoBlockAttributes) => ReturnType;
    };
  }
}

export const DestinationInfoBlock = Node.create({
  name: 'destinationInfoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      destination: { default: '' },
      country: { default: '' },
      region: { default: '' },
      bestSeason: { default: '' },
      elevation: { default: '' },
      highlights: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute('data-highlights');
          if (!raw) return [];
          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          'data-highlights': JSON.stringify(attributes.highlights || []),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="destination-info-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const highlights = (node.attrs.highlights as string[]) || [];

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'destination-info-block',
        class:
          'my-6 p-5 rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800 shadow-sm',
      }),
      [
        'div',
        {
          class:
            'flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-800/60',
        },
        [
          'div',
          {},
          [
            'h4',
            { class: 'text-lg font-bold text-sky-900 dark:text-sky-100' },
            node.attrs.destination || 'Destination',
          ],
          node.attrs.country
            ? [
                'span',
                { class: 'text-sm text-sky-600 dark:text-sky-300' },
                `${node.attrs.region ? `${node.attrs.region}, ` : ''}${node.attrs.country}`,
              ]
            : ['span', {}, ''],
        ],
        [
          'span',
          {
            class:
              'text-xs uppercase px-2.5 py-1 rounded-full font-semibold tracking-wider bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200',
          },
          'Travel Guide',
        ],
      ],
      [
        'div',
        { class: 'grid grid-cols-2 gap-4 mt-3 text-sm' },
        node.attrs.bestSeason
          ? [
              'div',
              {},
              [
                'span',
                { class: 'text-xs text-slate-500 dark:text-slate-400 block' },
                'Best Season',
              ],
              ['strong', { class: 'text-slate-800 dark:text-slate-200' }, node.attrs.bestSeason],
            ]
          : ['div', {}, ''],
        node.attrs.elevation
          ? [
              'div',
              {},
              [
                'span',
                { class: 'text-xs text-slate-500 dark:text-slate-400 block' },
                'Altitude / Elevation',
              ],
              ['strong', { class: 'text-slate-800 dark:text-slate-200' }, node.attrs.elevation],
            ]
          : ['div', {}, ''],
      ],
      highlights.length > 0
        ? [
            'div',
            { class: 'mt-3 pt-3 border-t border-sky-100/60 dark:border-sky-800/40' },
            [
              'span',
              { class: 'text-xs font-semibold text-sky-800 dark:text-sky-300 block mb-1' },
              'Key Highlights:',
            ],
            [
              'ul',
              {
                class:
                  'list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-0.5',
              },
              ...highlights.map((h) => ['li', {}, h]),
            ],
          ]
        : ['div', {}, ''],
    ];
  },

  addCommands() {
    return {
      setDestinationInfoBlock:
        (attrs) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs }).run();
        },
    };
  },
});
