'use client';

import { use } from 'react';
import { useStory } from '@/lib/use-stories';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StoryPreview } from '@/components/preview/story-preview';

export default function PreviewPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const { data: story, isLoading } = useStory(storyId);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-stone-200 bg-white">
        <Link href={`/stories/${storyId}/edit`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={14} /> Back to editor
          </Button>
        </Link>
        <span className="text-sm text-stone-500">
          {story?.title ?? 'Preview'}
        </span>
        <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">
          Preview only -- saved version
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-stone-400" />
          </div>
        ) : story ? (
          <StoryPreview story={story} />
        ) : (
          <p className="p-6 text-stone-500">Story not found.</p>
        )}
      </div>
    </div>
  );
}
