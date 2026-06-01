import { Database } from 'bun:sqlite';
import { describe, expect, test, beforeAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
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
};

const mockReq = new Request('http://localhost/api/trpc');
const migrationsDir = path.join(import.meta.dir, '../../../db/migrations');

function applyMigrationFile(sqlite: Database, fileName: string) {
  const migrationSql = readFileSync(path.join(migrationsDir, fileName), 'utf8');
  for (const statement of migrationSql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }
}

function createCaller(db: ReturnType<typeof drizzle<typeof schema>>, authUser: { id: string; email: string; name: string } | null) {
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
  code: 'UNAUTHORIZED' | 'BAD_REQUEST' | 'NOT_FOUND',
) {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe('tasks.update', () => {
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
      caller.tasks.update({
        id: crypto.randomUUID(),
        title: 'Updated',
        difficulty: 'easy',
        skillCodes: ['concentration'],
      }),
      'UNAUTHORIZED',
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
      caller.tasks.update({
        id: crypto.randomUUID(),
        title: 'Updated',
        difficulty: 'easy',
        skillCodes: ['concentration'],
      }),
      'NOT_FOUND',
    );
  });

  test('returns NOT_FOUND when updating another user task', async () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    await seedUser(testDb, userA, 'a');
    await seedUser(testDb, userB, 'b');

    const callerA = createCaller(testDb, {
      id: userA,
      email: `ben-a@example.com`,
      name: 'Ben',
    });
    const callerB = createCaller(testDb, {
      id: userB,
      email: `ben-b@example.com`,
      name: 'Ben',
    });

    const created = await callerA.tasks.create({
      title: 'User A quest',
      difficulty: 'easy',
      skillCodes: ['resolve'],
    });

    await expectTrpcErrorCode(
      callerB.tasks.update({
        id: created.id,
        title: 'Stolen update',
        difficulty: 'hard',
        skillCodes: ['craft'],
      }),
      'NOT_FOUND',
    );
  });

  test('returns BAD_REQUEST for completed task', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Done quest',
      difficulty: 'easy',
      skillCodes: ['vitality'],
    });

    await testDb
      .update(tasks)
      .set({ status: 'completed', completedAt: new Date().toISOString() })
      .where(eq(tasks.id, created.id));

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Try edit',
        difficulty: 'easy',
        skillCodes: ['vitality'],
      }),
      'BAD_REQUEST',
    );
  });

  test('returns NOT_FOUND for soft-deleted task', async () => {
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
      skillCodes: ['order'],
      dueDate: '2026-12-01',
    });

    await caller.tasks.delete({ id: created.id });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'After delete',
        difficulty: 'easy',
        skillCodes: ['order'],
      }),
      'NOT_FOUND',
    );
  });

  test('rejects adding due date to previously undated quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Undated quest',
      difficulty: 'easy',
      skillCodes: ['concentration'],
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Undated quest',
        difficulty: 'easy',
        skillCodes: ['concentration'],
        dueDate: '2026-08-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects empty title', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Valid quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2026-09-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: '   ',
        difficulty: 'easy',
        skillCodes: ['craft'],
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects zero skills', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Skill quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2026-09-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Skill quest',
        difficulty: 'easy',
        skillCodes: [],
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects more than three skills', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Skill quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2026-09-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Skill quest',
        difficulty: 'easy',
        skillCodes: ['concentration', 'vitality', 'lore', 'craft'],
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects clearing due date on overdue quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue quest',
      difficulty: 'easy',
      skillCodes: ['order'],
      dueDate: '2020-01-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Overdue quest',
        difficulty: 'easy',
        skillCodes: ['order'],
        dueDate: null,
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects rescheduling overdue quest without Focus', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue quest',
      difficulty: 'easy',
      skillCodes: ['order'],
      dueDate: '2020-01-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Overdue quest',
        difficulty: 'easy',
        skillCodes: ['order'],
        dueDate: '2026-12-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects duplicate skill codes', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Skill quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2026-09-01',
    });

    await expectTrpcErrorCode(
      caller.tasks.update({
        id: created.id,
        title: 'Skill quest',
        difficulty: 'easy',
        skillCodes: ['craft', 'craft'],
      }),
      'BAD_REQUEST',
    );
  });

  test('persists updated fields and replaces task_skills', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Original title',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2026-09-01',
    });

    const updated = await caller.tasks.update({
      id: created.id,
      title: 'Revised title',
      difficulty: 'hard',
      skillCodes: ['lore', 'presence'],
      dueDate: '2026-10-01',
    });

    expect(updated).toMatchObject({
      id: created.id,
      title: 'Revised title',
      difficulty: 'hard',
      dueDate: '2026-10-01',
      skillCodes: ['lore', 'presence'],
    });

    const skillRows = await testDb
      .select()
      .from(taskSkills)
      .where(eq(taskSkills.taskId, created.id));
    expect(skillRows).toHaveLength(2);
    expect(skillRows.map((row) => row.skillCode).sort()).toEqual(['lore', 'presence']);
  });
});
