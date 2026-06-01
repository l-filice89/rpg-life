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

const validInput = {
  title: 'Finish portfolio draft',
  difficulty: 'medium' as const,
  skillCodes: ['craft', 'lore'] as ['craft', 'lore'],
  dueDate: '2026-06-15',
};

async function expectTrpcErrorCode(
  promise: Promise<unknown>,
  code: 'UNAUTHORIZED' | 'BAD_REQUEST',
) {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe('tasks.create', () => {
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
    await expectTrpcErrorCode(caller.tasks.create(validInput), 'UNAUTHORIZED');
  });

  test('rejects empty title after trim', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expectTrpcErrorCode(
      caller.tasks.create({
        ...validInput,
        title: '   ',
        skillCodes: ['concentration'],
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

    await expectTrpcErrorCode(
      caller.tasks.create({
        title: 'A quest',
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

    await expectTrpcErrorCode(
      caller.tasks.create({
        title: 'A quest',
        difficulty: 'easy',
        skillCodes: ['concentration', 'vitality', 'lore', 'craft'],
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

    await expectTrpcErrorCode(
      caller.tasks.create({
        title: 'A quest',
        difficulty: 'easy',
        skillCodes: ['concentration', 'concentration'],
      }),
      'BAD_REQUEST',
    );
  });

  test('rejects malformed dueDate', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expectTrpcErrorCode(
      caller.tasks.create({
        title: 'A quest',
        difficulty: 'easy',
        skillCodes: ['vitality'],
        dueDate: '06/15/2026',
      }),
      'BAD_REQUEST',
    );
  });

  test('persists undated quest when dueDate omitted', async () => {
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

    expect(created.dueDate).toBeNull();

    const rows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(rows[0]?.dueDate).toBeNull();
  });

  test('persists task and skills for authenticated owner', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const created = await caller.tasks.create(validInput);

    expect(created).toMatchObject({
      title: validInput.title,
      difficulty: validInput.difficulty,
      dueDate: validInput.dueDate,
      skillCodes: ['lore', 'craft'],
    });
    expect(created.id).toBeTruthy();

    const rows = await testDb.select().from(tasks).where(eq(tasks.id, created.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ownerId).toBe(userId);
    expect(rows[0]?.status).toBe('open');
    expect(rows[0]?.deletedAt).toBeNull();

    const skillRows = await testDb
      .select()
      .from(taskSkills)
      .where(eq(taskSkills.taskId, created.id));
    expect(skillRows).toHaveLength(2);
  });

  test('created task appears only in owner list', async () => {
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

    await callerA.tasks.create({
      title: 'User A quest',
      difficulty: 'easy',
      skillCodes: ['resolve'],
    });

    const listA = await callerA.tasks.list();
    const listB = await callerB.tasks.list();

    expect(listA).toHaveLength(1);
    expect(listA[0]?.title).toBe('User A quest');
    expect(listB).toHaveLength(0);
  });
});
