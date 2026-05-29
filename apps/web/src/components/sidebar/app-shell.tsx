'use client';

import { useState, type ReactNode } from 'react';
import { AppHeader } from './app-header';
import { SidebarOverlay } from './sidebar-overlay';

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <SidebarOverlay open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 md:max-w-lg lg:max-w-2xl">{children}</main>
    </div>
  );
}
