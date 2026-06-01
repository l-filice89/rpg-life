import { Skeleton } from '@rpg-life/ui';

export function QuestBoardSkeleton() {
  return (
    <div className="py-6" aria-busy="true" aria-label="Loading quests">
      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
