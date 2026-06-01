'use client';

import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';
import { Button, Input, Label, SkillChip } from '@rpg-life/ui';
import { cn } from '@rpg-life/ui/lib/utils';
import { getDifficultyLabel } from '@/lib/difficulty-label';

type DifficultyValue = 'trivial' | 'easy' | 'medium' | 'hard';

const DIFFICULTIES: DifficultyValue[] = ['trivial', 'easy', 'medium', 'hard'];

type QuestFormFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  difficulty: DifficultyValue;
  onDifficultyChange: (value: DifficultyValue) => void;
  selectedSkills: SkillCode[];
  onToggleSkill: (code: SkillCode) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  dueDateDisabled?: boolean;
  dueDateHelperText?: string;
  autoFocusTitle?: boolean;
  fieldIdSuffix?: string;
};

export function QuestFormFields({
  title,
  onTitleChange,
  difficulty,
  onDifficultyChange,
  selectedSkills,
  onToggleSkill,
  dueDate,
  onDueDateChange,
  dueDateDisabled = false,
  dueDateHelperText = 'Scheduled quests keep full XP through the due date.',
  autoFocusTitle = false,
  fieldIdSuffix = 'create',
}: QuestFormFieldsProps) {
  const titleId = `quest-title-${fieldIdSuffix}`;
  const dueDateId = `quest-due-date-${fieldIdSuffix}`;

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="space-y-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input
          id={titleId}
          value={title}
          maxLength={200}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="What will you tackle?"
          autoFocus={autoFocusTitle}
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
              onClick={() => onDifficultyChange(value)}
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
                onClick={() => onToggleSkill(skill.code)}
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
        <Label htmlFor={dueDateId}>Due date</Label>
        <Input
          id={dueDateId}
          type="date"
          value={dueDate}
          disabled={dueDateDisabled}
          onChange={(event) => onDueDateChange(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">{dueDateHelperText}</p>
      </div>
    </div>
  );
}

export type { DifficultyValue };
