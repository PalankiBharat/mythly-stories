import type { PaginatedResult, StorySummary, Story } from './types';
import { clearToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      // ignore parse errors
    }
    const err = body?.error as Record<string, unknown> | undefined;
    const code = (err?.code as string) ?? 'INTERNAL_ERROR';
    // Expired/invalid token — clear and redirect to login
    if (code === 'UNAUTHORIZED' && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    throw new ApiError(
      code,
      (err?.message as string) ?? 'An error occurred',
      err?.details as string[] | undefined,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function loginRequest(username: string, password: string) {
  return request<{ token: string; expiresIn: number }>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function adminApi(token: string) {
  const headers = { Authorization: `Bearer ${token}` };

  return {
    listStories: (params: Record<string, string | number> = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
      return request<PaginatedResult<StorySummary>>(
        `/api/v1/admin/stories${qs ? `?${qs}` : ''}`,
        { headers },
      );
    },
    getStory: (id: string) =>
      request<Story>(`/api/v1/admin/stories/${id}`, { headers }),
    createStory: (formData: FormData) =>
      request<Story>('/api/v1/admin/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }),
    updateStory: (id: string, formData: FormData) =>
      request<Story>(`/api/v1/admin/stories/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }),
    deleteStory: (id: string) =>
      request<void>(`/api/v1/admin/stories/${id}`, {
        method: 'DELETE',
        headers,
      }),
  };
}
