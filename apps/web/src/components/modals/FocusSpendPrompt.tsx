'use client';

import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rpg-life/ui';
import { trpc } from '@/components/providers/app-providers';
import type { FocusSpendType } from '@rpg-life/validators';

type FocusSpendPromptProps = {
  open: boolean;
  actionType: FocusSpendType;
  taskId: string;
  newDueDate?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

const ACTION_COPY: Record<FocusSpendType, string> = {
  reschedule_overdue: 'Spend 1 Focus to reschedule without penalty.',
  delete_overdue: 'Spend 1 Focus to delete this overdue quest.',
  add_due_date: 'Spend 1 Focus to schedule this quest.',
};

const ACTION_TITLE: Record<FocusSpendType, string> = {
  reschedule_overdue: 'Reschedule quest?',
  delete_overdue: 'Delete overdue quest?',
  add_due_date: 'Schedule quest?',
};

const INSUFFICIENT_FOCUS_MSG =
  'Not enough Focus. Complete medium or hard quests to earn Focus.';

export function FocusSpendPrompt({
  open,
  actionType,
  taskId,
  newDueDate,
  onSuccess,
  onCancel,
}: FocusSpendPromptProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const spend = trpc.focus.spend.useMutation();
  const utils = trpc.useUtils();

  const isPending = spend.isPending;

  const handleConfirm = async () => {
    if (isPending) return;
    setErrorMsg(null);

    try {
      await spend.mutateAsync(
        actionType === 'delete_overdue'
          ? { type: actionType, taskId }
          : { type: actionType, taskId, newDueDate: newDueDate ?? '' },
      );
      void utils.tasks.list.invalidate();
      void utils.profile.get.invalidate();
      onSuccess();
    } catch (err) {
      // Branch on the tRPC error code, not message text: server BAD_REQUEST /
      // CONFLICT messages are already neutral and user-facing; anything else
      // (network, parse) gets the generic retry copy.
      if (err instanceof TRPCClientError) {
        const code = err.data?.code as string | undefined;
        if (code === 'BAD_REQUEST' || code === 'CONFLICT' || code === 'NOT_FOUND') {
          setErrorMsg(err.message || INSUFFICIENT_FOCUS_MSG);
          return;
        }
      }
      setErrorMsg('Could not complete action. Check your connection and try again.');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) {
      setErrorMsg(null);
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby="focus-spend-desc">
        <DialogHeader>
          <DialogTitle>{ACTION_TITLE[actionType]}</DialogTitle>
        </DialogHeader>
        <DialogDescription id="focus-spend-desc" className="space-y-3">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-focus-pill-bg px-3 py-1 text-sm font-semibold text-focus-pill-fg">
              ⚡ 1 Focus
            </span>
            <span>{ACTION_COPY[actionType]}</span>
          </span>
          {errorMsg && (
            <span className="block text-sm text-muted-foreground">{errorMsg}</span>
          )}
        </DialogDescription>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-[44px]"
            disabled={isPending}
            onClick={() => void handleConfirm()}
          >
            {isPending ? 'Spending…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
