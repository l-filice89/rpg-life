import { Database } from 'bun:sqlite';
import { describe, expect, test, beforeAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
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

async function insertTask(
  db: ReturnType<typeof drizzle<typeof schema>>,
  values: {
    id: string;
    ownerId: string;
    title: string;
    dueDate?: string | null;
    status?: string;
    deletedAt?: string | null;
    skillCodes?: string[];
  },
) {
  const now = new Date().toISOString();
  await db.insert(tasks).values({
    id: values.id,
    ownerId: values.ownerId,
    title: values.title,
    difficulty: 'easy',
    status: values.status ?? 'open',
    dueDate: values.dueDate ?? null,
    deletedAt: values.deletedAt ?? null,
    createdAt: now,
    modifiedAt: now,
  });

  for (const skillCode of values.skillCodes ?? []) {
    await db.insert(taskSkills).values({
      taskId: values.id,
      skillCode,
    });
  }
}

describe('tasks.list', () => {
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
    await expect(caller.tasks.list()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('returns only tasks owned by the authenticated user', async () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    await seedUser(testDb, userA);
    await seedUser(testDb, userB);

    await insertTask(testDb, { id: 'task-a', ownerId: userA, title: 'User A quest' });
    await insertTask(testDb, { id: 'task-b', ownerId: userB, title: 'User B quest' });

    const caller = createCaller(testDb, { id: userA, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('User A quest');
  });

  test('excludes soft-deleted tasks', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    await insertTask(testDb, { id: 'task-open-deleted-test', ownerId: userId, title: 'Visible quest' });
    await insertTask(testDb, {
      id: 'task-deleted',
      ownerId: userId,
      title: 'Deleted quest',
      deletedAt: new Date().toISOString(),
    });

    const caller = createCaller(testDb, { id: userId, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result.map((task) => task.title)).toEqual(['Visible quest']);
  });

  test('excludes completed tasks', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    await insertTask(testDb, { id: 'task-open-completed-test', ownerId: userId, title: 'Open quest' });
    await insertTask(testDb, {
      id: 'task-done-completed-test',
      ownerId: userId,
      title: 'Completed quest',
      status: 'completed',
    });

    const caller = createCaller(testDb, { id: userId, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result.map((task) => task.title)).toEqual(['Open quest']);
  });

  test('excludes cancelled tasks', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    await insertTask(testDb, { id: 'task-open-cancelled-test', ownerId: userId, title: 'Open quest' });
    await insertTask(testDb, {
      id: 'task-cancelled-test',
      ownerId: userId,
      title: 'Cancelled quest',
      status: 'cancelled',
    });

    const caller = createCaller(testDb, { id: userId, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result.map((task) => task.title)).toEqual(['Open quest']);
  });

  test('sorts dated tasks ascending with undated tasks last', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    await insertTask(testDb, {
      id: 'task-undated',
      ownerId: userId,
      title: 'Undated quest',
      dueDate: null,
    });
    await insertTask(testDb, {
      id: 'task-later',
      ownerId: userId,
      title: 'Later quest',
      dueDate: '2026-06-10',
    });
    await insertTask(testDb, {
      id: 'task-sooner',
      ownerId: userId,
      title: 'Sooner quest',
      dueDate: '2026-06-01',
    });

    const caller = createCaller(testDb, { id: userId, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result.map((task) => task.title)).toEqual([
      'Sooner quest',
      'Later quest',
      'Undated quest',
    ]);
  });

  test('returns skillCodes sorted by catalog order', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    await insertTask(testDb, {
      id: 'task-skills',
      ownerId: userId,
      title: 'Skill quest',
      skillCodes: ['craft', 'concentration', 'lore'],
    });

    const caller = createCaller(testDb, { id: userId, email: 'a@test.com', name: 'A' });
    const result = await caller.tasks.list();

    expect(result[0]?.skillCodes).toEqual(['concentration', 'lore', 'craft']);
  });
});
