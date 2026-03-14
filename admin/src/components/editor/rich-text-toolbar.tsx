'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bold, Italic, Underline, ExternalLink, Link2, BookOpen, X } from 'lucide-react';
import { useStories } from '@/lib/use-stories';

interface Props {
  editor: Editor;
}

type PopoverType = 'link' | 'storyLink' | 'sanskrit' | null;

export function RichTextToolbar({ editor }: Props) {
  const [popover, setPopover] = useState<PopoverType>(null);

  // Link state
  const [linkHref, setLinkHref] = useState('https://');
  const [linkTarget, setLinkTarget] = useState<'_blank' | '_self'>('_blank');

  // Story link state
  const [storySlugQuery, setStorySlugQuery] = useState('');

  // Sanskrit state
  const [transliteration, setTransliteration] = useState('');
  const [meaning, setMeaning] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    if (popover) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  const openLinkPopover = () => {
    const existing = editor.getAttributes('link');
    setLinkHref(existing.href ?? 'https://');
    setLinkTarget(existing.target ?? '_blank');
    setPopover('link');
  };

  const openStoryLinkPopover = () => {
    const existing = editor.getAttributes('storyLink');
    setStorySlugQuery(existing.storySlug ?? '');
    setPopover('storyLink');
  };

  const openSanskritPopover = () => {
    const existing = editor.getAttributes('sanskrit');
    setTransliteration(existing.transliteration ?? '');
    setMeaning(existing.meaning ?? '');
    setPopover('sanskrit');
  };

  const applyLink = () => {
    if (!linkHref || linkHref === 'https://') {
      editor.chain().focus().unsetMark('link').run();
    } else {
      editor.chain().focus()
        .unsetMark('storyLink')
        .setMark('link', { href: linkHref, target: linkTarget })
        .run();
    }
    setPopover(null);
  };

  const applyStoryLink = (slug: string) => {
    if (!slug) {
      editor.chain().focus().unsetMark('storyLink').run();
    } else {
      editor.chain().focus()
        .unsetMark('link')
        .setMark('storyLink', { storySlug: slug })
        .run();
    }
    setPopover(null);
    setStorySlugQuery('');
  };

  const applySanskrit = () => {
    editor.chain().focus()
      .setMark('sanskrit', {
        transliteration: transliteration || null,
        meaning: meaning || null,
      })
      .run();
    setPopover(null);
  };

  const isLink = editor.isActive('link');
  const isStoryLink = editor.isActive('storyLink');
  const isSanskrit = editor.isActive('sanskrit');

  return (
    <div className="relative flex flex-wrap items-center gap-1 px-3 py-2 border-b border-stone-200 bg-stone-50 rounded-t-lg">
      {/* B / I / U */}
      <div className="flex gap-0.5 border border-stone-200 rounded-md p-1 bg-white">
        <ToolBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold size={12} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic size={12} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Underline"
        >
          <Underline size={12} />
        </ToolBtn>
      </div>

      <div className="w-px h-5 bg-stone-200 mx-0.5" />

      {/* Link */}
      <button
        type="button"
        aria-label="External link"
        onClick={openLinkPopover}
        className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium transition-colors ${
          isLink
            ? 'bg-green-700 text-white hover:bg-green-800'
            : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
        }`}
      >
        <ExternalLink size={11} /> Link
        {isLink && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove link"
            className="ml-0.5 hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); editor.chain().focus().unsetMark('link').run(); }}
            onKeyDown={(e) => e.key === 'Enter' && editor.chain().focus().unsetMark('link').run()}
          >
            <X size={10} />
          </span>
        )}
      </button>

      {/* Story Link */}
      <button
        type="button"
        aria-label="Story link"
        onClick={openStoryLinkPopover}
        className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium transition-colors ${
          isStoryLink
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
        }`}
      >
        <Link2 size={11} /> Story
        {isStoryLink && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove story link"
            className="ml-0.5 hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); editor.chain().focus().unsetMark('storyLink').run(); }}
            onKeyDown={(e) => e.key === 'Enter' && editor.chain().focus().unsetMark('storyLink').run()}
          >
            <X size={10} />
          </span>
        )}
      </button>

      {/* Sanskrit */}
      <button
        type="button"
        aria-label="Sanskrit"
        onClick={openSanskritPopover}
        className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium transition-colors ${
          isSanskrit
            ? 'bg-purple-700 text-white hover:bg-purple-800'
            : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
        }`}
      >
        <BookOpen size={11} /> Sanskrit
        {isSanskrit && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove sanskrit"
            className="ml-0.5 hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); editor.chain().focus().unsetMark('sanskrit').run(); }}
            onKeyDown={(e) => e.key === 'Enter' && editor.chain().focus().unsetMark('sanskrit').run()}
          >
            <X size={10} />
          </span>
        )}
      </button>

      {/* Popovers */}
      {popover && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-stone-200 rounded-lg shadow-lg p-3 min-w-64"
        >
          {popover === 'link' && (
            <LinkPopover
              href={linkHref}
              target={linkTarget}
              onHrefChange={setLinkHref}
              onTargetChange={setLinkTarget}
              onApply={applyLink}
              onCancel={() => setPopover(null)}
            />
          )}
          {popover === 'storyLink' && (
            <StoryLinkPopover
              query={storySlugQuery}
              onQueryChange={setStorySlugQuery}
              onSelect={applyStoryLink}
              onCancel={() => setPopover(null)}
            />
          )}
          {popover === 'sanskrit' && (
            <SanskritPopover
              transliteration={transliteration}
              meaning={meaning}
              onTransliterationChange={setTransliteration}
              onMeaningChange={setMeaning}
              onApply={applySanskrit}
              onCancel={() => setPopover(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 w-8 p-0 ${active ? 'bg-stone-800 text-white hover:bg-stone-700' : 'text-stone-500 hover:text-stone-900'}`}
    >
      {children}
    </Button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Popover sub-components
// ──────────────────────────────────────────────────────────────────────────────

function LinkPopover({
  href, target, onHrefChange, onTargetChange, onApply, onCancel,
}: {
  href: string; target: '_blank' | '_self';
  onHrefChange: (v: string) => void;
  onTargetChange: (v: '_blank' | '_self') => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">External Link</p>
      <Input
        autoFocus
        value={href}
        onChange={(e) => onHrefChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onApply()}
        placeholder="https://..."
        className="h-8 text-sm"
      />
      <select
        value={target}
        onChange={(e) => onTargetChange(e.target.value as '_blank' | '_self')}
        className="w-full h-8 text-xs rounded-md border border-stone-200 bg-white px-2 text-stone-700"
      >
        <option value="_blank">Open in new tab</option>
        <option value="_self">Open in same tab</option>
      </select>
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" className="flex-1 h-7 text-xs" onClick={onApply}>Apply</Button>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function StoryLinkPopover({
  query, onQueryChange, onSelect, onCancel,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSelect: (slug: string) => void;
  onCancel: () => void;
}) {
  const { data } = useStories({ limit: 50, offset: 0 });
  const stories = data?.items ?? [];
  const filtered = stories.filter(
    (s) =>
      s.slug.includes(query.toLowerCase()) ||
      s.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Story Link</p>
      <Input
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by title or slug..."
        className="h-8 text-sm"
      />
      {filtered.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-md divide-y divide-stone-100">
          {filtered.slice(0, 10).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.slug)}
              className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors"
            >
              <p className="text-xs font-medium text-stone-800 truncate">{s.title}</p>
              <p className="text-[10px] font-mono text-stone-400 truncate">{s.slug}</p>
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 && query && (
        <p className="text-xs text-stone-400 text-center py-2">No stories match</p>
      )}
      <Button type="button" size="sm" variant="outline" className="w-full h-7 text-xs" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function SanskritPopover({
  transliteration, meaning,
  onTransliterationChange, onMeaningChange,
  onApply, onCancel,
}: {
  transliteration: string; meaning: string;
  onTransliterationChange: (v: string) => void;
  onMeaningChange: (v: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Sanskrit Mark</p>
      <Input
        autoFocus
        value={transliteration}
        onChange={(e) => onTransliterationChange(e.target.value)}
        placeholder="Transliteration (e.g. dharma)"
        className="h-8 text-sm"
      />
      <Input
        value={meaning}
        onChange={(e) => onMeaningChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onApply()}
        placeholder="Meaning (e.g. duty, moral order)"
        className="h-8 text-sm"
      />
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" className="flex-1 h-7 text-xs bg-purple-700 hover:bg-purple-800" onClick={onApply}>Apply</Button>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
