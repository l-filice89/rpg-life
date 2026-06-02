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

describe('profile.get', () => {
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
    await expect(caller.profile.get()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('returns defaults for new user with no xp or progress row', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expect(caller.profile.get()).resolves.toMatchObject({
      heroLevel: 0,
      heroXpProgress: 0,
      focusBalance: 0,
      focusCap: 3,
    });
  });

  test('computes hero level and progress from skill xp', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    await testDb.insert(userProgress).values({
      userId,
      focusBalance: 2,
      modifiedAt: new Date().toISOString(),
    });
    await testDb.insert(userSkills).values({
      userId,
      skillCode: 'concentration',
      xp: 800,
    });

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    await expect(caller.profile.get()).resolves.toMatchObject({
      heroLevel: 4,
      heroXpProgress: 0,
      focusBalance: 2,
      focusCap: 4,
    });
  });

  test('computes partial heroXpProgress within a level', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    await testDb.insert(userSkills).values({
      userId,
      skillCode: 'concentration',
      xp: 850,
    });

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const result = await caller.profile.get();
    expect(result.heroLevel).toBe(4);
    expect(result.heroXpProgress).toBeCloseTo(50 / 450, 5);
    expect(result.focusCap).toBe(4);
  });

  test('returns 7 skills all at xp 0 for new user', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const result = await caller.profile.get();
    expect(result.skills).toHaveLength(7);
    for (const skill of result.skills) {
      expect(skill.xp).toBe(0);
      expect(skill.level).toBe(0);
      expect(skill.xpProgress).toBe(0);
    }
  });

  test('skills ordered by sort_order', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const result = await caller.profile.get();
    expect(result.skills.map((s) => s.code)).toEqual([
      'concentration',
      'vitality',
      'lore',
      'presence',
      'order',
      'resolve',
      'craft',
    ]);
  });

  test('trained skill has non-zero xp; untrained skills remain zero', async () => {
    const userId = crypto.randomUUID();
    await seedUser(testDb, userId);
    await testDb.insert(userSkills).values({ userId, skillCode: 'lore', xp: 50 });

    const caller = createCaller(testDb, {
      id: userId,
      email: `ben-${userId}@example.com`,
      name: 'Ben',
    });

    const result = await caller.profile.get();
    const lore = result.skills.find((s) => s.code === 'lore')!;
    const others = result.skills.filter((s) => s.code !== 'lore');
    expect(lore.xp).toBe(50);
    expect(lore.level).toBe(1); // floor(sqrt(50/25)) = floor(1.414) = 1
    expect(lore.xpProgress).toBeCloseTo(25 / 75, 5); // (50-25)/(100-25)
    expect(others.every((s) => s.xp === 0 && s.level === 0)).toBe(true);
  });
});
