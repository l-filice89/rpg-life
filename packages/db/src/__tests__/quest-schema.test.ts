import { Database } from 'bun:sqlite';
import { describe, expect, test, beforeAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readFileSync, readdirSync } from 'node:fs';
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
} from '../index';
import { seedSkills } from '../seed/skills';

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

const migrationsDir = path.join(import.meta.dir, '../../migrations');

function applyMigrationFile(sqlite: Database, fileName: string) {
  const migrationPath = path.join(migrationsDir, fileName);
  const migrationSql = readFileSync(migrationPath, 'utf8');
  for (const statement of migrationSql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }
}

function applyMigrations(sqlite: Database) {
  applyMigrationFile(sqlite, '0000_init.sql');
  applyMigrationFile(sqlite, '0001_quest_schema.sql');
  applyMigrationFile(sqlite, '0002_task_focus_earned.sql');
}

describe('quest schema migration', () => {
  let sqlite: Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    applyMigrations(sqlite);
    testDb = drizzle(sqlite, { schema });
  });

  test('creates quest-related tables', () => {
    const tables = sqlite
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name);

    expect(tables).toContain('tasks');
    expect(tables).toContain('skills');
    expect(tables).toContain('task_skills');
    expect(tables).toContain('user_skills');
  });

  test('user_progress schema unchanged from Story 1.1', () => {
    expect(userProgress.userId.name).toBe('user_id');
    expect(userProgress.focusBalance.name).toBe('focus_balance');
    expect(userProgress.tutorialSeenAt.name).toBe('tutorial_seen_at');
    expect(userProgress.modifiedAt.name).toBe('modified_at');
  });

  test('seeds exactly seven skills idempotently', async () => {
    await seedSkills(testDb);
    const firstCount = sqlite.query<{ count: number }, []>('SELECT COUNT(*) as count FROM skills').get()!
      .count;
    expect(firstCount).toBe(7);

    await seedSkills(testDb);
    const secondCount = sqlite.query<{ count: number }, []>('SELECT COUNT(*) as count FROM skills').get()!
      .count;
    expect(secondCount).toBe(7);
  });

  test('rejects task with invalid owner_id', () => {
    const now = new Date().toISOString();
    expect(() =>
      sqlite.exec(`
        INSERT INTO tasks (id, owner_id, title, difficulty, created_at, modified_at)
        VALUES ('task-1', 'missing-user', 'Test quest', 'easy', '${now}', '${now}')
      `),
    ).toThrow();
  });

  test('rejects task_skills without parent task', () => {
    expect(() =>
      sqlite.exec(`
        INSERT INTO task_skills (task_id, skill_code)
        VALUES ('missing-task', 'concentration')
      `),
    ).toThrow();
  });

  test('tasks table includes idempotency columns', () => {
    const columns = sqlite
      .query<{ name: string }, []>('PRAGMA table_info(tasks)')
      .all()
      .map((row) => row.name);

    expect(columns).toContain('completed_at');
    expect(columns).toContain('xp_awarded');
    expect(columns).toContain('focus_earned');
    expect(columns).toContain('freshness_multiplier');
    expect(columns).toContain('deleted_at');
  });
});

describe('migration files', () => {
  test('0001 runs after 0000_init only', () => {
    const sqlFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql') && !file.includes('lazy_epoch'))
      .sort();
    expect(sqlFiles).toEqual(['0000_init.sql', '0001_quest_schema.sql', '0002_task_focus_earned.sql']);
  });
});
