import { z } from 'zod';
import type { CreateStoryRequest, Story, Block, InlineNode, Mark } from './types';

const MarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({
    type: z.literal('link'),
    href: z.string().url('Must be a valid URL'),
    target: z.enum(['_blank', '_self']),
  }),
  z.object({
    type: z.literal('storyLink'),
    storySlug: z.string().min(1, 'Story slug required').regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid slug'),
  }),
  z.object({
    type: z.literal('sanskrit'),
    transliteration: z.string().optional().nullable(),
    meaning: z.string().optional().nullable(),
  }),
]);

const InlineNodeSchema = z.object({
  text: z.string().min(1, 'Text required'),
  marks: z.array(MarkSchema),
});

const BlockSchema: z.ZodType = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('leadParagraph'),
    content: z.array(InlineNodeSchema).min(1),
  }),
  z.object({
    type: z.literal('paragraph'),
    content: z.array(InlineNodeSchema).min(1),
  }),
  z.object({
    type: z.literal('dialogue'),
    speaker: z.string().min(1, 'Speaker required'),
    content: z.array(InlineNodeSchema).min(1),
  }),
  z.object({
    type: z.literal('sceneImage'),
    url: z.string().min(1, 'Image required'),
    alt: z.string().min(1, 'Alt text required'),
    caption: z.string().optional().nullable(),
    aspectRatio: z.enum(['1:1', '3:4', '16:9']),
    generationPrompt: z.string().optional().nullable(),
  }),
  z.object({ type: z.literal('divider') }),
  z.object({
    type: z.literal('spacer'),
    size: z.enum(['sm', 'md', 'lg']),
  }),
]);

export const StoryFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug required')
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Only lowercase letters, numbers, hyphens',
    ),
  title: z.string().min(1, 'Title required').max(200),
  subtitle: z.string().max(300).optional().nullable(),
  source: z.string().min(1, 'Source required'),
  heroMeta: z
    .array(z.string().min(1))
    .min(1, 'At least 1 tag')
    .max(4, 'Max 4 tags'),
  status: z.enum(['draft', 'published']),
  featuredImageUrl: z.string().min(1, 'Featured image required'),
  featuredImageAlt: z.string().min(1, 'Alt text required'),
  featuredImageRatio: z.enum(['1:1', '3:4', '16:9']),
  featuredImagePrompt: z.string().optional().nullable(),
  metaCharacters: z.string().min(1, 'Characters required'),
  metaTheme: z.string().min(1, 'Theme required'),
  metaSource: z.string().min(1, 'Source required'),
  metaVerification: z.string().optional().nullable(),
  blocks: z.array(BlockSchema).min(1, 'At least one block required'),
  moral: z.array(InlineNodeSchema).optional().nullable(),
  teaserSlug: z.string().optional().nullable(),
  teaserContent: z.array(InlineNodeSchema).optional().nullable(),
  readingTimeMinutes: z.number().optional().nullable(),
});

export type StoryFormValues = z.infer<typeof StoryFormSchema>;

export function storyFormToRequest(values: StoryFormValues): CreateStoryRequest {
  return {
    schemaVersion: 1,
    slug: values.slug,
    title: values.title,
    subtitle: values.subtitle || null,
    source: values.source,
    heroMeta: values.heroMeta,
    status: values.status,
    featuredImage: {
      url: values.featuredImageUrl,
      alt: values.featuredImageAlt,
      aspectRatio: values.featuredImageRatio,
      generationPrompt: values.featuredImagePrompt || null,
    },
    metadata: {
      characters: values.metaCharacters,
      theme: values.metaTheme,
      source: values.metaSource,
      verification: values.metaVerification || null,
    },
    blocks: values.blocks as Block[],
    moral:
      values.moral && values.moral.length > 0 ? (values.moral as InlineNode[]) : null,
    teaser:
      values.teaserSlug &&
      values.teaserContent &&
      values.teaserContent.length > 0
        ? {
            nextStorySlug: values.teaserSlug,
            content: values.teaserContent as InlineNode[],
          }
        : null,
    readingTimeMinutes: values.readingTimeMinutes || null,
  };
}

/**
 * Convert current form values to a Story object for live preview.
 * Pass a `resolveUrl` function to swap @file: refs for blob preview URLs.
 */
export function formValuesToStory(
  values: StoryFormValues,
  resolveUrl: (ref: string) => string | undefined,
): Story {
  const resolvedFeaturedUrl =
    values.featuredImageUrl.startsWith('@file:')
      ? resolveUrl(values.featuredImageUrl.replace('@file:', '')) ?? ''
      : values.featuredImageUrl;

  const resolvedBlocks = (values.blocks as Block[]).map((block) => {
    if (block.type === 'sceneImage' && block.url.startsWith('@file:')) {
      const ref = block.url.replace('@file:', '');
      return { ...block, url: resolveUrl(ref) ?? '' };
    }
    return block;
  });

  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: 'preview',
    slug: values.slug || 'preview',
    title: values.title || 'Untitled Story',
    subtitle: values.subtitle || null,
    source: values.source || '',
    heroMeta: values.heroMeta,
    status: values.status,
    featuredImage: {
      url: resolvedFeaturedUrl,
      alt: values.featuredImageAlt,
      aspectRatio: values.featuredImageRatio,
      generationPrompt: values.featuredImagePrompt || null,
    },
    metadata: {
      characters: values.metaCharacters,
      theme: values.metaTheme,
      source: values.metaSource,
      verification: values.metaVerification || null,
    },
    blocks: resolvedBlocks,
    moral:
      values.moral && values.moral.length > 0
        ? (values.moral as InlineNode[])
        : null,
    teaser:
      values.teaserSlug && values.teaserContent && values.teaserContent.length > 0
        ? { nextStorySlug: values.teaserSlug, content: values.teaserContent as InlineNode[] }
        : null,
    readingTimeMinutes: values.readingTimeMinutes ?? 0,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function storyToFormValues(story: Story): StoryFormValues {
  return {
    slug: story.slug,
    title: story.title,
    subtitle: story.subtitle,
    source: story.source,
    heroMeta: story.heroMeta,
    status: story.status,
    featuredImageUrl: story.featuredImage.url,
    featuredImageAlt: story.featuredImage.alt,
    featuredImageRatio: story.featuredImage.aspectRatio,
    featuredImagePrompt: story.featuredImage.generationPrompt,
    metaCharacters: story.metadata.characters,
    metaTheme: story.metadata.theme,
    metaSource: story.metadata.source,
    metaVerification: story.metadata.verification,
    blocks: story.blocks,
    moral: story.moral,
    teaserSlug: story.teaser?.nextStorySlug ?? null,
    teaserContent: story.teaser?.content ?? null,
    readingTimeMinutes: story.readingTimeMinutes,
  };
}
