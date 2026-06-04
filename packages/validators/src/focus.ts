import { z } from 'zod';

export const FocusSpendTypeSchema = z.enum([
  'reschedule_overdue',
  'delete_overdue',
  'add_due_date',
]);
export type FocusSpendType = z.infer<typeof FocusSpendTypeSchema>;

const DueDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Discriminated on `type` so newDueDate is required exactly for the actions
// that need it (reschedule + add) and absent for delete.
export const FocusSpendSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('reschedule_overdue'),
    taskId: z.string().uuid(),
    newDueDate: DueDateSchema,
  }),
  z.object({
    type: z.literal('add_due_date'),
    taskId: z.string().uuid(),
    newDueDate: DueDateSchema,
  }),
  z.object({
    type: z.literal('delete_overdue'),
    taskId: z.string().uuid(),
  }),
]);

export type FocusSpendInput = z.infer<typeof FocusSpendSchema>;
