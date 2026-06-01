import { z } from 'zod';
import type { SkillCode } from './skill-codes';

function isValidIanaTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export const CompleteTaskSchema = z.object({
  taskId: z.string().uuid(),
  timezone: z.string().min(1).refine(isValidIanaTimezone, {
    message: 'Invalid timezone',
  }),
});

export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;

export type RewardPayload = {
  xpAward: number;
  xpPerSkill: Record<SkillCode, number>;
  focusEarned: number;
  heroLevelBefore: number;
  heroLevelAfter: number;
  leveledUp: boolean;
  freshness?: {
    multiplier: number;
    reason: 'undated_age' | 'overdue';
    daysApplied: number;
    baseXp: number;
    finalXp: number;
  };
};
