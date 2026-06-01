import type { Database } from './client';
import { seedSkills } from './seed/skills';

export async function runSeed(db: Database) {
  await seedSkills(db);
}

// CLI entry when run via `bun run db:seed`
if (import.meta.main) {
  const { db } = await import('./client');
  await runSeed(db);
  console.log('Skills catalog seeded');
}
