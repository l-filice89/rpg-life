'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskCreateSchema, type SkillCode } from '@rpg-life/validators';
import {
  Button,
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

type CreateQuestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateQuestSheet({ open, onOpenChange }: CreateQuestSheetProps) {
  const router = useRouter();
  const side = useSheetSide();
  const create = trpc.tasks.create.useMutation();

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyValue>('easy');
  const [selectedSkills, setSelectedSkills] = useState<SkillCode[]>([]);
  const [dueDate, setDueDate] = useState('');

  const resetForm = () => {
    setTitle('');
    setDifficulty('easy');
    setSelectedSkills([]);
    setDueDate('');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const canSave =
    title.trim().length > 0 && selectedSkills.length > 0 && !create.isPending;

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
    if (create.isPending) {
      return;
    }

    const parsed = TaskCreateSchema.safeParse({
      title,
      difficulty,
      skillCodes: selectedSkills,
      dueDate: dueDate ? dueDate : undefined,
    });

    if (!parsed.success) {
      toast.error('Could not create quest. Check the fields and try again.');
      return;
    }

    try {
      await create.mutateAsync(parsed.data);
      toast.success('Quest created', {
        description: "Complete it when you're ready to earn XP and level up.",
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error('Could not create quest. Check your connection and try again.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="flex max-h-[90vh] flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Quest</SheetTitle>
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
          autoFocusTitle={open}
          fieldIdSuffix="create"
        />

        <SheetFooter>
          <Button
            type="button"
            className="min-h-[44px] w-full"
            disabled={!canSave}
            onClick={() => void handleSubmit()}
          >
            {create.isPending ? 'Saving…' : 'Save Quest'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
