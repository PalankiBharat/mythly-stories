'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut } from 'lucide-react';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout } = useAuth();

  // Token is read synchronously in auth-context, so this check is stable
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-stone-50" suppressHydrationWarning>
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <h1 className="font-semibold text-stone-900">Mythly Admin</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/stories">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <BookOpen size={16} /> Stories
            </Button>
          </Link>
        </nav>
        <div className="p-3 border-t border-stone-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-stone-500"
            onClick={logout}
          >
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
