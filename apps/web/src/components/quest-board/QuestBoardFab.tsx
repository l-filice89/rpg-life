'use client';

import { useState } from 'react';
import { CreateQuestSheet } from '@/components/create-quest-sheet/CreateQuestSheet';
import { FabCreateQuest } from './FabCreateQuest';

export function QuestBoardFab() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <FabCreateQuest onClick={() => setSheetOpen(true)} />
      <CreateQuestSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
