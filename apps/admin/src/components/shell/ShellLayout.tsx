'use client';

import React, { useState, type ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
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
      <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Column */}
        <div className="flex flex-1 flex-col min-w-0">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8" role="main">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
