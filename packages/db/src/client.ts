import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { Database as SqliteDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as authSchema from './schema/auth';
import * as userProgressSchema from './schema/user-progress';

const schema = { ...authSchema, ...userProgressSchema };

function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl.startsWith('file:')) {
    return databaseUrl.slice('file:'.length);
  }

  return databaseUrl;
}

// Fallback resolves to the repo-root `data/` dir from apps/api (server cwd) and
// packages/db (tooling cwd). In normal runs DATABASE_URL is always set explicitly.
const databaseUrl = process.env.DATABASE_URL ?? 'file:../../data/rpg-life.db';
const databasePath = resolveDatabasePath(databaseUrl);

const dir = dirname(databasePath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new SqliteDatabase(databasePath);
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
