'use client';

import { Checkbox } from '@rpg-life/ui';

type QuestRowActionsProps = {
  taskTitle: string;
};

export function QuestRowActions({ taskTitle }: QuestRowActionsProps) {
  return (
    <div className="flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center">
      <Checkbox
        disabled
        aria-label={`Complete quest: ${taskTitle} (coming soon)`}
        className="pointer-events-none size-6 rounded-full"
      />
    </div>
  );
}
