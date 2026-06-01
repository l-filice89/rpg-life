import { Database } from 'bun:sqlite';
import { describe, expect, test, beforeAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TRPCError } from '@trpc/server';
import { account, eq, session, user, userProgress, verification } from '@rpg-life/db';
import { appRouter } from '../root';

const schema = { user, session, account, verification, userProgress };

const mockUser = {
  id: 'user-test-1',
  email: 'ben@example.com',
  name: 'Ben',
};

const mockReq = new Request('http://localhost/api/trpc');

function createCaller(db: ReturnType<typeof drizzle<typeof schema>>, user: typeof mockUser | null) {
  return appRouter.createCaller({
    db: db as typeof import('@rpg-life/db').db,
    user,
    req: mockReq,
  });
}

describe('tutorial procedures', () => {
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(() => {
    const sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    const migrationPath = path.join(import.meta.dir, '../../../db/migrations/0000_init.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    for (const statement of migrationSql.split('--> statement-breakpoint')) {
      const sql = statement.trim();
      if (sql) {
        sqlite.exec(sql);
      }
    }
    testDb = drizzle(sqlite, { schema });
  });

  async function seedUser(userId = mockUser.id) {
    const now = new Date();
    await testDb.insert(user).values({
      id: userId,
      name: 'Ben',
      email: `ben-${userId}@example.com`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  test('getStatus requires authentication', async () => {
    const caller = createCaller(testDb, null);
    await expect(caller.tutorial.getStatus()).rejects.toThrow(TRPCError);
  });

  test('markSeen requires authentication', async () => {
    const caller = createCaller(testDb, null);
    await expect(caller.tutorial.markSeen()).rejects.toThrow(TRPCError);
  });

  test('getStatus returns seen false when tutorial_seen_at is null', async () => {
    const userId = crypto.randomUUID();
    await seedUser(userId);
    await testDb.insert(userProgress).values({
      userId,
      focusBalance: 0,
      tutorialSeenAt: null,
      modifiedAt: new Date().toISOString(),
    });

    const caller = createCaller(testDb, { ...mockUser, id: userId });
    await expect(caller.tutorial.getStatus()).resolves.toEqual({ seen: false });
  });

  test('getStatus returns seen false when user_progress row is missing', async () => {
    const userId = crypto.randomUUID();
    await seedUser(userId);

    const caller = createCaller(testDb, { ...mockUser, id: userId });
    await expect(caller.tutorial.getStatus()).resolves.toEqual({ seen: false });
  });

  test('markSeen sets tutorial_seen_at when row exists', async () => {
    const userId = crypto.randomUUID();
    await seedUser(userId);
    await testDb.insert(userProgress).values({
      userId,
      focusBalance: 0,
      tutorialSeenAt: null,
      modifiedAt: new Date().toISOString(),
    });

    const caller = createCaller(testDb, { ...mockUser, id: userId });
    await expect(caller.tutorial.markSeen()).resolves.toEqual({ seen: true });
    await expect(caller.tutorial.getStatus()).resolves.toEqual({ seen: true });

    const rows = await testDb.select().from(userProgress).where(eq(userProgress.userId, userId));
    expect(rows[0]?.tutorialSeenAt).not.toBeNull();
  });

  test('markSeen inserts user_progress when row is missing', async () => {
    const userId = crypto.randomUUID();
    await seedUser(userId);

    const caller = createCaller(testDb, { ...mockUser, id: userId });
    await expect(caller.tutorial.markSeen()).resolves.toEqual({ seen: true });
    await expect(caller.tutorial.getStatus()).resolves.toEqual({ seen: true });
  });

  test('markSeen is idempotent when already seen', async () => {
    const userId = crypto.randomUUID();
    await seedUser(userId);
    const seenAt = '2026-01-01T00:00:00.000Z';
    await testDb.insert(userProgress).values({
      userId,
      focusBalance: 0,
      tutorialSeenAt: seenAt,
      modifiedAt: seenAt,
    });

    const caller = createCaller(testDb, { ...mockUser, id: userId });
    await expect(caller.tutorial.markSeen()).resolves.toEqual({ seen: true });

    const rows = await testDb.select().from(userProgress).where(eq(userProgress.userId, userId));
    expect(rows[0]?.tutorialSeenAt).toBe(seenAt);
  });
});
