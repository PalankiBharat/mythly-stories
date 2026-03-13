'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StoryFormSchema,
  StoryFormValues,
  storyFormToRequest,
  storyToFormValues,
} from '@/lib/story-schema';
import { useImageSlots } from '@/lib/use-image-slots';
import { BlockEditor } from './block-editor';
import { InlineEditor } from './inline-editor';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  X,
  BookOpen,
  Database,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Hash,
  Eye,
} from 'lucide-react';
import type { Story } from '@/lib/types';
import { StoryPreview } from '@/components/preview/story-preview';
import { formValuesToStory } from '@/lib/story-schema';
import { toast } from 'sonner';

interface Props {
  story?: Story;
  isLoading?: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function StoryForm({ story, isLoading, onSubmit }: Props) {
  const imageSlots = useImageSlots();
  const [tagInput, setTagInput] = useState('');

  const defaultValues: StoryFormValues = story
    ? storyToFormValues(story)
    : {
        slug: '',
        title: '',
        subtitle: null,
        source: '',
        heroMeta: [],
        status: 'draft',
        featuredImageUrl: '',
        featuredImageAlt: '',
        featuredImageRatio: '3:4',
        featuredImagePrompt: null,
        metaCharacters: '',
        metaTheme: '',
        metaSource: '',
        metaVerification: null,
        blocks: [{ type: 'leadParagraph' as const, content: [{ text: '', marks: [] }] }],
        moral: null,
        teaserSlug: null,
        teaserContent: null,
        readingTimeMinutes: null,
      };

  const methods = useForm<StoryFormValues>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = methods;

  // Unsaved-changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Auto-generate slug from title (only on create)
  const title = useWatch({ control, name: 'title' });
  const slugTouched = useRef(false);
  useEffect(() => {
    if (!story && !slugTouched.current && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug);
    }
  }, [title, story, setValue]);

  // Init image slots for existing story
  useEffect(() => {
    if (story?.featuredImage.url) {
      imageSlots.setExistingUrl('featured', story.featuredImage.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.featuredImage.url]);

  const handleFormSubmit = async (values: StoryFormValues) => {
    const req = storyFormToRequest(values);
    const fd = new FormData();
    fd.append('story', JSON.stringify(req));
    imageSlots.appendToFormData(fd);
    await onSubmit(fd);
  };

  const heroMeta = useWatch({ control, name: 'heroMeta' }) ?? [];
  const statusValue = useWatch({ control, name: 'status' });
  const featuredImageUrl = useWatch({ control, name: 'featuredImageUrl' });
  const featuredImageRatio = useWatch({ control, name: 'featuredImageRatio' });
  const currentMoral = useWatch({ control, name: 'moral' });
  const currentTeaserSlug = useWatch({ control, name: 'teaserSlug' });

  const hasMoral = currentMoral !== null && currentMoral !== undefined;
  const hasTeaser = currentTeaserSlug !== null && currentTeaserSlug !== undefined;
  const featuredPreview = imageSlots.getPreview('featured') || featuredImageUrl;

  // Live preview — watch all form values, debounced to avoid iframe reload on every keystroke
  const allValues = useWatch({ control });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedValues, setDebouncedValues] = useState(allValues);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedValues(allValues), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [allValues]);
  const liveStory = useMemo(
    () => formValuesToStory(
      debouncedValues as Parameters<typeof formValuesToStory>[0],
      (ref) => imageSlots.getPreview(ref) ?? undefined,
    ),
    [debouncedValues, imageSlots],
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || heroMeta.length >= 4 || heroMeta.includes(trimmed)) return;
    setValue('heroMeta', [...heroMeta, trimmed]);
  };
  const removeTag = (tag: string) =>
    setValue('heroMeta', heroMeta.filter((t: string) => t !== tag));

  const isPublished = statusValue === 'published';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Tabs defaultValue="content" className="w-full">
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-5">
            <TabsList className="bg-stone-100 p-1 h-10">
              <TabsTrigger
                value="content"
                className="gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BookOpen size={14} aria-hidden="true" />
                Content
              </TabsTrigger>
              <TabsTrigger
                value="metadata"
                className="gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Database size={14} aria-hidden="true" />
                Metadata
              </TabsTrigger>
              <TabsTrigger
                value="extras"
                className="gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Sparkles size={14} aria-hidden="true" />
                Moral &amp; Teaser
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Eye size={14} aria-hidden="true" />
                Preview
                <span className="ml-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">Live</span>
              </TabsTrigger>
            </TabsList>

            {/* Status badge + save */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Select
                  value={statusValue}
                  onValueChange={(v) =>
                    setValue('status', v as 'draft' | 'published')
                  }
                >
                  <SelectTrigger className="h-9 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-400 flex-shrink-0" />
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        Published
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className={`gap-2 h-9 px-5 font-medium ${isPublished ? 'bg-green-700 hover:bg-green-800' : ''}`}
              >
                {(isLoading || isSubmitting) ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : isPublished ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : null}
                {story ? 'Save changes' : 'Create story'}
              </Button>
            </div>
          </div>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-6 mt-0">
            {/* Title & Slug card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Identity
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="The Monkey and the Crocodile"
                    className="h-10 text-base font-medium"
                  />
                  {errors.title && (
                    <p className="flex items-center gap-1 text-xs text-rose-500">
                      <AlertCircle size={11} aria-hidden="true" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subtitle" className="text-sm font-medium">
                    Subtitle
                  </Label>
                  <Input
                    id="subtitle"
                    {...register('subtitle')}
                    placeholder="A tale of wit and friendship..."
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="slug" className="text-sm font-medium flex items-center gap-1">
                      <Hash size={12} aria-hidden="true" />
                      Slug <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="slug"
                      {...register('slug')}
                      placeholder="the-monkey-and-the-crocodile"
                      className="h-9 font-mono text-sm text-stone-600"
                      onChange={(e) => {
                        slugTouched.current = true;
                        setValue('slug', e.target.value);
                      }}
                    />
                    {errors.slug && (
                      <p className="flex items-center gap-1 text-xs text-rose-500">
                        <AlertCircle size={11} aria-hidden="true" />
                        {errors.slug.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="source" className="text-sm font-medium">
                      Source <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="source"
                      {...register('source')}
                      placeholder="Panchatantra"
                      className="h-9 text-sm"
                    />
                    {errors.source && (
                      <p className="flex items-center gap-1 text-xs text-rose-500">
                        <AlertCircle size={11} aria-hidden="true" />
                        {errors.source.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero tags card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Hero Tags
                </h3>
                <span className="text-xs text-stone-400">{heroMeta.length}/4</span>
              </div>

              {heroMeta.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {heroMeta.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100 pl-2.5 pr-1.5 py-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="rounded-full hover:bg-amber-200 p-0.5 transition-colors"
                      >
                        <X size={10} aria-hidden="true" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {heroMeta.length < 4 && (
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                        setTagInput('');
                      }
                    }}
                    placeholder="Type a tag and press Enter..."
                    className="h-9 text-sm max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      addTag(tagInput);
                      setTagInput('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
              {errors.heroMeta && (
                <p className="flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle size={11} aria-hidden="true" />
                  {String(errors.heroMeta.message)}
                </p>
              )}
            </div>

            {/* Featured image card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Featured Image
              </h3>

              <div className="flex gap-4 items-start">
                {/* Preview */}
                <div
                  className="flex-shrink-0 rounded-lg overflow-hidden border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center"
                  style={{
                    width: featuredImageRatio === '16:9' ? 160 : featuredImageRatio === '1:1' ? 96 : 80,
                    height: featuredImageRatio === '16:9' ? 90 : featuredImageRatio === '1:1' ? 96 : 107,
                  }}
                >
                  {featuredPreview ? (
                    <img
                      src={featuredPreview}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload size={20} className="text-stone-300" aria-hidden="true" />
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">
                      Upload image <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="text-xs text-stone-500 file:mr-2 file:h-8 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:text-xs file:font-medium file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
                        if (!ALLOWED.includes(file.type)) { toast.error('Only JPEG, PNG or WebP images allowed'); e.target.value = ''; return; }
                        if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); e.target.value = ''; return; }
                        imageSlots.addFile('featured', file);
                        setValue('featuredImageUrl', '@file:featured');
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-stone-600">
                      Alt text <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      {...register('featuredImageAlt')}
                      placeholder="Describe the image for accessibility..."
                      className="h-8 text-sm"
                    />
                    {errors.featuredImageAlt && (
                      <p className="flex items-center gap-1 text-xs text-rose-500">
                        <AlertCircle size={11} aria-hidden="true" />
                        {errors.featuredImageAlt.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-stone-600">Aspect ratio</Label>
                    <Select
                      value={featuredImageRatio}
                      onValueChange={(v) =>
                        setValue('featuredImageRatio', v as '1:1' | '3:4' | '16:9')
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3:4">3:4 Portrait</SelectItem>
                        <SelectItem value="16:9">16:9 Landscape</SelectItem>
                        <SelectItem value="1:1">1:1 Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {errors.featuredImageUrl && (
                <p className="flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle size={11} aria-hidden="true" />
                  {errors.featuredImageUrl.message}
                </p>
              )}
            </div>

            {/* Blocks card */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Story Blocks
              </h3>
              <BlockEditor imageSlots={imageSlots} />
              {errors.blocks && (
                <p className="flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle size={11} aria-hidden="true" />
                  {String(errors.blocks.message)}
                </p>
              )}
            </div>
          </TabsContent>

          {/* METADATA TAB */}
          <TabsContent value="metadata" className="space-y-4 mt-0">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Story Metadata
              </h3>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Characters <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('metaCharacters')}
                  placeholder="Monkey, Crocodile, Crocodile's Wife"
                  className="h-9 text-sm"
                />
                {errors.metaCharacters && (
                  <p className="flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle size={11} aria-hidden="true" />
                    {errors.metaCharacters.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Theme <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('metaTheme')}
                  placeholder="Friendship and quick thinking"
                  className="h-9 text-sm"
                />
                {errors.metaTheme && (
                  <p className="flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle size={11} aria-hidden="true" />
                    {errors.metaTheme.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Source (detailed) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('metaSource')}
                  placeholder="Panchatantra — Book 4, Chapter 2"
                  className="h-9 text-sm"
                />
                {errors.metaSource && (
                  <p className="flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle size={11} aria-hidden="true" />
                    {errors.metaSource.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Verification notes</Label>
                <Textarea
                  {...register('metaVerification')}
                  placeholder="Cross-references, scholarly sources, notes on authenticity..."
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          </TabsContent>

          {/* LIVE PREVIEW TAB */}
          <TabsContent value="preview" className="mt-0">
            <div className="rounded-xl border border-stone-200 overflow-hidden shadow-sm" style={{ minHeight: 600 }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border-b border-stone-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-stone-500 font-medium">Live preview — reflects unsaved changes</span>
              </div>
              <div className="bg-white" style={{ maxWidth: 390, margin: '0 auto' }}>
                <StoryPreview story={liveStory} />
              </div>
            </div>
          </TabsContent>

          {/* MORAL & TEASER TAB */}
          <TabsContent value="extras" className="space-y-4 mt-0">
            {/* Moral */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Moral</h3>
                  <p className="text-xs text-stone-500 mt-0.5">The lesson or takeaway from this story</p>
                </div>
                <Switch
                  checked={hasMoral}
                  onCheckedChange={(checked) =>
                    setValue('moral', checked ? [] : null)
                  }
                  aria-label="Toggle moral section"
                />
              </div>
              {hasMoral && (
                <div className="pt-1">
                  <InlineEditor name="moral" label="Moral content" />
                </div>
              )}
            </div>

            {/* Teaser */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Teaser</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Tease the next story for readers</p>
                </div>
                <Switch
                  checked={!!hasTeaser}
                  onCheckedChange={(checked) => {
                    setValue('teaserSlug', checked ? '' : null);
                    setValue('teaserContent', checked ? [] : null);
                  }}
                  aria-label="Toggle teaser section"
                />
              </div>
              {hasTeaser && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Next story slug</Label>
                    <Input
                      {...register('teaserSlug')}
                      placeholder="next-story-slug"
                      className="h-9 font-mono text-sm text-stone-600"
                    />
                  </div>
                  <InlineEditor name="teaserContent" label="Teaser content" />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom save bar for smaller screens */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDirty ? (
              <span className="text-xs text-amber-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : story ? (
              <span className="text-xs text-stone-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                All saved
              </span>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className={`gap-2 h-9 px-6 font-medium ${isPublished ? 'bg-green-700 hover:bg-green-800' : ''}`}
          >
            {(isLoading || isSubmitting) ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : null}
            {story ? 'Save changes' : 'Create story'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
