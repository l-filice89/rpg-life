export function QuestBoardEmptyFirst() {
  return (
    <section
      aria-labelledby="quest-board-empty-heading"
      className="mx-auto max-w-md py-16 text-center"
    >
      <h2 id="quest-board-empty-heading" className="text-display-sm text-foreground">
        No quests yet
      </h2>
      <p className="mt-3 text-muted-foreground">Start a quest to chart your path.</p>
      <p className="mt-6 text-sm text-muted-foreground">Tap + to create your first quest</p>
    </section>
  );
}
