'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskListItem } from '@rpg-life/api';
import { TaskUpdateSchema, type SkillCode, type FocusSpendType } from '@rpg-life/validators';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
} from '@rpg-life/ui';
import { trpc } from '@/components/providers/app-providers';
import { QuestFormFields, type DifficultyValue } from '@/components/quest-sheet/QuestFormFields';
import { useSheetSide } from '@/components/quest-sheet/use-sheet-side';
import { isOverdue } from '@/lib/format-due-date';
import { FocusSpendPrompt } from '@/components/modals/FocusSpendPrompt';

type EditQuestSheetProps = {
  task: TaskListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function taskToFormState(task: TaskListItem) {
  return {
    title: task.title,
    difficulty: task.difficulty as DifficultyValue,
    selectedSkills: [...task.skillCodes],
    dueDate: task.dueDate ?? '',
  };
}

function detectFocusSpendType(
  task: TaskListItem,
  dueDate: string,
): FocusSpendType | null {
  const originallyUndated = task.dueDate === null;
  const formDueDate = dueDate || null;

  if (originallyUndated && formDueDate !== null) {
    return 'add_due_date';
  }

  if (task.dueDate && isOverdue(task.dueDate) && formDueDate !== task.dueDate) {
    return 'reschedule_overdue';
  }

  return null;
}

export function EditQuestSheet({ task, open, onOpenChange }: EditQuestSheetProps) {
  const router = useRouter();
  const side = useSheetSide();
  const update = trpc.tasks.update.useMutation();
  const remove = trpc.tasks.delete.useMutation();

  const [title, setTitle] = useState(task.title);
  const [difficulty, setDifficulty] = useState<DifficultyValue>(task.difficulty as DifficultyValue);
  const [selectedSkills, setSelectedSkills] = useState<SkillCode[]>([...task.skillCodes]);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Focus spend state
  const [focusPromptOpen, setFocusPromptOpen] = useState(false);
  const [focusActionType, setFocusActionType] = useState<FocusSpendType | null>(null);
  const [pendingDueDate, setPendingDueDate] = useState<string | undefined>(undefined);

  const originallyUndated = task.dueDate === null;
  const taskIsOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const mutationPending = update.isPending || remove.isPending;

  useEffect(() => {
    if (open) {
      const state = taskToFormState(task);
      setTitle(state.title);
      setDifficulty(state.difficulty);
      setSelectedSkills(state.selectedSkills);
      setDueDate(state.dueDate);
      setDeleteDialogOpen(false);
      setFocusPromptOpen(false);
      setFocusActionType(null);
      setPendingDueDate(undefined);
    }
  }, [open, task]);

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDeleteDialogOpen(false);
      setFocusPromptOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const canSave =
    title.trim().length > 0 && selectedSkills.length > 0 && !mutationPending;

  const toggleSkill = (code: SkillCode) => {
    setSelectedSkills((current) => {
      if (current.includes(code)) {
        return current.filter((skill) => skill !== code);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, code];
    });
  };

  const nonDateFieldsDirty = () => {
    const sameSkills =
      selectedSkills.length === task.skillCodes.length &&
      [...selectedSkills].sort().join(',') === [...task.skillCodes].sort().join(',');
    return title.trim() !== task.title || difficulty !== task.difficulty || !sameSkills;
  };

  const handleSubmit = async () => {
    if (mutationPending) return;

    const formDueDateValue = dueDate ? dueDate : originallyUndated ? undefined : null;
    const formDueDate = dueDate || null;

    // Clearing the due date on an overdue quest is not a supported action:
    // overdue quests must be rescheduled to a new date (matches tasks.update guard).
    if (task.dueDate && isOverdue(task.dueDate) && formDueDate === null) {
      toast.error('Pick a new date to reschedule this overdue quest.');
      return;
    }

    // Check if this save requires a Focus spend
    const spendType = detectFocusSpendType(task, dueDate);
    if (spendType) {
      // Persist any title/difficulty/skill edits first so they aren't lost when
      // the save routes through focus.spend (which only mutates the due date).
      if (nonDateFieldsDirty()) {
        const editParsed = TaskUpdateSchema.safeParse({
          id: task.id,
          title,
          difficulty,
          skillCodes: selectedSkills,
          dueDate: task.dueDate ?? undefined, // unchanged date — avoids the Focus guards
        });

        if (!editParsed.success) {
          toast.error('Could not save quest. Check the fields and try again.');
          return;
        }

        try {
          await update.mutateAsync(editParsed.data);
        } catch {
          toast.error('Could not save quest. Check your connection and try again.');
          return;
        }
      }

      setFocusActionType(spendType);
      setPendingDueDate(dueDate || undefined);
      setFocusPromptOpen(true);
      return;
    }

    const parsed = TaskUpdateSchema.safeParse({
      id: task.id,
      title,
      difficulty,
      skillCodes: selectedSkills,
      dueDate: formDueDateValue,
    });

    if (!parsed.success) {
      toast.error('Could not save quest. Check the fields and try again.');
      return;
    }

    try {
      await update.mutateAsync(parsed.data);
      toast.success('Quest updated');
      handleSheetOpenChange(false);
      router.refresh();
    } catch {
      toast.error('Could not save quest. Check your connection and try again.');
    }
  };

  const handleDelete = async () => {
    if (mutationPending) return;

    try {
      await remove.mutateAsync({ id: task.id });
      toast.success('Quest removed');
      setDeleteDialogOpen(false);
      handleSheetOpenChange(false);
      router.refresh();
    } catch {
      toast.error('Could not delete quest. Check your connection and try again.');
    }
  };

  const handleDeleteClick = () => {
    if (taskIsOverdue) {
      setFocusActionType('delete_overdue');
      setPendingDueDate(undefined);
      setFocusPromptOpen(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleFocusSpendSuccess = () => {
    setFocusPromptOpen(false);
    setFocusActionType(null);
    setPendingDueDate(undefined);
    handleSheetOpenChange(false);

    if (focusActionType === 'reschedule_overdue') {
      toast.success('Quest rescheduled');
    } else if (focusActionType === 'add_due_date') {
      toast.success('Quest scheduled');
    } else if (focusActionType === 'delete_overdue') {
      toast.success('Quest removed');
    }

    router.refresh();
  };

  const handleFocusSpendCancel = () => {
    setFocusPromptOpen(false);
    setFocusActionType(null);
    setPendingDueDate(undefined);
  };

  const dueDateHelperText = originallyUndated
    ? 'Spend 1 Focus to schedule this quest.'
    : 'Scheduled quests keep full XP through the due date.';

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side={side} className="flex max-h-[90vh] flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Quest</SheetTitle>
          </SheetHeader>

          <QuestFormFields
            title={title}
            onTitleChange={setTitle}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            selectedSkills={selectedSkills}
            onToggleSkill={toggleSkill}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            dueDateDisabled={false}
            dueDateHelperText={dueDateHelperText}
            autoFocusTitle={open}
            fieldIdSuffix={`edit-${task.id}`}
          />

          <SheetFooter className="flex-col gap-3 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full text-destructive hover:text-destructive"
              disabled={mutationPending}
              onClick={handleDeleteClick}
            >
              {taskIsOverdue ? 'Delete Quest (1 Focus)' : 'Delete Quest'}
            </Button>
            <Button
              type="button"
              className="min-h-[44px] w-full"
              disabled={!canSave}
              onClick={() => void handleSubmit()}
            >
              {update.isPending ? 'Saving…' : 'Save Quest'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Standard delete confirmation for non-overdue quests */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this quest?</DialogTitle>
            <DialogDescription>
              This quest will be removed from your board. You can always create a new one later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={mutationPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={mutationPending}
              onClick={() => void handleDelete()}
            >
              {remove.isPending ? 'Deleting…' : 'Delete Quest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focus spend prompt for gated actions */}
      {focusActionType && (
        <FocusSpendPrompt
          open={focusPromptOpen}
          actionType={focusActionType}
          taskId={task.id}
          newDueDate={pendingDueDate}
          onSuccess={handleFocusSpendSuccess}
          onCancel={handleFocusSpendCancel}
        />
      )}
    </>
  );
}
