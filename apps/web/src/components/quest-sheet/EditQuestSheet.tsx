'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskListItem } from '@rpg-life/api';
import { TaskUpdateSchema, type SkillCode } from '@rpg-life/validators';
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

function isOverdueForDelete(
  task: TaskListItem,
  dueDate: string,
  originallyUndated: boolean,
): boolean {
  const dbOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  if (dbOverdue) {
    return true;
  }

  if (originallyUndated) {
    return false;
  }

  const formDueDate = dueDate || null;
  return formDueDate ? isOverdue(formDueDate) : false;
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

  const originallyUndated = task.dueDate === null;
  const overdue = isOverdueForDelete(task, dueDate, originallyUndated);
  const mutationPending = update.isPending || remove.isPending;

  useEffect(() => {
    if (open) {
      const state = taskToFormState(task);
      setTitle(state.title);
      setDifficulty(state.difficulty);
      setSelectedSkills(state.selectedSkills);
      setDueDate(state.dueDate);
      setDeleteDialogOpen(false);
    }
  }, [open, task]);

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDeleteDialogOpen(false);
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

  const handleSubmit = async () => {
    if (mutationPending) {
      return;
    }

    const parsed = TaskUpdateSchema.safeParse({
      id: task.id,
      title,
      difficulty,
      skillCodes: selectedSkills,
      dueDate: dueDate ? dueDate : originallyUndated ? undefined : null,
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
    if (mutationPending) {
      return;
    }

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
            dueDateDisabled={originallyUndated}
            dueDateHelperText={
              originallyUndated
                ? 'Adding a due date costs 1 Focus — coming soon.'
                : 'Scheduled quests keep full XP through the due date.'
            }
            autoFocusTitle={open}
            fieldIdSuffix={`edit-${task.id}`}
          />

          <SheetFooter className="flex-col gap-3 sm:flex-col">
            {!overdue ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] w-full text-destructive hover:text-destructive"
                disabled={mutationPending}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Quest
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Overdue quests require Focus to delete.
              </p>
            )}
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
    </>
  );
}
