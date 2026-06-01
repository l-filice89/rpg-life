import { Skeleton } from '@rpg-life/ui';

export function QuestBoardSkeleton() {
  return (
    <div className="py-6" aria-busy="true" aria-label="Loading quests">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3.5 rounded-md border border-border px-5 py-4">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
