import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const userProgress = sqliteTable(
  'user_progress',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    focusBalance: integer('focus_balance').notNull().default(0),
    tutorialSeenAt: text('tutorial_seen_at'),
    modifiedAt: text('modified_at').notNull(),
  },
  (table) => ({
    focusBalanceNonNegative: check('focus_balance_non_negative', sql`${table.focusBalance} >= 0`),
  }),
);
