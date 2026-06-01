'use client';

import { useState } from 'react';
import type { TaskListItem } from '@rpg-life/api';
import { cn } from '@rpg-life/ui/lib/utils';
import { isOverdue } from '@/lib/format-due-date';
import { QuestRowActions } from './QuestRowActions';
import { QuestRowEditTrigger } from './QuestRowEditTrigger';

type QuestRowProps = {
  task: TaskListItem;
};

export function QuestRow({ task }: QuestRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <article
      className={cn(
        'flex items-start gap-3.5 rounded-md border bg-card px-5 py-4',
        overdue && 'border-overdue-border',
        isCompleting && 'pointer-events-none opacity-60',
      )}
      aria-busy={isCompleting}
    >
      <QuestRowActions
        taskId={task.id}
        taskTitle={task.title}
        onCompletingChange={setIsCompleting}
      />
      <QuestRowEditTrigger task={task} disabled={isCompleting} />
    </article>
  );
}
