import { describe, test, expect, beforeAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { account, session, user, userProgress, verification } from '@rpg-life/db';
import { provisionUserProgress } from '../provision-user-progress';

const schema = { user, session, account, verification, userProgress };

describe('provisionUserProgress', () => {
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(() => {
    const sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    const migrationPath = path.join(
      import.meta.dir,
      '../../../db/migrations/0000_init.sql',
    );
    const migrationSql = readFileSync(migrationPath, 'utf8');
    for (const statement of migrationSql.split('--> statement-breakpoint')) {
      const sql = statement.trim();
      if (sql) {
        sqlite.exec(sql);
      }
    }
    testDb = drizzle(sqlite, { schema });
  });

  test('inserts user_progress row for new user', async () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    await testDb.insert(user).values({
      id: userId,
      name: 'Ben',
      email: `ben-${userId}@example.com`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await provisionUserProgress(userId, testDb as typeof import('@rpg-life/db').db);

    const rows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.focusBalance).toBe(0);
    expect(rows[0]?.tutorialSeenAt).toBeNull();
    expect(rows[0]?.modifiedAt).toBeTruthy();
  });

  test('is idempotent when row already exists', async () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    await testDb.insert(user).values({
      id: userId,
      name: 'Ben',
      email: `ben-dup-${userId}@example.com`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await provisionUserProgress(userId, testDb as typeof import('@rpg-life/db').db);
    await provisionUserProgress(userId, testDb as typeof import('@rpg-life/db').db);

    const rows = await testDb
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    expect(rows).toHaveLength(1);
  });
});
