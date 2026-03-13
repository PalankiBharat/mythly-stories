'use client';

import { use } from 'react';
import { useStory, useUpdateStory } from '@/lib/use-stories';
import { StoryForm } from '@/components/editor/story-form';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/handle-api-error';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const { data: story, isLoading } = useStory(storyId);
  const updateMutation = useUpdateStory();

  const handleSubmit = async (formData: FormData) => {
    try {
      await updateMutation.mutateAsync({ id: storyId, formData });
      toast.success('Story saved!');
    } catch (err) {
      handleApiError(err, 'Failed to save story');
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/stories">
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-stone-600">
              <ArrowLeft size={14} aria-hidden="true" /> Stories
            </Button>
          </Link>
          <div className="w-px h-4 bg-stone-200" />
          <h1 className="text-lg font-semibold text-stone-800">
            {isLoading ? (
              <span className="text-stone-400">Loading...</span>
            ) : (
              story?.title ?? 'Edit Story'
            )}
          </h1>
        </div>
        {story && (
          <Link href={`/stories/${storyId}/preview`}>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Eye size={13} aria-hidden="true" /> Preview
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-amber-500 mx-auto" size={28} />
            <p className="text-sm text-stone-500">Loading story...</p>
          </div>
        </div>
      ) : story ? (
        <StoryForm
          story={story}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
        />
      ) : (
        <p className="text-stone-500">Story not found.</p>
      )}
    </div>
  );
}
