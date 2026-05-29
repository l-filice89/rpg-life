import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema/auth.ts', './src/schema/user-progress.ts'],
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    // Fallback resolves to the repo-root `data/` dir from packages/db (drizzle-kit cwd)
    // and apps/api (server cwd). In normal runs DATABASE_URL is always set explicitly.
    url: process.env.DATABASE_URL ?? 'file:../../data/rpg-life.db',
  },
});
