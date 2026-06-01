import type { ProfileSummary, TaskListItem } from '@rpg-life/api';
import { QuestBoardHeader } from './QuestBoardHeader';
import { QuestRow } from './QuestRow';

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
        <ul role="list" className="flex flex-col gap-5">
          {tasks.map((task) => (
            <li key={task.id}>
              <QuestRow task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
