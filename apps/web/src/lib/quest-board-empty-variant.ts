import type { ProfileSummary } from '@rpg-life/api';

export type QuestBoardEmptyVariant = 'first' | 'clear';

export function hasCompletedQuestHistory(profile: ProfileSummary): boolean {
  return profile.heroLevel > 0 || profile.skills.some((skill) => skill.xp > 0);
}

export function resolveServerEmptyVariant(
  openTaskCount: number,
  profile: ProfileSummary,
): QuestBoardEmptyVariant | null {
  if (openTaskCount > 0) {
    return null;
  }
  return hasCompletedQuestHistory(profile) ? 'clear' : 'first';
}

export function resolveQuestBoardEmptyVariant(
  openTaskCount: number,
  profile: ProfileSummary,
  showBoardClearFlag: boolean,
): QuestBoardEmptyVariant | null {
  if (openTaskCount > 0) {
    return null;
  }
  if (showBoardClearFlag) {
    return 'clear';
  }
  return hasCompletedQuestHistory(profile) ? 'clear' : 'first';
}
