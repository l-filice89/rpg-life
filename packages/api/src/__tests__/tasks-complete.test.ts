import { Database } from 'bun:sqlite';
import { describe, expect, test, beforeAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { and, eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  account,
  session,
  skills,
  taskSkills,
  tasks,
  user,
  userProgress,
  userSkills,
  verification,
} from '@rpg-life/db';
import { seedSkills } from '@rpg-life/db';
import { appRouter } from '../root';

const schema = {
  user,
  session,
  account,
  verification,
  userProgress,
  tasks,
  skills,
  taskSkills,
  userSkills,
};

const mockReq = new Request('http://localhost/api/trpc');
const migrationsDir = path.join(import.meta.dir, '../../../db/migrations');
const timezone = 'UTC';

function applyMigrationFile(sqlite: Database, fileName: string) {
  const migrationSql = readFileSync(path.join(migrationsDir, fileName), 'utf8');
  for (const statement of migrationSql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }
}

function createCaller(
  db: ReturnType<typeof drizzle<typeof schema>>,
  authUser: { id: string; email: string; name: string } | null,
) {
  return appRouter.createCaller({
    db: db as typeof import('@rpg-life/db').db,
    user: authUser,
    req: mockReq,
  });
}

async function seedUser(
  db: ReturnType<typeof drizzle<typeof schema>>,
  userId: string,
  emailSuffix = userId,
) {
  const now = new Date();
  await db.insert(user).values({
    id: userId,
    name: 'Ben',
    email: `ben-${emailSuffix}@example.com`,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });
}

async function expectTrpcErrorCode(
  promise: Promise<unknown>,
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'BAD_REQUEST',
) {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe('tasks.complete', () => {
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    applyMigrationFile(sqlite, '0000_init.sql');
    applyMigrationFile(sqlite, '0001_quest_schema.sql');
    applyMigrationFile(sqlite, '0002_task_focus_earned.sql');
    testDb = drizzle(sqlite, { schema });
    await seedSkills(testDb as typeof import('@rpg-life/db').db);
  });

  test('requires authentication', async () => {
    const caller = createCaller(testDb, null);
    await expectTrpcErrorCode(
      caller.tasks.complete({ taskId: crypto.randomUUID(), timezone }),
      'UNAUTHORIZED',
    );
  });

  test('returns NOT_FOUND for another owner quest', async () => {
    const ownerA = crypto.randomUUID();
    const ownerB = crypto.randomUUID();
    await seedUser(testDb, ownerA, 'owner-a');
    await seedUser(testDb, ownerB, 'owner-b');

    const callerA = createCaller(testDb, {
      id: ownerA,
      email: 'ben-owner-a@example.com',
      name: 'Ben',
    });
    const callerB = createCaller(testDb, {
      id: ownerB,
      email: 'ben-owner-b@example.com',
      name: 'Ben',
    });

    const created = await callerA.tasks.create({
      title: 'Owner A quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    await expectTrpcErrorCode(
      callerB.tasks.complete({ taskId: created.id, timezone }),
      'NOT_FOUND',
    );
  });

  test('returns NOT_FOUND for soft-deleted quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Deleted quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    await caller.tasks.delete({ id: created.id });

    await expectTrpcErrorCode(
      caller.tasks.complete({ taskId: created.id, timezone }),
      'NOT_FOUND',
    );
  });

  test('returns NOT_FOUND for unknown task id', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expectTrpcErrorCode(
      caller.tasks.complete({ taskId: crypto.randomUUID(), timezone }),
      'NOT_FOUND',
    );
  });

  test('returns BAD_REQUEST for quest with no skills', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    await testDb.insert(tasks).values({
      id: taskId,
      ownerId: userId,
      title: 'Skill-less quest',
      difficulty: 'easy',
      status: 'open',
      createdAt: now,
      modifiedAt: now,
    });

    await expectTrpcErrorCode(
      caller.tasks.complete({ taskId, timezone }),
      'BAD_REQUEST',
    );
  });

  test('rejects invalid timezone', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Timezone quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    await expectTrpcErrorCode(
      caller.tasks.complete({ taskId: created.id, timezone: 'Not/A/Timezone' }),
      'BAD_REQUEST',
    );
  });

  test('completes quest, excludes from list, and awards skill xp', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Finish portfolio draft',
      difficulty: 'medium',
      skillCodes: ['craft', 'lore'],
      dueDate: '2099-06-15',
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });

    expect(reward.xpAward).toBe(25);
    expect(reward.xpPerSkill.craft).toBe(12);
    expect(reward.xpPerSkill.lore).toBe(12);

    const list = await caller.tasks.list();
    expect(list).toHaveLength(0);

    const taskRows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(taskRows[0]?.status).toBe('completed');
    expect(taskRows[0]?.xpAwarded).toBe(25);
    expect(taskRows[0]?.focusEarned).toBe(1);
    expect(taskRows[0]?.completedAt).toBeTruthy();

    const skillRows = await testDb
      .select()
      .from(userSkills)
      .where(and(eq(userSkills.userId, userId), eq(userSkills.skillCode, 'craft')));
    expect(skillRows[0]?.xp).toBe(12);
  });

  test('idempotent re-complete returns same xpAward without double increment', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Idempotent quest',
      difficulty: 'easy',
      skillCodes: ['resolve'],
    });

    const first = await caller.tasks.complete({ taskId: created.id, timezone });
    const second = await caller.tasks.complete({ taskId: created.id, timezone });

    expect(second.xpAward).toBe(first.xpAward);
    expect(second.focusEarned).toBe(first.focusEarned);

    const skillRows = await testDb
      .select()
      .from(userSkills)
      .where(and(eq(userSkills.userId, userId), eq(userSkills.skillCode, 'resolve')));
    expect(skillRows[0]?.xp).toBe(first.xpPerSkill.resolve);
  });

  test('medium quest earns +1 focus when under cap', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Focus earn quest',
      difficulty: 'medium',
      skillCodes: ['concentration'],
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(reward.focusEarned).toBe(1);

    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows[0]?.focusBalance).toBe(1);
  });

  test('trivial quest earns no focus', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Trivial quest',
      difficulty: 'trivial',
      skillCodes: ['vitality'],
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(reward.focusEarned).toBe(0);

    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows).toHaveLength(0);
  });

  test('medium quest earns no focus when already at cap', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    await testDb.insert(userProgress).values({
      userId,
      focusBalance: 3,
      modifiedAt: new Date().toISOString(),
    });

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Capped focus quest',
      difficulty: 'medium',
      skillCodes: ['concentration'],
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(reward.focusEarned).toBe(0);

    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows[0]?.focusBalance).toBe(3);

    const retry = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(retry.focusEarned).toBe(0);
  });

  test('hard quest earns +1 focus when under cap', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Hard focus quest',
      difficulty: 'hard',
      skillCodes: ['resolve'],
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(reward.focusEarned).toBe(1);
  });

  test('easy quest earns no focus', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Easy quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    const reward = await caller.tasks.complete({ taskId: created.id, timezone });
    expect(reward.focusEarned).toBe(0);

    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows).toHaveLength(0);
  });
});
