import type { TaskListItem } from '@rpg-life/api';
import { Badge, SkillChip } from '@rpg-life/ui';
import { cn } from '@rpg-life/ui/lib/utils';
import { getDifficultyLabel } from '@/lib/difficulty-label';
import { formatDueDate, isOverdue } from '@/lib/format-due-date';
import { QuestRowActions } from './QuestRowActions';

type QuestRowProps = {
  task: TaskListItem;
};

export function QuestRow({ task }: QuestRowProps) {
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const dueLabel = task.dueDate
    ? overdue
      ? formatDueDate(task.dueDate)
      : `Due ${formatDueDate(task.dueDate)}`
    : null;

  return (
    <article
      className={cn(
        'flex items-start gap-3.5 rounded-md border bg-card px-5 py-4',
        overdue && 'border-overdue-border',
      )}
    >
      <QuestRowActions taskTitle={task.title} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug text-foreground">{task.title}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[11px] font-medium">
            {getDifficultyLabel(task.difficulty)}
          </Badge>
          {task.skillCodes.map((skillCode) => (
            <SkillChip key={skillCode} skillCode={skillCode} />
          ))}
          {dueLabel ? (
            <span className="text-[11px] text-muted-foreground">{dueLabel}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
