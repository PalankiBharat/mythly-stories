'use client';

import { use, useState } from 'react';
import { useStory } from '@/lib/use-stories';
import { ArrowLeft, Loader2, Smartphone, Tablet, Monitor, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StoryPreview } from '@/components/preview/story-preview';
import { Badge } from '@/components/ui/badge';

type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const DEVICE_CONFIG: Record<DeviceSize, { width: string; icon: React.ElementType; label: string }> = {
  mobile: { width: '390px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' },
};

export default function PreviewPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const { data: story, isLoading } = useStory(storyId);
  const [device, setDevice] = useState<DeviceSize>('mobile');

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-200 bg-white shadow-sm flex-shrink-0">
        <Link href={`/stories/${storyId}/edit`}>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-stone-600 hover:text-stone-900">
            <ArrowLeft size={14} aria-hidden="true" />
            Editor
          </Button>
        </Link>

        <div className="w-px h-5 bg-stone-200" />

        {story && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-stone-800 truncate max-w-64">
              {story.title}
            </span>
            <Badge
              variant={story.status === 'published' ? 'default' : 'secondary'}
              className={`text-[10px] py-0 h-5 flex-shrink-0 ${
                story.status === 'published'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {story.status}
            </Badge>
          </div>
        )}

        {/* Device switcher */}
        <div className="ml-auto flex items-center gap-1 bg-stone-100 rounded-lg p-1">
          {(Object.entries(DEVICE_CONFIG) as [DeviceSize, typeof DEVICE_CONFIG[DeviceSize]][]).map(
            ([size, conf]) => {
              const Icon = conf.icon;
              return (
                <Button
                  key={size}
                  variant="ghost"
                  size="sm"
                  aria-label={`Preview as ${conf.label}`}
                  aria-pressed={device === size}
                  className={`h-7 px-2.5 gap-1.5 text-xs transition-all ${
                    device === size
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                  onClick={() => setDevice(size)}
                >
                  <Icon size={13} aria-hidden="true" />
                  {conf.label}
                </Button>
              );
            },
          )}
        </div>

        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium flex-shrink-0">
          Saved version
        </span>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <Loader2 className="animate-spin text-amber-500 mx-auto" size={28} />
              <p className="text-sm text-stone-500">Loading preview...</p>
            </div>
          </div>
        ) : story ? (
          <div
            className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 h-full min-h-[600px]"
            style={{ width: DEVICE_CONFIG[device].width, maxWidth: '100%' }}
          >
            {/* Device chrome bar */}
            {device !== 'desktop' && (
              <div className="h-8 bg-stone-800 flex items-center justify-center gap-1 flex-shrink-0">
                <div className="w-16 h-1 rounded-full bg-stone-600" />
              </div>
            )}
            <div className="h-full overflow-auto">
              <StoryPreview story={story} />
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-stone-500 text-sm">Story not found.</p>
            <Link href="/stories" className="mt-3 inline-block">
              <Button variant="outline" size="sm" className="gap-2 mt-3">
                <ExternalLink size={14} />
                Back to stories
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
