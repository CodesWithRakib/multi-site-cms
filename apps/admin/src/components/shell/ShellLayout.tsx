'use client';

import React, { useState, type ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { AdminTabBar } from './AdminTabBar';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface ShellLayoutProps {
  children: ReactNode;
  requiredPermission?: string;
  superAdminOnly?: boolean;
}

export function ShellLayout({
  children,
  requiredPermission,
  superAdminOnly = false,
}: ShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard requiredPermission={requiredPermission} superAdminOnly={superAdminOnly}>
      <div className="flex h-screen h-dvh w-full overflow-hidden bg-neutral-100 dark:bg-brand-950 font-sans antialiased text-slate-900 dark:text-slate-100 relative selection:bg-emerald-400 selection:text-emerald-950">
        {/* Soft abstract cyan/emerald ambient gradient glow in top-right corner */}
        <div
          className="pointer-events-none absolute -top-40 right-0 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-teal-200/50 via-emerald-100/30 to-transparent blur-3xl -z-10 dark:opacity-20"
          aria-hidden="true"
        />

        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Column */}
        <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-10"
            role="main"
          >
            {children}
          </main>
        </div>
        <AdminTabBar />
      </div>
    </AuthGuard>
  );
}
