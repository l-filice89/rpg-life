import type { TaskListItem } from '@rpg-life/api';
import { QuestBoardListItem } from './QuestBoardListItem';

type QuestBoardProps = {
  tasks: TaskListItem[];
};

export function QuestBoard({ tasks }: QuestBoardProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-6">
        <p className="text-muted-foreground">Your quests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <ul role="list" className="flex flex-col gap-5">
        {tasks.map((task) => (
          <li key={task.id}>
            <QuestBoardListItem task={task} />
          </li>
        ))}
      </ul>
    </div>
  );
}
