import { toast } from 'sonner';

export function handleApiError(err: unknown, fallback = 'Something went wrong') {
  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as { message: string; details?: string[] };
    const detail = e.details?.join('\n') ?? '';
    toast.error(`${e.message}${detail ? `\n${detail}` : ''}`);
  } else {
    toast.error(fallback);
  }
}
