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

async function seedUserProgress(
  db: ReturnType<typeof drizzle<typeof schema>>,
  userId: string,
  focusBalance: number,
) {
  await db.insert(userProgress).values({
    userId,
    focusBalance,
    modifiedAt: new Date().toISOString(),
  });
}

async function expectTrpcErrorCode(
  promise: Promise<unknown>,
  code: 'UNAUTHORIZED' | 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT',
) {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe('focus.spend', () => {
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
      caller.focus.spend({
        type: 'reschedule_overdue',
        taskId: crypto.randomUUID(),
        newDueDate: '2027-01-01',
      }),
      'UNAUTHORIZED',
    );
  });

  test('returns BAD_REQUEST when focus balance is zero', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    await seedUserProgress(testDb, userId, 0);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue quest',
      difficulty: 'easy',
      skillCodes: ['resolve'],
      dueDate: '2020-01-01',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'reschedule_overdue',
        taskId: created.id,
        newDueDate: '2027-01-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('returns NOT_FOUND for unknown task', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-notfound');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-focus-notfound@example.com`,
      name: 'Ben',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'reschedule_overdue',
        taskId: crypto.randomUUID(),
        newDueDate: '2027-01-01',
      }),
      'NOT_FOUND',
    );
  });

  test('returns NOT_FOUND when task belongs to another user', async () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    await seedUser(testDb, userA, 'a-focus');
    await seedUser(testDb, userB, 'b-focus');
    await seedUserProgress(testDb, userA, 1);
    await seedUserProgress(testDb, userB, 1);

    const callerA = createCaller(testDb, {
      id: userA,
      email: 'ben-a-focus@example.com',
      name: 'Ben',
    });
    const callerB = createCaller(testDb, {
      id: userB,
      email: 'ben-b-focus@example.com',
      name: 'Ben',
    });

    const created = await callerA.tasks.create({
      title: 'User A quest',
      difficulty: 'easy',
      skillCodes: ['lore'],
      dueDate: '2020-01-01',
    });

    await expectTrpcErrorCode(
      callerB.focus.spend({
        type: 'reschedule_overdue',
        taskId: created.id,
        newDueDate: '2027-01-01',
      }),
      'NOT_FOUND',
    );
  });

  test('reschedule_overdue: returns BAD_REQUEST when quest is not overdue', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-future');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-future@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Future quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
      dueDate: '2030-12-01',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'reschedule_overdue',
        taskId: created.id,
        newDueDate: '2031-01-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('delete_overdue: returns BAD_REQUEST when quest is not overdue', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-futuredel');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-futuredel@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Future quest del',
      difficulty: 'easy',
      skillCodes: ['concentration'],
      dueDate: '2030-12-01',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'delete_overdue',
        taskId: created.id,
      }),
      'BAD_REQUEST',
    );
  });

  test('add_due_date: returns BAD_REQUEST when quest already has a due date', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-hasdate');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-hasdate@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Dated quest',
      difficulty: 'easy',
      skillCodes: ['vitality'],
      dueDate: '2030-12-01',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'add_due_date',
        taskId: created.id,
        newDueDate: '2031-01-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('reschedule_overdue: debits 1 focus and updates due date', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-reschedule');
    await seedUserProgress(testDb, userId, 3);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-reschedule@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue to reschedule',
      difficulty: 'easy',
      skillCodes: ['resolve'],
      dueDate: '2020-01-01',
    });

    const result = await caller.focus.spend({
      type: 'reschedule_overdue',
      taskId: created.id,
      newDueDate: '2027-06-01',
    });

    expect(result.focusBalance).toBe(2);
    expect(result.taskId).toBe(created.id);

    const taskRows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(taskRows[0]?.dueDate).toBe('2027-06-01');
  });

  test('delete_overdue: debits 1 focus and soft-deletes quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-overdel');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-overdel@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue to delete',
      difficulty: 'easy',
      skillCodes: ['order'],
      dueDate: '2020-01-01',
    });

    const result = await caller.focus.spend({
      type: 'delete_overdue',
      taskId: created.id,
    });

    expect(result.focusBalance).toBe(1);
    expect(result.taskId).toBe(created.id);

    const taskRows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(taskRows[0]?.deletedAt).not.toBeNull();

    const list = await caller.tasks.list();
    expect(list.find((t) => t.id === created.id)).toBeUndefined();
  });

  test('add_due_date: debits 1 focus and adds due date to undated quest', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-adddate');
    await seedUserProgress(testDb, userId, 1);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-adddate@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Undated quest',
      difficulty: 'easy',
      skillCodes: ['presence'],
    });

    const result = await caller.focus.spend({
      type: 'add_due_date',
      taskId: created.id,
      newDueDate: '2027-09-01',
    });

    expect(result.focusBalance).toBe(0);
    expect(result.taskId).toBe(created.id);

    const list = await caller.tasks.list();
    const updated = list.find((t) => t.id === created.id);
    expect(updated?.dueDate).toBe('2027-09-01');
  });

  test('reschedule_overdue: rejects a new due date in the past', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-pastresched');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-pastresched@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Overdue quest',
      difficulty: 'easy',
      skillCodes: ['resolve'],
      dueDate: '2020-01-01',
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'reschedule_overdue',
        taskId: created.id,
        newDueDate: '2021-01-01',
      }),
      'BAD_REQUEST',
    );

    // Focus must not be debited when the new date is invalid.
    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows[0]?.focusBalance).toBe(2);
  });

  test('add_due_date: rejects a due date in the past', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-pastadd');
    await seedUserProgress(testDb, userId, 2);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-pastadd@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Undated quest',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    await expectTrpcErrorCode(
      caller.focus.spend({
        type: 'add_due_date',
        taskId: created.id,
        newDueDate: '2020-01-01',
      }),
      'BAD_REQUEST',
    );
  });

  test('concurrent double-spend: only one of two parallel spends succeeds (balance never goes negative)', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-race');
    await seedUserProgress(testDb, userId, 1);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-race@example.com',
      name: 'Ben',
    });

    const questA = await caller.tasks.create({
      title: 'Race A',
      difficulty: 'easy',
      skillCodes: ['resolve'],
      dueDate: '2020-01-01',
    });
    const questB = await caller.tasks.create({
      title: 'Race B',
      difficulty: 'easy',
      skillCodes: ['order'],
      dueDate: '2020-01-02',
    });

    const results = await Promise.allSettled([
      caller.focus.spend({ type: 'delete_overdue', taskId: questA.id }),
      caller.focus.spend({ type: 'delete_overdue', taskId: questB.id }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const progressRows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    expect(progressRows[0]?.focusBalance).toBe(0);
  });

  test('insufficient focus message mentions medium or hard quests', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId, 'focus-nofocus');
    await seedUserProgress(testDb, userId, 0);
    const caller = createCaller(testDb, {
      id: userId,
      email: 'ben-focus-nofocus@example.com',
      name: 'Ben',
    });

    const created = await caller.tasks.create({
      title: 'Undated no focus',
      difficulty: 'easy',
      skillCodes: ['craft'],
    });

    try {
      await caller.focus.spend({
        type: 'add_due_date',
        taskId: created.id,
        newDueDate: '2027-09-01',
      });
      throw new Error('Expected error');
    } catch (error) {
      expect(error).toMatchObject({ code: 'BAD_REQUEST' });
      expect((error as { message: string }).message).toMatch(/medium|hard/i);
    }
  });
});
