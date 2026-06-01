'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RewardPayload } from '@rpg-life/api';
import { Checkbox } from '@rpg-life/ui';
import { trpc } from '@/components/providers/app-providers';
import { ConfirmCompleteModal } from '@/components/modals/ConfirmCompleteModal';

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
    onMutate: () => onCompletingChange?.(true),
    onSettled: () => onCompletingChange?.(false),
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isCompleting = complete.isPending;

  const handleCompleteSuccess = (payload: RewardPayload) => {
    void utils.tasks.list.invalidate();
    void utils.profile.get.invalidate();
    router.refresh();
    onCompleteSuccess?.(payload);
  };

  return (
    <>
      <div className="flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center">
        <Checkbox
          checked={false}
          disabled={isCompleting}
          aria-label={`Complete quest: ${taskTitle}`}
          className="size-6 rounded-full"
          onCheckedChange={(checked) => {
            if (checked === true && !isCompleting) {
              setConfirmOpen(true);
            }
          }}
        />
      </div>

      <ConfirmCompleteModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        taskTitle={taskTitle}
        isPending={isCompleting}
        onCompleteSuccess={handleCompleteSuccess}
        onConfirm={async () =>
          complete.mutateAsync({
            taskId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
          })
        }
      />
    </>
  );
}
