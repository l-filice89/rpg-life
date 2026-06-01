'use client';

type FabCreateQuestProps = {
  onClick: () => void;
};

export function FabCreateQuest({ onClick }: FabCreateQuestProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create quest"
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-2xl font-light leading-none text-primary-foreground shadow-[0_4px_20px_rgba(13,148,136,0.35)]"
    >
      +
    </button>
  );
}
