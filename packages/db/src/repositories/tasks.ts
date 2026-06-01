import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';
import type { Database } from '../client';
import { taskSkills } from '../schema/task-skills';
import { tasks } from '../schema/tasks';

const skillSortOrder = new Map(SKILL_CATALOG.map((skill) => [skill.code, skill.sortOrder]));

export type TaskListItem = {
  id: string;
  title: string;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  dueDate: string | null;
  skillCodes: SkillCode[];
  createdAt: string;
};

function sortSkillCodes(codes: SkillCode[]): SkillCode[] {
  return [...codes].sort(
    (a, b) => (skillSortOrder.get(a) ?? 0) - (skillSortOrder.get(b) ?? 0),
  );
}

export async function listOpenTasksByOwner(
  db: Database,
  ownerId: string,
): Promise<TaskListItem[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      difficulty: tasks.difficulty,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(
      and(eq(tasks.ownerId, ownerId), eq(tasks.status, 'open'), isNull(tasks.deletedAt)),
    )
    .orderBy(sql`${tasks.dueDate} is null`, asc(tasks.dueDate));

  if (rows.length === 0) {
    return [];
  }

  const taskIds = rows.map((row) => row.id);
  const skillRows = await db
    .select({
      taskId: taskSkills.taskId,
      skillCode: taskSkills.skillCode,
    })
    .from(taskSkills)
    .where(inArray(taskSkills.taskId, taskIds));

  const skillsByTaskId = new Map<string, SkillCode[]>();
  for (const row of skillRows) {
    const existing = skillsByTaskId.get(row.taskId) ?? [];
    existing.push(row.skillCode as SkillCode);
    skillsByTaskId.set(row.taskId, existing);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty as TaskListItem['difficulty'],
    dueDate: row.dueDate,
    skillCodes: sortSkillCodes(skillsByTaskId.get(row.id) ?? []),
    createdAt: row.createdAt,
  }));
}
