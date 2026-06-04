'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProfileSummary, TaskListItem } from '@rpg-life/api';
import {
  resolveQuestBoardEmptyVariant,
  type QuestBoardEmptyVariant,
} from '@/lib/quest-board-empty-variant';
import { QuestBoardCompleteProvider } from './quest-board-complete-context';
import { QuestBoardEmptyClear } from './QuestBoardEmptyClear';
import { QuestBoardEmptyFirst } from './QuestBoardEmptyFirst';
import { QuestBoardTaskList } from './QuestBoardTaskList';

type QuestBoardContentProps = {
  tasks: TaskListItem[];
  profile: ProfileSummary;
  serverEmptyVariant: QuestBoardEmptyVariant | null;
};

export function QuestBoardContent({
  tasks,
  profile,
  serverEmptyVariant,
}: QuestBoardContentProps) {
  const [showBoardClear, setShowBoardClear] = useState(serverEmptyVariant === 'clear');

  useEffect(() => {
    if (tasks.length > 0) {
      setShowBoardClear(false);
      return;
    }
    if (serverEmptyVariant === 'clear') {
      setShowBoardClear(true);
    }
  }, [tasks.length, serverEmptyVariant]);

  const requestBoardClear = useCallback(() => {
    setShowBoardClear(true);
  }, []);

  const effectiveOpenCount = showBoardClear ? 0 : tasks.length;
  const emptyVariant = resolveQuestBoardEmptyVariant(
    effectiveOpenCount,
    profile,
    showBoardClear,
  );

  return (
    <QuestBoardCompleteProvider requestBoardClear={requestBoardClear}>
      {emptyVariant === 'clear' ? (
        <QuestBoardEmptyClear />
      ) : emptyVariant === 'first' ? (
        <QuestBoardEmptyFirst />
      ) : (
        <QuestBoardTaskList tasks={tasks} />
      )}
    </QuestBoardCompleteProvider>
  );
}
