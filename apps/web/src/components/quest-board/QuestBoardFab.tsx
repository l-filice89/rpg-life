'use client';

import { FabCreateQuest } from './FabCreateQuest';
import { useCreateQuestSheet } from './create-quest-sheet-context';

export function QuestBoardFab() {
  const { openCreateQuestSheet } = useCreateQuestSheet();

  return <FabCreateQuest onClick={openCreateQuestSheet} />;
}
