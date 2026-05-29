import { Database } from 'bun:sqlite';

const db = new Database('./data/rpg-life.db');
const tables = db
  .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((row) => row.name as string);

console.log(tables.join(','));
