import { eq, sum } from 'drizzle-orm';
import {
  computeFocusCap,
  computeHeroLevel,
  heroXpProgress,
} from '@rpg-life/domain';
import type { Database } from '../client';
import { userProgress } from '../schema/user-progress';
import { userSkills } from '../schema/user-skills';

export type ProfileSummary = {
  heroLevel: number;
  heroXpProgress: number;
  focusBalance: number;
  focusCap: number;
};

export async function getProfileSummary(db: Database, userId: string): Promise<ProfileSummary> {
  const xpResult = await db
    .select({ totalXp: sum(userSkills.xp) })
    .from(userSkills)
    .where(eq(userSkills.userId, userId));

  const totalXp = Number(xpResult[0]?.totalXp ?? 0);
  const heroLevel = computeHeroLevel(totalXp);

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
    focusCap: computeFocusCap(heroLevel),
  };
}
