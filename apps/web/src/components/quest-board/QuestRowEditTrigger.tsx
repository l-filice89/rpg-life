'use client';

import { useState } from 'react';
import type { TaskListItem } from '@rpg-life/api';
import { Badge, SkillChip } from '@rpg-life/ui';
import { EditQuestSheet } from '@/components/quest-sheet/EditQuestSheet';
import { getDifficultyLabel } from '@/lib/difficulty-label';
import { formatDueDate, isOverdue } from '@/lib/format-due-date';

type QuestRowEditTriggerProps = {
  task: TaskListItem;
  disabled?: boolean;
};

export function QuestRowEditTrigger({ task, disabled = false }: QuestRowEditTriggerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const dueLabel = task.dueDate
    ? overdue
      ? formatDueDate(task.dueDate)
      : `Due ${formatDueDate(task.dueDate)}`
    : null;

  return (
    <>
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        aria-label={`Edit quest: ${task.title}`}
        disabled={disabled}
        onClick={() => setSheetOpen(true)}
      >
        <RowBody
          title={task.title}
          difficulty={task.difficulty}
          skillCodes={task.skillCodes}
          dueLabel={dueLabel}
        />
      </button>
      <EditQuestSheet task={task} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

type RowBodyProps = {
  title: string;
  difficulty: TaskListItem['difficulty'];
  skillCodes: TaskListItem['skillCodes'];
  dueLabel: string | null;
};

function RowBody({ title, difficulty, skillCodes, dueLabel }: RowBodyProps) {
  return (
    <>
      <p className="text-base font-medium leading-snug text-foreground">{title}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[11px] font-medium">
          {getDifficultyLabel(difficulty)}
        </Badge>
        {skillCodes.map((skillCode) => (
          <SkillChip key={skillCode} skillCode={skillCode} />
        ))}
        {dueLabel ? (
          <span className="text-[11px] text-muted-foreground">{dueLabel}</span>
        ) : null}
      </div>
    </>
  );
}

export type { RowBodyProps };
