import type { ProfileSummary, TaskListItem } from '@rpg-life/api';
import { QuestBoardFab } from './QuestBoardFab';
import { QuestBoardHeader } from './QuestBoardHeader';
import { QuestBoardTaskList } from './QuestBoardTaskList';

type QuestBoardProps = {
  tasks: TaskListItem[];
  profile: ProfileSummary;
};

export function QuestBoard({ tasks, profile }: QuestBoardProps) {
  return (
    <div className="py-6">
      <QuestBoardHeader profile={profile} />
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">Your quests will appear here.</p>
      ) : (
        <QuestBoardTaskList tasks={tasks} />
      )}
      <QuestBoardFab />
    </div>
  );
}
