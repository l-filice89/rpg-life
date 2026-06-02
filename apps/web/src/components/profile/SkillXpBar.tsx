import type { ProfileSummary } from '@rpg-life/api';
import { FallbackSkillIcon, XpBar, getIconByKey } from '@rpg-life/ui';

type SkillEntry = ProfileSummary['skills'][number];

export function SkillXpBar({ skill }: { skill: SkillEntry }) {
  const Icon = getIconByKey(skill.iconKey) ?? FallbackSkillIcon;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-foreground">{skill.displayName}</span>
        </div>
        <span className="text-xs text-muted-foreground">Lv {skill.level}</span>
      </div>
      <XpBar value={skill.xpProgress} ariaLabel={`${skill.displayName} XP progress`} />
    </div>
  );
}
