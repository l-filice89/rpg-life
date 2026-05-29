import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './client';

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '../migrations');

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}
