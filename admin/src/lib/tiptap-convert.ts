import type { InlineNode, Mark, LinkMark, StoryLinkMark, SanskritMark } from './types';

function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string') return false;
  try {
    const u = new URL(href);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Convert TipTap paragraph content array → API InlineNode[] */
export function tiptapToInlineNodes(tiptapContent: unknown[]): InlineNode[] {
  const nodes: InlineNode[] = [];
  for (const node of tiptapContent) {
    if (typeof node !== 'object' || node === null) continue;
    const n = node as Record<string, unknown>;
    if (n.type !== 'text' || typeof n.text !== 'string') continue;

    const rawMarks = Array.isArray(n.marks) ? n.marks : [];
    const marks: Mark[] = rawMarks
      .map((m: unknown): Mark | null => {
        if (typeof m !== 'object' || m === null) return null;
        const mark = m as Record<string, unknown>;
        const attrs = (mark.attrs ?? {}) as Record<string, unknown>;
        switch (mark.type) {
          case 'bold':      return { type: 'bold' };
          case 'italic':    return { type: 'italic' };
          case 'underline': return { type: 'underline' };
          case 'link': {
            const href = isSafeHref(attrs.href) ? attrs.href : null;
            if (!href) return null;
            return {
              type: 'link',
              href,
              target: attrs.target === '_self' ? '_self' : '_blank',
            } as LinkMark;
          }
          case 'storyLink':
            return {
              type: 'storyLink',
              storySlug: typeof attrs.storySlug === 'string' ? attrs.storySlug : '',
            } as StoryLinkMark;
          case 'sanskrit':
            return {
              type: 'sanskrit',
              transliteration: typeof attrs.transliteration === 'string' ? attrs.transliteration : null,
              meaning: typeof attrs.meaning === 'string' ? attrs.meaning : null,
            } as SanskritMark;
          default: return null;
        }
      })
      .filter((m): m is Mark => m !== null);

    nodes.push({ text: n.text, marks });
  }
  return nodes;
}

/** Convert API InlineNode[] → TipTap paragraph content array */
export function inlineNodesToTiptap(nodes: InlineNode[]): unknown[] {
  return nodes.map((node) => ({
    type: 'text',
    text: node.text,
    marks: node.marks.map((m): unknown => {
      switch (m.type) {
        case 'bold':      return { type: 'bold' };
        case 'italic':    return { type: 'italic' };
        case 'underline': return { type: 'underline' };
        case 'link':
          return { type: 'link', attrs: { href: m.href, target: m.target } };
        case 'storyLink':
          return { type: 'storyLink', attrs: { storySlug: m.storySlug } };
        case 'sanskrit':
          return { type: 'sanskrit', attrs: { transliteration: m.transliteration ?? null, meaning: m.meaning ?? null } };
      }
    }),
  }));
}
