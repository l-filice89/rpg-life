import { Skeleton } from '@rpg-life/ui';

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-8 py-6" aria-busy="true" aria-label="Loading profile">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div>
        <Skeleton className="mb-4 h-4 w-12" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
