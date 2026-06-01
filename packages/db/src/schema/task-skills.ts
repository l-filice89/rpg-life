import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { skills } from './skills';
import { tasks } from './tasks';

export const taskSkills = sqliteTable(
  'task_skills',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    skillCode: text('skill_code')
      .notNull()
      .references(() => skills.code),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.skillCode] }),
    index('idx_task_skills_skill').on(table.skillCode),
  ],
);
