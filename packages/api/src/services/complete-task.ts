import {
  BASE_XP,
  computeFocusCap,
  computeFocusEarn,
  computeFreshness,
  computeHeroLevel,
  computeXpAward,
  splitXpAcrossSkills,
  utcToLocalDate,
  type Difficulty,
  type FreshnessReason,
} from '@rpg-life/domain';
import {
  and,
  eq,
  isNull,
  sql,
  sum,
  taskSkills,
  tasks,
  userProgress,
  userSkills,
  type Database,
} from '@rpg-life/db';
import type { CompleteTaskInput, RewardPayload, SkillCode } from '@rpg-life/validators';

export class CompleteTaskError extends Error {
  readonly code: 'NOT_FOUND' | 'BAD_REQUEST';

  constructor(code: 'NOT_FOUND' | 'BAD_REQUEST', message: string) {
    super(message);
    this.name = 'CompleteTaskError';
    this.code = code;
  }
}

async function getTotalSkillXp(db: Database, userId: string): Promise<number> {
  const result = await db
    .select({ total: sum(userSkills.xp) })
    .from(userSkills)
    .where(eq(userSkills.userId, userId));

  return Number(result[0]?.total ?? 0);
}

function sumXpPerSkill(xpPerSkill: Record<string, number>): number {
  return Object.values(xpPerSkill).reduce((total, xp) => total + xp, 0);
}

function buildFreshnessPayload(
  difficulty: Difficulty,
  multiplier: number,
  reason: FreshnessReason,
  daysApplied: number,
  finalXp: number,
): RewardPayload['freshness'] | undefined {
  if (multiplier >= 1 || reason === 'on_time') {
    return undefined;
  }

  return {
    multiplier,
    reason: reason === 'overdue' ? 'overdue' : 'undated_age',
    daysApplied,
    baseXp: BASE_XP[difficulty],
    finalXp,
  };
}

async function loadTaskSkillCodes(db: Database, taskId: string): Promise<SkillCode[]> {
  const rows = await db
    .select({ skillCode: taskSkills.skillCode })
    .from(taskSkills)
    .where(eq(taskSkills.taskId, taskId));

  return rows.map((row) => row.skillCode as SkillCode);
}

async function buildRewardPayload(
  db: Database,
  userId: string,
  task: typeof tasks.$inferSelect,
  skillCodes: SkillCode[],
  timezone: string,
): Promise<RewardPayload> {
  if (task.xpAwarded == null) {
    throw new CompleteTaskError('BAD_REQUEST', 'Corrupted quest data');
  }

  const xpAward = task.xpAwarded;
  const multiplier = task.freshnessMultiplier ?? 1;
  const difficulty = task.difficulty as Difficulty;
  const focusEarned = task.focusEarned ?? 0;
  const xpPerSkill = splitXpAcrossSkills(xpAward, skillCodes) as Record<SkillCode, number>;

  const totalXp = await getTotalSkillXp(db, userId);
  const actualXpAdded = sumXpPerSkill(xpPerSkill);
  const heroLevelAfter = computeHeroLevel(totalXp);
  const heroLevelBefore = computeHeroLevel(Math.max(0, totalXp - actualXpAdded));

  let freshness: RewardPayload['freshness'];
  if (multiplier < 1 && task.completedAt) {
    const completedLocalDate = utcToLocalDate(task.completedAt, timezone);
    const createdLocalDate = utcToLocalDate(task.createdAt, timezone);
    const freshnessResult = computeFreshness({
      dueDate: task.dueDate,
      createdLocalDate,
      completedLocalDate,
    });
    freshness = buildFreshnessPayload(
      difficulty,
      multiplier,
      freshnessResult.reason,
      freshnessResult.daysApplied,
      xpAward,
    );
  }

  return {
    xpAward,
    xpPerSkill,
    focusEarned,
    heroLevelBefore,
    heroLevelAfter,
    leveledUp: heroLevelAfter > heroLevelBefore,
    freshness,
  };
}

export async function completeTaskForOwner(
  db: Database,
  ownerId: string,
  input: CompleteTaskInput,
): Promise<RewardPayload> {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.id, input.taskId), eq(tasks.ownerId, ownerId), isNull(tasks.deletedAt)),
    )
    .limit(1);

  const task = taskRows[0];
  if (!task) {
    throw new CompleteTaskError('NOT_FOUND', 'Quest not found');
  }

  const skillCodes = await loadTaskSkillCodes(db, input.taskId);
  if (skillCodes.length === 0) {
    throw new CompleteTaskError('BAD_REQUEST', 'Quest must have at least one skill');
  }

  if (task.completedAt && task.status === 'completed') {
    return buildRewardPayload(db, ownerId, task, skillCodes, input.timezone);
  }

  if (task.status !== 'open') {
    throw new CompleteTaskError('NOT_FOUND', 'Quest not found');
  }

  const totalXpBefore = await getTotalSkillXp(db, ownerId);
  const heroLevelBefore = computeHeroLevel(totalXpBefore);
  const focusBalanceBefore = await db
    .select({ focusBalance: userProgress.focusBalance })
    .from(userProgress)
    .where(eq(userProgress.userId, ownerId))
    .limit(1)
    .then((rows) => rows[0]?.focusBalance ?? 0);
  const focusCap = computeFocusCap(heroLevelBefore);

  const now = new Date().toISOString();
  const completedLocalDate = utcToLocalDate(now, input.timezone);
  const createdLocalDate = utcToLocalDate(task.createdAt, input.timezone);

  const freshnessResult = computeFreshness({
    dueDate: task.dueDate,
    createdLocalDate,
    completedLocalDate,
  });

  const difficulty = task.difficulty as Difficulty;
  const xpAward = computeXpAward(difficulty, freshnessResult.multiplier);
  const xpPerSkill = splitXpAcrossSkills(xpAward, skillCodes) as Record<SkillCode, number>;
  const actualXpAdded = sumXpPerSkill(xpPerSkill);

  if (actualXpAdded <= 0) {
    throw new CompleteTaskError('BAD_REQUEST', 'XP award rounded to zero for all skills');
  }

  const heroLevelAfter = computeHeroLevel(totalXpBefore + actualXpAdded);
  const focusEarnResult = computeFocusEarn(difficulty, focusBalanceBefore, focusCap);
  const focusEarned = focusEarnResult.earned;

  const freshness = buildFreshnessPayload(
    difficulty,
    freshnessResult.multiplier,
    freshnessResult.reason,
    freshnessResult.daysApplied,
    xpAward,
  );

  await db.transaction(async (tx) => {
    for (const [skillCode, xp] of Object.entries(xpPerSkill)) {
      if (xp <= 0) {
        continue;
      }

      await tx
        .insert(userSkills)
        .values({
          userId: ownerId,
          skillCode,
          xp,
        })
        .onConflictDoUpdate({
          target: [userSkills.userId, userSkills.skillCode],
          set: { xp: sql`${userSkills.xp} + ${xp}` },
        });
    }

    if (focusEarned > 0) {
      const progressRows = await tx
        .select({ userId: userProgress.userId })
        .from(userProgress)
        .where(eq(userProgress.userId, ownerId))
        .limit(1);

      if (progressRows.length === 0) {
        await tx.insert(userProgress).values({
          userId: ownerId,
          focusBalance: focusEarned,
          modifiedAt: now,
        });
      } else {
        await tx
          .update(userProgress)
          .set({
            focusBalance: sql`${userProgress.focusBalance} + ${focusEarned}`,
            modifiedAt: now,
          })
          .where(eq(userProgress.userId, ownerId));
      }
    }

    const updated = await tx
      .update(tasks)
      .set({
        status: 'completed',
        completedAt: now,
        xpAwarded: xpAward,
        freshnessMultiplier: freshnessResult.multiplier,
        focusEarned,
        modifiedAt: now,
      })
      .where(and(eq(tasks.id, input.taskId), eq(tasks.status, 'open')))
      .returning({ id: tasks.id });

    if (updated.length === 0) {
      throw new CompleteTaskError('BAD_REQUEST', 'Quest already completed');
    }
  });

  return {
    xpAward,
    xpPerSkill,
    focusEarned,
    heroLevelBefore,
    heroLevelAfter,
    leveledUp: heroLevelAfter > heroLevelBefore,
    freshness,
  };
}
