import { Mark } from '@tiptap/core';

export const StoryLinkExtension = Mark.create({
  name: 'storyLink',
  priority: 1001,

  addAttributes() {
    return {
      storySlug: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-story-slug]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      {
        'data-story-slug': HTMLAttributes.storySlug,
        class: 'story-link text-amber-700 underline cursor-pointer',
      },
      0,
    ];
  },
});

export const SanskritExtension = Mark.create({
  name: 'sanskrit',
  priority: 1000,

  addAttributes() {
    return {
      transliteration: { default: null },
      meaning:         { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-sanskrit]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const title = [HTMLAttributes.transliteration, HTMLAttributes.meaning]
      .filter(Boolean)
      .join(' — ');
    return [
      'span',
      {
        'data-sanskrit': 'true',
        title: title || undefined,
        class: 'text-purple-700 border-b border-dotted border-purple-400 cursor-help',
      },
      0,
    ];
  },
});
