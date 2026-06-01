import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';
import { cn } from '../../lib/utils';
import { getSkillIcon } from '../../skill-icons';

type SkillChipProps = {
  skillCode: SkillCode;
  label?: string;
  className?: string;
};

export function SkillChip({ skillCode, label, className }: SkillChipProps) {
  const Icon = getSkillIcon(skillCode);
  const displayName =
    label ?? SKILL_CATALOG.find((skill) => skill.code === skillCode)?.displayName ?? skillCode;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm bg-skill-chip-bg px-2.5 py-1 text-[11px] font-medium text-skill-chip-fg',
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {displayName}
    </span>
  );
}
