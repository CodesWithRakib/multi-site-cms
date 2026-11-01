import { mergeAttributes, Node } from '@tiptap/core';

export interface EventTimelineBlockAttributes {
  time: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'completed' | 'delayed' | 'cancelled';
  windSpeed?: string;
  weatherCondition?: string;
  alertLevel?: 'normal' | 'advisory' | 'warning';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    eventTimelineBlock: {
      setEventTimelineBlock: (attrs: EventTimelineBlockAttributes) => ReturnType;
    };
  }
}

export const EventTimelineBlock = Node.create({
  name: 'eventTimelineBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      time: { default: '00:00' },
      title: { default: '' },
      description: { default: '' },
      status: { default: 'scheduled' },
      windSpeed: { default: '' },
      weatherCondition: { default: '' },
      alertLevel: { default: 'normal' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="event-timeline-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const isWarning = node.attrs.alertLevel === 'warning';
    const isAdvisory = node.attrs.alertLevel === 'advisory';
    const borderColor = isWarning
      ? 'border-amber-300 bg-amber-50/40 dark:border-amber-800'
      : isAdvisory
        ? 'border-blue-300 bg-blue-50/40 dark:border-blue-800'
        : 'border-slate-200 bg-slate-50/30 dark:border-slate-800';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'event-timeline-block',
        class: `my-4 p-4 rounded-xl border ${borderColor} shadow-xs relative`,
      }),
      [
        'div',
        { class: 'flex items-center justify-between gap-2 mb-2' },
        [
          'div',
          { class: 'flex items-center gap-2' },
          [
            'span',
            {
              class:
                'text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
            },
            node.attrs.time,
          ],
          [
            'h4',
            { class: 'text-base font-bold text-slate-900 dark:text-slate-100' },
            node.attrs.title || 'Timeline Event',
          ],
        ],
        [
          'span',
          {
            class:
              'text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
          },
          node.attrs.status,
        ],
      ],
      node.attrs.description
        ? [
            'p',
            { class: 'text-sm text-slate-600 dark:text-slate-300 mb-2' },
            node.attrs.description,
          ]
        : ['span', {}, ''],
      node.attrs.windSpeed || node.attrs.weatherCondition
        ? [
            'div',
            {
              class:
                'flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400',
            },
            node.attrs.windSpeed
              ? ['span', {}, `💨 Wind: ${node.attrs.windSpeed}`]
              : ['span', {}, ''],
            node.attrs.weatherCondition
              ? ['span', {}, `⛅ Condition: ${node.attrs.weatherCondition}`]
              : ['span', {}, ''],
            node.attrs.alertLevel && node.attrs.alertLevel !== 'normal'
              ? [
                  'span',
                  { class: 'text-amber-600 dark:text-amber-400 font-medium' },
                  `⚠️ Alert: ${node.attrs.alertLevel}`,
                ]
              : ['span', {}, ''],
          ]
        : ['span', {}, ''],
    ];
  },

  addCommands() {
    return {
      setEventTimelineBlock:
        (attrs) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs }).run();
        },
    };
  },
});
