import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import { tasks, userProgress, type Database } from '@rpg-life/db';
import { canSpendFocus, FOCUS_SPEND_COST } from '@rpg-life/domain';
import type { FocusSpendInput } from '@rpg-life/validators';

type FocusSpendErrorCode = 'NOT_FOUND' | 'BAD_REQUEST' | 'CONFLICT';

export class FocusSpendError extends Error {
  readonly code: FocusSpendErrorCode;

  constructor(code: FocusSpendErrorCode, message: string) {
    super(message);
    this.name = 'FocusSpendError';
    this.code = code;
  }
}

export type FocusSpendResult = {
  focusBalance: number;
  taskId: string;
};

function isOverdueUtc(dueDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return false;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dueUtc < todayUtc;
}

export async function spendFocusForOwner(
  db: Database,
  ownerId: string,
  input: FocusSpendInput,
): Promise<FocusSpendResult> {
  let result: FocusSpendResult | undefined;

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();

    // 1. Read focus balance within transaction
    const progressRows = await tx
      .select({ focusBalance: userProgress.focusBalance })
      .from(userProgress)
      .where(eq(userProgress.userId, ownerId))
      .limit(1);

    const balance = progressRows[0]?.focusBalance ?? 0;

    if (!canSpendFocus(balance)) {
      throw new FocusSpendError(
        'BAD_REQUEST',
        'Not enough Focus. Complete medium or hard quests to earn Focus.',
      );
    }

    // 2. Load task and verify ownership + open status
    const taskRows = await tx
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, input.taskId), eq(tasks.ownerId, ownerId), isNull(tasks.deletedAt)),
      )
      .limit(1);

    const task = taskRows[0];
    if (!task) {
      throw new FocusSpendError('NOT_FOUND', 'Quest not found');
    }

    if (task.status !== 'open') {
      throw new FocusSpendError('BAD_REQUEST', 'Completed quests cannot be modified');
    }

    // 3. Action-specific validation
    if (input.type === 'reschedule_overdue') {
      if (!task.dueDate || !isOverdueUtc(task.dueDate)) {
        throw new FocusSpendError('BAD_REQUEST', 'Quest is not overdue');
      }
      // New date must resolve the overdue state (today or later), not stay in the past.
      if (isOverdueUtc(input.newDueDate)) {
        throw new FocusSpendError('BAD_REQUEST', 'New due date must be today or later');
      }
    } else if (input.type === 'delete_overdue') {
      if (!task.dueDate || !isOverdueUtc(task.dueDate)) {
        throw new FocusSpendError('BAD_REQUEST', 'Quest is not overdue');
      }
    } else if (input.type === 'add_due_date') {
      if (task.dueDate !== null) {
        throw new FocusSpendError('BAD_REQUEST', 'Quest already has a due date');
      }
      // Don't let a freshly scheduled quest land in the past (instantly overdue).
      if (isOverdueUtc(input.newDueDate)) {
        throw new FocusSpendError('BAD_REQUEST', 'New due date must be today or later');
      }
    }

    // 4. Debit Focus with a SQL-side decrement so the write never relies on the
    //    stale read; WHERE balance >= cost guards against concurrent double-spend.
    const debited = await tx
      .update(userProgress)
      .set({
        focusBalance: sql`${userProgress.focusBalance} - ${FOCUS_SPEND_COST}`,
        modifiedAt: now,
      })
      .where(
        and(
          eq(userProgress.userId, ownerId),
          gte(userProgress.focusBalance, FOCUS_SPEND_COST),
        ),
      )
      .returning({ focusBalance: userProgress.focusBalance });

    if (debited.length === 0) {
      throw new FocusSpendError('CONFLICT', 'Focus balance changed, please try again');
    }

    const newBalance = debited[0]!.focusBalance;

    // 5. Apply task mutation
    if (input.type === 'reschedule_overdue' || input.type === 'add_due_date') {
      await tx
        .update(tasks)
        .set({ dueDate: input.newDueDate, modifiedAt: now })
        .where(eq(tasks.id, input.taskId));
    } else if (input.type === 'delete_overdue') {
      await tx
        .update(tasks)
        .set({ deletedAt: now, modifiedAt: now })
        .where(eq(tasks.id, input.taskId));
    }

    result = { focusBalance: newBalance, taskId: input.taskId };
  });

  if (!result) {
    throw new FocusSpendError('BAD_REQUEST', 'Focus spend failed unexpectedly');
  }

  return result;
}
