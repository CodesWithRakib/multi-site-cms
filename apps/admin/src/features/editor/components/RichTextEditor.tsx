'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';

import { getEditorExtensions } from '../configs/editor-presets';
import type { DestinationInfoBlockAttributes } from '../extensions/destination-info-block';
import type { EventTimelineBlockAttributes } from '../extensions/event-timeline-block';
import { EditorBubbleMenu } from './BubbleMenu';
import { CustomBlockModal, type ActiveModalType } from './CustomBlockModal';
import { EditorToolbar } from './EditorToolbar';
import { WordCountBar } from './WordCountBar';

export interface RichTextEditorProps {
  initialContent?: Record<string, unknown> | string;
  contentType?: string;
  placeholder?: string;
  onChange?: (json: Record<string, unknown>, html: string) => void;
  onOpenMediaLibrary?: () => void;
  editorRef?: React.MutableRefObject<Editor | null>;
  className?: string;
}

export function RichTextEditor({
  initialContent,
  contentType = 'article',
  placeholder,
  onChange,
  onOpenMediaLibrary,
  editorRef,
  className = '',
}: RichTextEditorProps) {
  const [modalType, setModalType] = useState<ActiveModalType>(null);

  const editor = useEditor({
    extensions: getEditorExtensions({ contentType, placeholder }),
    content: initialContent || '',
    editorProps: {
      attributes: {
        // Named multi-line text box for screen readers (WCAG 4.1.2).
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Post body',
        class:
          'cms-editor-content min-h-[360px] p-6 sm:px-10 sm:py-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (onChange) {
        onChange(currentEditor.getJSON(), currentEditor.getHTML());
      }
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Insert callbacks from CustomBlockModal
  const handleInsertDestination = (attrs: DestinationInfoBlockAttributes) => {
    editor?.chain().focus().setDestinationInfoBlock(attrs).run();
  };

  const handleInsertTimeline = (attrs: EventTimelineBlockAttributes) => {
    editor?.chain().focus().setEventTimelineBlock(attrs).run();
  };

  const handleInsertLink = (url: string) => {
    if (url) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
  };

  const handleInsertYoutube = (url: string) => {
    editor?.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  return (
    <div
      className={`flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs ${className}`}
    >
      <EditorToolbar
        editor={editor}
        contentType={contentType}
        onOpenMediaPicker={onOpenMediaLibrary}
        onOpenLinkModal={() => setModalType('link')}
        onOpenYoutubeModal={() => setModalType('youtube')}
        onOpenDestinationModal={() => setModalType('destination')}
        onOpenTimelineModal={() => setModalType('timeline')}
      />

      <EditorBubbleMenu editor={editor} onOpenLinkModal={() => setModalType('link')} />

      <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

      <WordCountBar
        editor={editor}
        modeLabel={
          contentType === 'travel_guide'
            ? 'Travel Guide'
            : contentType === 'air_sports_update' || contentType === 'live_update'
              ? 'Air Sports Live'
              : undefined
        }
      />

      <CustomBlockModal
        modalType={modalType}
        onClose={() => setModalType(null)}
        onInsertDestination={handleInsertDestination}
        onInsertTimeline={handleInsertTimeline}
        onInsertLink={handleInsertLink}
        onInsertYoutube={handleInsertYoutube}
      />
    </div>
  );
}
