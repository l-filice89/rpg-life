import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: text('due_date'),
    difficulty: text('difficulty').notNull(),
    status: text('status').notNull().default('open'),
    completedAt: text('completed_at'),
    xpAwarded: integer('xp_awarded'),
    freshnessMultiplier: real('freshness_multiplier'),
    focusEarned: integer('focus_earned'),
    createdAt: text('created_at').notNull(),
    modifiedAt: text('modified_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_tasks_owner_status').on(table.ownerId, table.status),
    index('idx_tasks_owner_due').on(table.ownerId, table.dueDate),
  ],
);
