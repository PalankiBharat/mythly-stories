import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { adminApi } from './api-client';
import { useAuth } from './auth-context';

export function useStories(params: Record<string, string | number> = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['stories', params],
    queryFn: () => adminApi(token!).listStories(params),
    enabled: !!token,
  });
}

export function useStory(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => adminApi(token!).getStory(id),
    enabled: !!token && !!id,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (formData: FormData) => adminApi(token!).createStory(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      adminApi(token!).updateStory(id, formData),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['story', id] });
    },
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (id: string) => adminApi(token!).deleteStory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}
