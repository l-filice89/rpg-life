import { db, runMigrations, runSeed } from '@rpg-life/db';
import app from './app';
import { env } from './lib/env';

await runMigrations();
console.log('Database migrations applied');
await runSeed(db);
console.log('Skills catalog seeded');

export default {
  port: Number(process.env.PORT ?? env.PORT_API),
  fetch: app.fetch,
};
