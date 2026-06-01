import { z } from 'zod';
import { SkillCodeSchema } from './skill-codes';

export const TaskDifficultySchema = z.enum(['trivial', 'easy', 'medium', 'hard']);

export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  difficulty: TaskDifficultySchema,
  skillCodes: z
    .array(SkillCodeSchema)
    .min(1)
    .max(3)
    .refine((codes) => new Set(codes).size === codes.length, {
      message: 'Skill codes must be unique',
    }),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = TaskCreateSchema.extend({
  id: z.string().uuid(),
});

export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

export const TaskDeleteSchema = z.object({
  id: z.string().uuid(),
});

export type TaskDeleteInput = z.infer<typeof TaskDeleteSchema>;
