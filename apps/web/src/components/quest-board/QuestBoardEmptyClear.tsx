import Link from 'next/link';
import { AddQuestButton } from './AddQuestButton';

export function QuestBoardEmptyClear() {
  return (
    <section
      aria-labelledby="quest-board-clear-heading"
      className="mx-auto max-w-md py-16 text-center"
    >
      <h2 id="quest-board-clear-heading" className="text-display-sm text-foreground">
        Quest board clear
      </h2>
      <p className="mt-3 text-muted-foreground">
        Every quest accounted for. Start another when you&apos;re ready.
      </p>
      <AddQuestButton className="mt-8 min-h-[44px] w-full" />
      <p className="mt-4">
        <Link href="/profile" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          See your growth
        </Link>
      </p>
    </section>
  );
}
