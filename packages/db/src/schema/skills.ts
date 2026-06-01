import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const skills = sqliteTable('skills', {
  code: text('code').primaryKey(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull(),
  iconKey: text('icon_key'),
});
