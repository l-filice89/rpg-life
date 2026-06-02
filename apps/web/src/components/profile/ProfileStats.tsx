import type { ProfileSummary } from '@rpg-life/api';
import { FocusPill, XpBar } from '@rpg-life/ui';
import { SkillXpBar } from './SkillXpBar';

type ProfileStatsProps = {
  profile: ProfileSummary;
};

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-hero-level text-primary">Hero Lv {profile.heroLevel}</span>
          <FocusPill balance={profile.focusBalance} cap={profile.focusCap} />
        </div>
        <XpBar value={profile.heroXpProgress} ariaLabel="Hero XP progress" />
      </div>

      <div>
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Skills
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {profile.skills.map((skill) => (
            <SkillXpBar key={skill.code} skill={skill} />
          ))}
        </div>
      </div>
    </div>
  );
}
