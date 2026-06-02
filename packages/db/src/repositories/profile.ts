import { and, asc, eq, sum } from 'drizzle-orm';
import {
  computeFocusCap,
  computeHeroLevel,
  computeSkillLevel,
  heroXpProgress,
  skillXpProgress,
} from '@rpg-life/domain';
import type { SkillCode } from '@rpg-life/validators';
import type { Database } from '../client';
import { skills } from '../schema/skills';
import { userProgress } from '../schema/user-progress';
import { userSkills } from '../schema/user-skills';

export type SkillSummary = {
  code: SkillCode;
  displayName: string;
  iconKey: string | null;
  xp: number;
  level: number;
  xpProgress: number;
};

export type ProfileSummary = {
  heroLevel: number;
  heroXpProgress: number;
  focusBalance: number;
  focusCap: number;
  skills: SkillSummary[];
};

export async function getProfileSummary(db: Database, userId: string): Promise<ProfileSummary> {
  const [xpResult, progressRows, skillRows] = await Promise.all([
    db
      .select({ totalXp: sum(userSkills.xp) })
      .from(userSkills)
      .where(eq(userSkills.userId, userId)),
    db
      .select({ focusBalance: userProgress.focusBalance })
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1),
    db
      .select({
        code: skills.code,
        displayName: skills.displayName,
        iconKey: skills.iconKey,
        xp: userSkills.xp,
      })
      .from(skills)
      .leftJoin(
        userSkills,
        and(eq(userSkills.skillCode, skills.code), eq(userSkills.userId, userId)),
      )
      .orderBy(asc(skills.sortOrder)),
  ]);

  const totalXp = Number(xpResult[0]?.totalXp ?? 0);
  const heroLevel = computeHeroLevel(totalXp);
  const focusBalance = progressRows[0]?.focusBalance ?? 0;

  return {
    heroLevel,
    heroXpProgress: heroXpProgress(totalXp, heroLevel),
    focusBalance,
    focusCap: computeFocusCap(heroLevel),
    skills: skillRows.map((row) => {
      const xp = row.xp ?? 0;
      const level = computeSkillLevel(xp);
      return {
        code: row.code as SkillCode,
        displayName: row.displayName,
        iconKey: row.iconKey,
        xp,
        level,
        xpProgress: skillXpProgress(xp, level),
      };
    }),
  };
}
