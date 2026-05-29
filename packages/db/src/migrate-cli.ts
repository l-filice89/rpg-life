import { runMigrations } from './migrate';

await runMigrations();
console.log('Database migrations applied');
