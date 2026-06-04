import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  SKILL_CATALOG,
  type SkillCode,
  type TaskCreateInput,
  type TaskUpdateInput,
} from '@rpg-life/validators';
import type { Database } from '../client';
import { taskSkills } from '../schema/task-skills';
import { tasks } from '../schema/tasks';

const skillSortOrder = new Map(SKILL_CATALOG.map((skill) => [skill.code, skill.sortOrder]));

export type TaskMutationErrorCode = 'NOT_FOUND' | 'BAD_REQUEST';

export class TaskMutationError extends Error {
  readonly code: TaskMutationErrorCode;

  constructor(code: TaskMutationErrorCode, message: string) {
    super(message);
    this.name = 'TaskMutationError';
    this.code = code;
  }
}

function isOverdueUtc(dueDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) {
    return false;
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dueUtc < todayUtc;
}

async function getOpenTaskForOwner(db: Database, ownerId: string, taskId: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.ownerId, ownerId), isNull(tasks.deletedAt)))
    .limit(1);

  const task = rows[0];
  if (!task) {
    throw new TaskMutationError('NOT_FOUND', 'Quest not found');
  }

  if (task.status !== 'open') {
    throw new TaskMutationError('BAD_REQUEST', 'Completed quests cannot be edited');
  }

  return task;
}

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

export async function createTaskForOwner(
  db: Database,
  ownerId: string,
  input: TaskCreateInput,
): Promise<TaskListItem> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const dueDate = input.dueDate ?? null;

  await db.transaction(async (tx) => {
    await tx.insert(tasks).values({
      id,
      ownerId,
      title: input.title,
      difficulty: input.difficulty,
      dueDate,
      status: 'open',
      deletedAt: null,
      createdAt: now,
      modifiedAt: now,
    });

    for (const skillCode of input.skillCodes) {
      await tx.insert(taskSkills).values({
        taskId: id,
        skillCode,
      });
    }
  });

  return {
    id,
    title: input.title,
    difficulty: input.difficulty,
    dueDate,
    skillCodes: sortSkillCodes([...input.skillCodes]),
    createdAt: now,
  };
}

export async function updateTaskForOwner(
  db: Database,
  ownerId: string,
  input: TaskUpdateInput,
): Promise<TaskListItem> {
  const existing = await getOpenTaskForOwner(db, ownerId, input.id);
  const dueDate = input.dueDate ?? null;

  if (existing.dueDate === null && dueDate !== null) {
    throw new TaskMutationError(
      'BAD_REQUEST',
      'Adding a due date to an undated quest requires Focus. Use the schedule action.',
    );
  }

  if (
    existing.dueDate &&
    isOverdueUtc(existing.dueDate) &&
    dueDate !== existing.dueDate
  ) {
    throw new TaskMutationError(
      'BAD_REQUEST',
      'Rescheduling an overdue quest requires Focus. Use the reschedule action.',
    );
  }

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({
        title: input.title,
        difficulty: input.difficulty,
        dueDate,
        modifiedAt: now,
      })
      .where(eq(tasks.id, input.id));

    await tx.delete(taskSkills).where(eq(taskSkills.taskId, input.id));

    for (const skillCode of input.skillCodes) {
      await tx.insert(taskSkills).values({
        taskId: input.id,
        skillCode,
      });
    }
  });

  return {
    id: input.id,
    title: input.title,
    difficulty: input.difficulty,
    dueDate,
    skillCodes: sortSkillCodes([...input.skillCodes]),
    createdAt: existing.createdAt,
  };
}

export async function softDeleteTaskForOwner(
  db: Database,
  ownerId: string,
  taskId: string,
): Promise<{ id: string }> {
  const existing = await getOpenTaskForOwner(db, ownerId, taskId);

  if (existing.dueDate && isOverdueUtc(existing.dueDate)) {
    throw new TaskMutationError(
      'BAD_REQUEST',
      'Deleting an overdue quest requires Focus. Use the delete with Focus action.',
    );
  }

  const now = new Date().toISOString();

  await db
    .update(tasks)
    .set({
      deletedAt: now,
      modifiedAt: now,
    })
    .where(eq(tasks.id, taskId));

  return { id: taskId };
}
