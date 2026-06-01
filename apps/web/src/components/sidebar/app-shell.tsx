'use client';

import { useState, type ReactNode } from 'react';
import { QuestBoardFilterProvider } from '@/components/quest-board/quest-board-filter-context';
import { TutorialSheet } from '@/components/tutorial/tutorial-sheet';
import { AppHeader } from './app-header';
import { SidebarOverlay } from './sidebar-overlay';

type AppShellProps = {
  children: ReactNode;
  initialTutorialSeen: boolean;
};

export function AppShell({ children, initialTutorialSeen }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(!initialTutorialSeen);
  const [tutorialMode, setTutorialMode] = useState<'first-run' | 'replay'>(
    initialTutorialSeen ? 'replay' : 'first-run',
  );

  const handleTutorialClick = () => {
    setTutorialMode('replay');
    setTutorialOpen(true);
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <SidebarOverlay
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onTutorialClick={handleTutorialClick}
      />
      <TutorialSheet
        open={tutorialOpen}
        onOpenChange={setTutorialOpen}
        mode={tutorialMode}
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 md:max-w-lg lg:max-w-2xl">
        <QuestBoardFilterProvider>{children}</QuestBoardFilterProvider>
      </main>
    </div>
  );
}
