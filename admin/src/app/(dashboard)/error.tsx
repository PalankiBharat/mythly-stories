'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
      <p className="text-stone-600 font-medium">Something went wrong</p>
      <p className="text-sm text-red-500 max-w-md text-center">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
