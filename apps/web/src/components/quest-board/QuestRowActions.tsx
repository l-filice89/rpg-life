'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RewardPayload } from '@rpg-life/api';
import { Checkbox } from '@rpg-life/ui';
import { trpc } from '@/components/providers/app-providers';
import { ConfirmCompleteModal } from '@/components/modals/ConfirmCompleteModal';
import { HeroLevelUpOverlay } from '@/components/modals/HeroLevelUpOverlay';
import { RewardModal } from '@/components/modals/RewardModal';

type QuestRowActionsProps = {
  taskId: string;
  taskTitle: string;
  onCompleteSuccess?: (payload: RewardPayload) => void;
  onCompletingChange?: (isCompleting: boolean) => void;
};

export function QuestRowActions({
  taskId,
  taskTitle,
  onCompleteSuccess,
  onCompletingChange,
}: QuestRowActionsProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const complete = trpc.tasks.complete.useMutation({
    onError: () => {
      // Confirm modal stays open for retry; completing resets when user dismisses confirm
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardPayload, setRewardPayload] = useState<RewardPayload | null>(null);
  const [heroXpProgress, setHeroXpProgress] = useState(0);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);

  const isMutationPending = complete.isPending;
  const isRewardFlowActive = confirmOpen || isMutationPending || rewardOpen;
  const showLevelUp = rewardOpen && rewardPayload?.leveledUp === true;
  const showStandardReward = rewardOpen && rewardPayload != null && !rewardPayload.leveledUp;

  const finishRewardFlow = () => {
    setRewardOpen(false);
    setRewardPayload(null);
    setHeroXpProgress(0);
    setCompletedTaskId(null);
    onCompletingChange?.(false);
    router.refresh();
  };

  const handleCompleteSuccess = async (payload: RewardPayload) => {
    void utils.tasks.list.invalidate();
    await utils.profile.get.invalidate();
    const profile = await utils.profile.get.fetch();
    setHeroXpProgress(profile.heroXpProgress);
    setRewardPayload(payload);
    setCompletedTaskId(taskId);
    setRewardOpen(true);
    onCompleteSuccess?.(payload);
  };

  return (
    <>
      <div className="flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center">
        <Checkbox
          checked={false}
          disabled={isRewardFlowActive}
          aria-label={`Complete quest: ${taskTitle}`}
          className="size-6 rounded-full"
          onCheckedChange={(checked) => {
            if (checked === true && !isRewardFlowActive) {
              setConfirmOpen(true);
              onCompletingChange?.(true);
            }
          }}
        />
      </div>

      <ConfirmCompleteModal
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          setConfirmOpen(nextOpen);
          if (!nextOpen && !rewardOpen && !isMutationPending) {
            onCompletingChange?.(false);
          }
        }}
        taskTitle={taskTitle}
        isPending={isMutationPending}
        onCompleteSuccess={handleCompleteSuccess}
        onConfirm={async () =>
          complete.mutateAsync({
            taskId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
          })
        }
      />

      {showStandardReward && rewardPayload ? (
        <RewardModal
          open={rewardOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              finishRewardFlow();
            } else {
              setRewardOpen(nextOpen);
            }
          }}
          payload={rewardPayload}
          heroXpProgress={heroXpProgress}
          onContinue={finishRewardFlow}
        />
      ) : null}

      {showLevelUp && rewardPayload ? (
        <HeroLevelUpOverlay
          open={rewardOpen}
          payload={rewardPayload}
          heroXpProgress={heroXpProgress}
          onContinue={finishRewardFlow}
        />
      ) : null}

      {/* taskId retained for Story 3.6 board-clear detection */}
      <span className="sr-only" data-completed-task-id={completedTaskId ?? undefined} />
    </>
  );
}
