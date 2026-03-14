'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InlineEditor } from './inline-editor';
import {
  GripVertical,
  Trash2,
  Plus,
  AlignLeft,
  MessageSquare,
  Image,
  Minus,
  MoveVertical,
  Anchor,
  ChevronUp,
  ChevronDown,
  Lock,
} from 'lucide-react';
import type { Block } from '@/lib/types';
import type { ImageSlots } from '@/lib/use-image-slots';
import { toast } from 'sonner';

const BLOCK_CONFIG = {
  leadParagraph: {
    label: 'Opening',
    icon: Anchor,
    accent: 'border-amber-300 bg-amber-50',
    badge: 'bg-amber-200 text-amber-800',
    dot: 'bg-amber-400',
    description: 'Required opening paragraph',
  },
  paragraph: {
    label: 'Paragraph',
    icon: AlignLeft,
    accent: 'border-stone-200 bg-white',
    badge: 'bg-stone-100 text-stone-600',
    dot: 'bg-stone-400',
    description: 'Body text paragraph',
  },
  dialogue: {
    label: 'Dialogue',
    icon: MessageSquare,
    accent: 'border-violet-200 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-400',
    description: 'Character speech',
  },
  sceneImage: {
    label: 'Image',
    icon: Image,
    accent: 'border-teal-200 bg-teal-50',
    badge: 'bg-teal-100 text-teal-700',
    dot: 'bg-teal-400',
    description: 'Scene illustration',
  },
  divider: {
    label: 'Divider',
    icon: Minus,
    accent: 'border-stone-200 bg-stone-50',
    badge: 'bg-stone-100 text-stone-500',
    dot: 'bg-stone-300',
    description: 'Decorative separator',
  },
  spacer: {
    label: 'Spacer',
    icon: MoveVertical,
    accent: 'border-stone-200 bg-stone-50',
    badge: 'bg-stone-100 text-stone-500',
    dot: 'bg-stone-300',
    description: 'Vertical whitespace',
  },
} as const;

interface SortableBlockProps {
  id: string;
  type: Block['type'];
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}

function SortableBlock({ id, type, onRemove, onMoveUp, onMoveDown, isFirst, isLast, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = BLOCK_CONFIG[type] ?? BLOCK_CONFIG.paragraph;
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-0 items-stretch rounded-xl border-2 transition-all ${config.accent} ${isDragging ? 'opacity-50 shadow-lg scale-[1.01]' : 'shadow-sm'}`}
    >
      {/* Left: drag handle + move buttons */}
      <div className="flex flex-col items-center gap-0 py-2 px-1.5 rounded-l-[10px] border-r border-black/5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Move block up"
          disabled={isFirst}
          className="h-6 w-6 text-stone-400 hover:text-stone-700 disabled:opacity-25"
          onClick={onMoveUp}
        >
          <ChevronUp size={13} aria-hidden="true" />
        </Button>

        <button
          type="button"
          aria-label="Drag to reorder block"
          title="Drag to reorder"
          className="flex items-center justify-center w-6 h-6 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing hover:bg-black/5 rounded transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} aria-hidden="true" />
        </button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Move block down"
          disabled={isLast}
          className="h-6 w-6 text-stone-400 hover:text-stone-700 disabled:opacity-25"
          onClick={onMoveDown}
        >
          <ChevronDown size={13} aria-hidden="true" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 py-4 pr-4 pl-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${config.badge}`}>
              <Icon size={11} aria-hidden="true" />
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
              {config.label}
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">{config.description}</span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove block"
            className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
            onClick={onRemove}
          >
            <Trash2 size={12} aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface BlockEditorProps {
  imageSlots: ImageSlots;
}

export function BlockEditor({ imageSlots }: BlockEditorProps) {
  const { register, control, watch, setValue } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'blocks',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx === 0 || newIdx === 0) return;
    move(oldIdx, newIdx);
  };

  const addBlock = (type: Exclude<Block['type'], 'leadParagraph'>) => {
    const defaults: Record<string, Record<string, unknown>> = {
      paragraph: { type: 'paragraph', content: [] },
      dialogue: { type: 'dialogue', speaker: '', content: [] },
      sceneImage: {
        type: 'sceneImage',
        url: '',
        alt: '',
        caption: '',
        aspectRatio: '16:9',
      },
      divider: { type: 'divider' },
      spacer: { type: 'spacer', size: 'md' },
    };
    append(defaults[type]);
  };

  const leadField = fields[0];
  const otherFields = fields.slice(1);

  const renderBlockContent = (index: number) => {
    const blockType = watch(`blocks.${index}.type`);

    if (blockType === 'leadParagraph' || blockType === 'paragraph') {
      return <InlineEditor name={`blocks.${index}.content`} label="Content" />;
    }
    if (blockType === 'dialogue') {
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-stone-600 mb-1 block">Speaker name</Label>
            <Input
              {...register(`blocks.${index}.speaker`)}
              placeholder="Character name..."
              className="bg-white h-10 text-sm"
            />
          </div>
          <InlineEditor
            name={`blocks.${index}.content`}
            label="Dialogue content"
          />
        </div>
      );
    }
    if (blockType === 'sceneImage') {
      const ref = `scene-${index}`;
      const preview =
        imageSlots.getPreview(ref) || watch(`blocks.${index}.url`);
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-stone-600 mb-1.5 block">Image</Label>
            {preview ? (
              <div className="relative mb-2">
                <img
                  src={preview}
                  alt="preview"
                  className="h-36 w-full object-cover rounded-lg border border-teal-200"
                />
              </div>
            ) : (
              <div className="h-24 mb-2 rounded-lg border-2 border-dashed border-teal-200 bg-white flex items-center justify-center">
                <span className="text-xs text-stone-400">No image yet</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-xs text-stone-500 file:mr-2 file:h-7 file:rounded file:border-0 file:bg-teal-100 file:px-2.5 file:text-xs file:font-medium file:text-teal-700 hover:file:bg-teal-200"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
                if (!ALLOWED.includes(file.type)) { toast.error('Only JPEG, PNG or WebP allowed'); e.target.value = ''; return; }
                if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); e.target.value = ''; return; }
                imageSlots.addFile(ref, file);
                setValue(`blocks.${index}.url`, `@file:${ref}`);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold text-stone-600 mb-1 block">Alt text</Label>
              <Input
                {...register(`blocks.${index}.alt`)}
                placeholder="Describe the image..."
                className="bg-white h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-stone-600 mb-1 block">Aspect ratio</Label>
              <Select
                value={watch(`blocks.${index}.aspectRatio`) ?? '16:9'}
                onValueChange={(v) =>
                  setValue(`blocks.${index}.aspectRatio`, v)
                }
              >
                <SelectTrigger className="h-8 bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 Landscape</SelectItem>
                  <SelectItem value="3:4">3:4 Portrait</SelectItem>
                  <SelectItem value="1:1">1:1 Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-stone-600 mb-1 block">Caption</Label>
            <Input
              {...register(`blocks.${index}.caption`)}
              placeholder="Optional caption text..."
              className="bg-white h-10 text-sm"
            />
          </div>
        </div>
      );
    }
    if (blockType === 'spacer') {
      return (
        <div>
          <Label className="text-xs font-semibold text-stone-600 mb-1 block">Spacer size</Label>
          <Select
            value={watch(`blocks.${index}.size`) ?? 'md'}
            onValueChange={(v) => setValue(`blocks.${index}.size`, v)}
          >
            <SelectTrigger className="w-36 h-8 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small (1rem)</SelectItem>
              <SelectItem value="md">Medium (2rem)</SelectItem>
              <SelectItem value="lg">Large (3rem)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    if (blockType === 'divider') {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 border-t border-stone-300" />
          <span className="text-stone-400 text-xs">✦ ✦ ✦</span>
          <div className="flex-1 border-t border-stone-300" />
        </div>
      );
    }
    return null;
  };

  const ADD_BLOCK_TYPES = [
    { type: 'paragraph', config: BLOCK_CONFIG.paragraph },
    { type: 'dialogue', config: BLOCK_CONFIG.dialogue },
    { type: 'sceneImage', config: BLOCK_CONFIG.sceneImage },
    { type: 'divider', config: BLOCK_CONFIG.divider },
    { type: 'spacer', config: BLOCK_CONFIG.spacer },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Lead Paragraph — fixed, cannot move or delete */}
      {leadField && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/70 border-b border-amber-200">
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-amber-200">
              <Anchor size={11} className="text-amber-700" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-amber-800">Opening Paragraph</span>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
            <Lock size={9} aria-hidden="true" /> Required
          </div>
          </div>
          <div className="p-4">
            <InlineEditor name="blocks.0.content" label="Opening paragraph" />
          </div>
        </div>
      )}

      {/* Other blocks — sortable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={otherFields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {otherFields.map((field, relativeIdx) => {
              const absoluteIdx = relativeIdx + 1;
              return (
                <SortableBlock
                  key={field.id}
                  id={field.id}
                  type={watch(`blocks.${absoluteIdx}.type`)}
                  onRemove={() => remove(absoluteIdx)}
                  onMoveUp={() => move(absoluteIdx, absoluteIdx - 1)}
                  onMoveDown={() => move(absoluteIdx, absoluteIdx + 1)}
                  isFirst={relativeIdx === 0}
                  isLast={relativeIdx === otherFields.length - 1}
                >
                  {renderBlockContent(absoluteIdx)}
                </SortableBlock>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block bar */}
      <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
          Add block
        </p>
        <div className="flex flex-wrap gap-2">
          {ADD_BLOCK_TYPES.map(({ type, config }) => {
            const Icon = config.icon;
            return (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                className={`gap-1.5 h-8 text-xs font-medium border bg-white hover:shadow-sm transition-all ${config.badge} border-current`}
                onClick={() => addBlock(type)}
              >
                <Plus size={10} aria-hidden="true" />
                <Icon size={11} aria-hidden="true" />
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
