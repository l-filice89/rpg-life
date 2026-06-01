import type { TaskListItem } from '@rpg-life/api';

type QuestBoardListItemProps = {
  task: TaskListItem;
};

function formatDueDate(dueDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) {
    return dueDate;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    return dueDate;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function QuestBoardListItem({ task }: QuestBoardListItemProps) {
  return (
    <article className="rounded-md border border-border bg-card px-5 py-4">
      <h2 className="text-base font-medium text-foreground">{task.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {task.dueDate ? `Due ${formatDueDate(task.dueDate)}` : 'No due date'}
      </p>
    </article>
  );
}
