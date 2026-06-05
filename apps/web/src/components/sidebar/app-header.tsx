'use client';

import { usePathname } from 'next/navigation';
import type { RefObject } from 'react';
import { getPageTitle } from '@/lib/page-title';

type AppHeaderProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement | null>;
};

export function AppHeader({ sidebarOpen, onToggleSidebar, menuButtonRef }: AppHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="border-b border-border bg-gradient-to-b from-card to-background px-5 py-5">
      <div className="flex w-full items-center gap-4">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          {...(sidebarOpen ? { 'aria-controls': 'main-navigation' } : {})}
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex size-11 min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-[5px] rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="block h-0.5 w-4 rounded-sm bg-muted-foreground" />
          <span className="block h-0.5 w-4 rounded-sm bg-muted-foreground" />
          <span className="block h-0.5 w-4 rounded-sm bg-muted-foreground" />
        </button>
        <h1 className="flex-1 text-lg font-medium tracking-wide">{title}</h1>
      </div>
    </header>
  );
}
