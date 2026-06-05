'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import Header from '@/components/Header';
import FolderTree from '@/components/FolderTree';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-400 animate-pulse-soft">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-sidebar border-r border-slate-700/50 overflow-y-auto shrink-0 transition-all duration-300 hidden md:block`}
        >
          <div className="h-full">
            <FolderTree />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
