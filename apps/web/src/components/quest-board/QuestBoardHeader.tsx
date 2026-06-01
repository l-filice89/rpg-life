import type { ProfileSummary } from '@rpg-life/api';
import { FocusPill, XpBar } from '@rpg-life/ui';

type QuestBoardHeaderProps = {
  profile: ProfileSummary;
};

export function QuestBoardHeader({ profile }: QuestBoardHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-hero-level text-primary">Hero Lv {profile.heroLevel}</span>
        <FocusPill balance={profile.focusBalance} cap={profile.focusCap} />
      </div>
      <XpBar value={profile.heroXpProgress} />
    </div>
  );
}
