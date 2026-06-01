import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { skills } from './skills';

export const userSkills = sqliteTable(
  'user_skills',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillCode: text('skill_code')
      .notNull()
      .references(() => skills.code),
    xp: integer('xp').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.skillCode] }),
    index('idx_user_skills_user').on(table.userId),
    check('user_skills_xp_non_negative', sql`${table.xp} >= 0`),
  ],
);
