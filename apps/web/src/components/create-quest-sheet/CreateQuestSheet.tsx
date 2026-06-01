'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SKILL_CATALOG, TaskCreateSchema, type SkillCode } from '@rpg-life/validators';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SkillChip,
  toast,
} from '@rpg-life/ui';
import { cn } from '@rpg-life/ui/lib/utils';
import { trpc } from '@/components/providers/app-providers';
import { getDifficultyLabel } from '@/lib/difficulty-label';

type DifficultyValue = 'trivial' | 'easy' | 'medium' | 'hard';

const DIFFICULTIES: DifficultyValue[] = ['trivial', 'easy', 'medium', 'hard'];

type CreateQuestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useSheetSide(): 'bottom' | 'right' {
  const [side, setSide] = useState<'bottom' | 'right'>('bottom');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setSide(mq.matches ? 'right' : 'bottom');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return side;
}

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

        <div className="flex flex-1 flex-col gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="quest-title">Title</Label>
            <Input
              id="quest-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What will you tackle?"
              autoFocus={open}
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
              {DIFFICULTIES.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={difficulty === value ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => setDifficulty(value)}
                  aria-pressed={difficulty === value}
                >
                  {getDifficultyLabel(value)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills (1–3)</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Skills">
              {SKILL_CATALOG.map((skill) => {
                const selected = selectedSkills.includes(skill.code);
                const atMax = selectedSkills.length >= 3 && !selected;

                return (
                  <button
                    key={skill.code}
                    type="button"
                    disabled={atMax}
                    onClick={() => toggleSkill(skill.code)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-sm border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      selected ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    <SkillChip skillCode={skill.code} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest-due-date">Due date</Label>
            <Input
              id="quest-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Scheduled quests keep full XP through the due date.
            </p>
          </div>
        </div>

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
