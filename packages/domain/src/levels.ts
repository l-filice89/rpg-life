import { A_SKILL, A_USER } from './constants';

export function xpAtHeroLevel(level: number): number {
  return level * level * A_USER;
}

export function xpAtSkillLevel(level: number): number {
  return level * level * A_SKILL;
}

export function computeSkillLevel(skillXp: number): number {
  if (skillXp <= 0) {
    return 0;
  }
  return Math.floor(Math.sqrt(skillXp / A_SKILL));
}

export function computeHeroLevel(totalXp: number): number {
  if (totalXp <= 0) {
    return 0;
  }
  return Math.floor(Math.sqrt(totalXp / A_USER));
}

export function heroXpProgress(totalXp: number, heroLevel: number): number {
  const current = xpAtHeroLevel(heroLevel);
  const next = xpAtHeroLevel(heroLevel + 1);
  if (next === current) {
    return 0;
  }
  return Math.min(1, Math.max(0, (totalXp - current) / (next - current)));
}

export function skillXpProgress(skillXp: number, skillLevel: number): number {
  const current = xpAtSkillLevel(skillLevel);
  const next = xpAtSkillLevel(skillLevel + 1);
  if (next === current) {
    return 0;
  }
  return Math.min(1, Math.max(0, (skillXp - current) / (next - current)));
}
