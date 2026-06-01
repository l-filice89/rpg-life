import { eq, sum } from 'drizzle-orm';
import type { Database } from '../client';
import { userProgress } from '../schema/user-progress';
import { userSkills } from '../schema/user-skills';

const A_USER = 50;

export type ProfileSummary = {
  heroLevel: number;
  heroXpProgress: number;
  focusBalance: number;
  focusCap: number;
};

function xpAtHeroLevel(level: number): number {
  return level * level * A_USER;
}

function heroLevelFromTotalXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / A_USER));
}

function heroXpProgress(totalXp: number, heroLevel: number): number {
  const current = xpAtHeroLevel(heroLevel);
  const next = xpAtHeroLevel(heroLevel + 1);
  if (next === current) {
    return 0;
  }
  return Math.min(1, Math.max(0, (totalXp - current) / (next - current)));
}

function focusCapFromHeroLevel(heroLevel: number): number {
  return 3 + Math.floor(heroLevel / 3);
}

export async function getProfileSummary(db: Database, userId: string): Promise<ProfileSummary> {
  const xpResult = await db
    .select({ totalXp: sum(userSkills.xp) })
    .from(userSkills)
    .where(eq(userSkills.userId, userId));

  const totalXp = Number(xpResult[0]?.totalXp ?? 0);
  const heroLevel = heroLevelFromTotalXp(totalXp);

  const progressRows = await db
    .select({ focusBalance: userProgress.focusBalance })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);

  const focusBalance = progressRows[0]?.focusBalance ?? 0;

  return {
    heroLevel,
    heroXpProgress: heroXpProgress(totalXp, heroLevel),
    focusBalance,
    focusCap: focusCapFromHeroLevel(heroLevel),
  };
}
