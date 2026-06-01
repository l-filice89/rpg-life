'use client';

import { useEffect, useState } from 'react';
import type { RewardPayload } from '@rpg-life/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@rpg-life/ui';

type ConfirmCompleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  isPending: boolean;
  onConfirm: () => Promise<RewardPayload>;
  onCompleteSuccess: (payload: RewardPayload) => void | Promise<void>;
};

export function ConfirmCompleteModal({
  open,
  onOpenChange,
  taskTitle,
  isPending,
  onConfirm,
  onCompleteSuccess,
}: ConfirmCompleteModalProps) {
  const [confirmFired, setConfirmFired] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmFired(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (isPending || confirmFired) {
      return;
    }

    setConfirmFired(true);

    try {
      const payload = await onConfirm();
      onOpenChange(false);
      await Promise.resolve(onCompleteSuccess(payload));
    } catch {
      toast.error('Could not complete quest. Check your connection and try again.');
    } finally {
      setConfirmFired(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending && !confirmFired) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent showCloseButton={false} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Mark this quest complete?</DialogTitle>
        </DialogHeader>
        <p className="sr-only">{taskTitle}</p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            disabled={isPending || confirmFired}
            onClick={() => onOpenChange(false)}
          >
            No
          </Button>
          <Button
            type="button"
            className="min-h-[44px]"
            disabled={isPending || confirmFired}
            onClick={() => void handleConfirm()}
          >
            {isPending || confirmFired ? 'Completing…' : 'Yes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
