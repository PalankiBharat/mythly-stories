'use client';

import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import { StoryLinkExtension, SanskritExtension } from '@/lib/tiptap-extensions';
import { tiptapToInlineNodes, inlineNodesToTiptap } from '@/lib/tiptap-convert';
import { RichTextToolbar } from './rich-text-toolbar';
import type { InlineNode } from '@/lib/types';

interface Props {
  name: string;
  label?: string;
}

export function InlineEditor({ name, label }: Props) {
  const { watch, setValue } = useFormContext();
  const initialNodes: InlineNode[] = watch(name) ?? [];
  const isUpdatingFromEditor = useRef(false);
  const isUpdatingFromForm = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      StoryLinkExtension,
      SanskritExtension,
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: inlineNodesToTiptap(initialNodes) as JSONContent[],
        },
      ],
    } as JSONContent,
    onUpdate({ editor: e }) {
      if (isUpdatingFromForm.current) return;
      isUpdatingFromEditor.current = true;
      const content = e.getJSON().content?.[0]?.content ?? [];
      setValue(name, tiptapToInlineNodes(content as unknown[]), { shouldDirty: true });
      isUpdatingFromEditor.current = false;
    },
    editorProps: {
      attributes: {
        class: 'tiptap outline-none min-h-[80px] px-3 py-2.5 text-sm leading-relaxed text-stone-800',
      },
    },
  });

  // Sync external form value changes into editor (e.g. reset)
  const formValue: InlineNode[] = watch(name) ?? [];
  const prevFormValue = useRef<string>(JSON.stringify(initialNodes));

  useEffect(() => {
    if (!editor || isUpdatingFromEditor.current) return;
    const serialized = JSON.stringify(formValue);
    if (serialized === prevFormValue.current) return;
    prevFormValue.current = serialized;
    isUpdatingFromForm.current = true;
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: inlineNodesToTiptap(formValue) as JSONContent[] }],
    } as JSONContent);
    isUpdatingFromForm.current = false;
  }, [editor, formValue]);

  if (!editor) return null;

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      )}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-300 transition-all">
        <RichTextToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <p className="text-[10px] text-stone-400">
        Select text then use the toolbar to apply formatting
      </p>
    </div>
  );
}
