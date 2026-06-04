'use client';

import { Button } from '@rpg-life/ui';
import { useCreateQuestSheet } from './create-quest-sheet-context';

type AddQuestButtonProps = {
  className?: string;
};

export function AddQuestButton({ className }: AddQuestButtonProps) {
  const { openCreateQuestSheet } = useCreateQuestSheet();

  return (
    <Button type="button" className={className} onClick={openCreateQuestSheet}>
      Add a quest
    </Button>
  );
}
