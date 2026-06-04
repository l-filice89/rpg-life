import type { ProfileSummary, TaskListItem } from '@rpg-life/api';
import { resolveServerEmptyVariant } from '@/lib/quest-board-empty-variant';
import { CreateQuestSheetProvider } from './create-quest-sheet-context';
import { QuestBoardContent } from './QuestBoardContent';
import { QuestBoardFab } from './QuestBoardFab';
import { QuestBoardHeader } from './QuestBoardHeader';

type QuestBoardProps = {
  tasks: TaskListItem[];
  profile: ProfileSummary;
};

export function QuestBoard({ tasks, profile }: QuestBoardProps) {
  const serverEmptyVariant = resolveServerEmptyVariant(tasks.length, profile);

  return (
    <CreateQuestSheetProvider>
      <div className="py-6">
        <QuestBoardHeader profile={profile} />
        <QuestBoardContent
          tasks={tasks}
          profile={profile}
          serverEmptyVariant={serverEmptyVariant}
        />
        <QuestBoardFab />
      </div>
    </CreateQuestSheetProvider>
  );
}
