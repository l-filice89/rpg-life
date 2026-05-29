import { runMigrations } from '@rpg-life/db/migrate';
import app from './app';
import { env } from './lib/env';

await runMigrations();
console.log('Database migrations applied');

export default {
  port: Number(process.env.PORT ?? env.PORT_API),
  fetch: app.fetch,
};
