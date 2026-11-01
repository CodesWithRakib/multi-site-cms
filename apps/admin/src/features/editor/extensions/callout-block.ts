import { mergeAttributes, Node } from '@tiptap/core';

export type CalloutType = 'info' | 'warning' | 'tip' | 'alert';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBlock: {
      setCalloutBlock: (attrs?: { type?: CalloutType }) => ReturnType;
      toggleCalloutBlock: (attrs?: { type?: CalloutType }) => ReturnType;
    };
  }
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type as CalloutType;
    const colors: Record<CalloutType, string> = {
      info: 'border-l-4 border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/20 dark:border-l-blue-400',
      warning:
        'border-l-4 border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20 dark:border-l-amber-400',
      tip: 'border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-l-emerald-400',
      alert:
        'border-l-4 border-l-rose-500 bg-rose-50/60 dark:bg-rose-950/20 dark:border-l-rose-400',
    };

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout-block',
        class: `my-4 p-4 rounded-r-lg ${colors[type] || colors.info}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCalloutBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attrs);
        },
      toggleCalloutBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attrs);
        },
    };
  },
});
