'use client';

import { useRouter } from 'next/navigation';
import { useCreateStory } from '@/lib/use-stories';
import { StoryForm } from '@/components/editor/story-form';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/handle-api-error';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewStoryPage() {
  const router = useRouter();
  const createMutation = useCreateStory();

  const handleSubmit = async (formData: FormData) => {
    try {
      const story = await createMutation.mutateAsync(formData);
      toast.success('Story created!');
      router.push(`/stories/${story.id}/edit`);
    } catch (err) {
      handleApiError(err, 'Failed to create story');
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/stories">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-stone-600">
            <ArrowLeft size={14} aria-hidden="true" /> Stories
          </Button>
        </Link>
        <div className="w-px h-4 bg-stone-200" />
        <h1 className="text-lg font-semibold text-stone-800">New Story</h1>
      </div>
      <StoryForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
