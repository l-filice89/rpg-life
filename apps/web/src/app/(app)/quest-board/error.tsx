'use client';

import { Button } from '@rpg-life/ui';

type QuestBoardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function QuestBoardError({ reset }: QuestBoardErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-border bg-card px-5 py-4"
    >
      <p className="text-base font-medium text-foreground">Couldn&apos;t load your quests.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button type="button" className="mt-4" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
