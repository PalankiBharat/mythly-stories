'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStories, useDeleteStory } from '@/lib/use-stories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/handle-api-error';
import type { StorySummary } from '@/lib/types';

const PAGE_SIZE = 20;

export default function StoriesPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<StorySummary | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, string | number> = {
    limit: PAGE_SIZE,
    offset,
  };
  if (statusFilter !== 'all') params.status = statusFilter;
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useStories(params);
  const deleteMutation = useDeleteStory();

  const stories = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleDelete = async () => {

    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      handleApiError(err, 'Delete failed');
    }
  };


  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Stories</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} total</p>
        </div>
        <Link href="/stories/new">
          <Button className="gap-2">
            <Plus size={16} /> New Story
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by title or slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); setDebouncedSearch(''); }}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reading time</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="animate-spin mx-auto text-stone-400" />
                </TableCell>
              </TableRow>
            ) : stories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-stone-400"
                >
                  No stories found
                </TableCell>
              </TableRow>
            ) : (
              stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium max-w-48 truncate">
                    {story.title}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-stone-500 max-w-36 truncate">
                    {story.slug}
                  </TableCell>
                  <TableCell className="text-sm text-stone-600">
                    {story.source}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        story.status === 'published' ? 'default' : 'secondary'
                      }
                    >
                      {story.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-stone-500">
                    {story.readingTimeMinutes} min
                  </TableCell>
                  <TableCell className="text-sm text-stone-500">
                    {new Date(story.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${story.title}`}
                        onClick={() =>
                          router.push(`/stories/${story.id}/edit`)
                        }
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Preview ${story.title}`}
                        onClick={() =>
                          router.push(`/stories/${story.id}/preview`)
                        }
                      >
                        <Eye size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${story.title}`}
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(story)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-stone-500">
          <span>
            Showing {offset + 1}--{Math.min(offset + PAGE_SIZE, total)} of{' '}
            {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => o - PAGE_SIZE)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>&quot;{deleteTarget?.title}&quot;</strong> and all its
              images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
