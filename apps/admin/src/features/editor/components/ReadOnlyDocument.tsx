'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';

import { getEditorExtensions } from '../configs/editor-presets';

export interface ReadOnlyDocumentProps {
  /** Tiptap JSON exactly as the editor saves it. */
  readonly content: JSONContent;
  readonly contentType?: string;
  readonly className?: string;
}

/**
 * Renders a saved post body with the editor's own extensions, so previews
 * show every block (callouts, destination cards, timelines, tables, images)
 * the way the author wrote it. Read-only: nothing here can change the post.
 */
export function ReadOnlyDocument({
  content,
  contentType = 'article',
  className = '',
}: ReadOnlyDocumentProps) {
  const editor = useEditor({
    extensions: getEditorExtensions({ contentType, placeholder: '' }),
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: `cms-editor-content ${className}` },
    },
  });

  // Keep the view in sync when the previewed document changes.
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.commands.setContent(content);
  }, [editor, content]);

  return <EditorContent editor={editor} />;
}
