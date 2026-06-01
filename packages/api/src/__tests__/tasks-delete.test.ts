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

describe('tasks.delete', () => {
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
    await expectTrpcErrorCode(caller.tasks.delete({ id: crypto.randomUUID() }), 'UNAUTHORIZED');
  });

  test('returns NOT_FOUND for unknown task id', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expectTrpcErrorCode(caller.tasks.delete({ id: crypto.randomUUID() }), 'NOT_FOUND');
  });

  test('returns NOT_FOUND when deleting another user task', async () => {
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
      dueDate: '2026-12-01',
    });

    await expectTrpcErrorCode(callerB.tasks.delete({ id: created.id }), 'NOT_FOUND');
  });

  test('soft-deletes non-overdue quest and excludes from list', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Future quest',
      difficulty: 'easy',
      skillCodes: ['vitality'],
      dueDate: '2026-12-01',
    });

    const result = await caller.tasks.delete({ id: created.id });
    expect(result).toEqual({ id: created.id });

    const rows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(rows[0]?.deletedAt).not.toBeNull();

    const list = await caller.tasks.list();
    expect(list).toHaveLength(0);
  });

  test('soft-deletes undated quest', async () => {
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
      skillCodes: ['craft'],
    });

    await caller.tasks.delete({ id: created.id });

    const list = await caller.tasks.list();
    expect(list).toHaveLength(0);
  });

  test('returns BAD_REQUEST for overdue quest delete', async () => {
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

    await expectTrpcErrorCode(caller.tasks.delete({ id: created.id }), 'BAD_REQUEST');

    const rows = await testDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, created.id));
    expect(rows[0]?.deletedAt).toBeNull();
  });

  test('returns BAD_REQUEST for completed quest delete', async () => {
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
      dueDate: '2026-12-01',
    });

    await testDb
      .update(tasks)
      .set({ status: 'completed', completedAt: new Date().toISOString() })
      .where(eq(tasks.id, created.id));

    await expectTrpcErrorCode(caller.tasks.delete({ id: created.id }), 'BAD_REQUEST');
  });

  test('returns NOT_FOUND when deleting already soft-deleted quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Once deleted',
      difficulty: 'easy',
      skillCodes: ['lore'],
      dueDate: '2026-12-01',
    });

    await caller.tasks.delete({ id: created.id });
    await expectTrpcErrorCode(caller.tasks.delete({ id: created.id }), 'NOT_FOUND');
  });
});
