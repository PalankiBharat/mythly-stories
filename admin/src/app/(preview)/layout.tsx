'use client';

import { useAuth } from '@/lib/auth-context';

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
