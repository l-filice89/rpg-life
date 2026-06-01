export type { SkillCode } from '@rpg-life/validators';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard';

/** Calendar date in `YYYY-MM-DD` form (local timezone of the user). */
export type LocalDate = string;

export type FreshnessReason = 'on_time' | 'overdue' | 'undated_age';

export type FreshnessInput = {
  dueDate: LocalDate | null;
  createdLocalDate: LocalDate;
  completedLocalDate: LocalDate;
};

export type FreshnessResult = {
  multiplier: number;
  reason: FreshnessReason;
  daysApplied: number;
};

export type FocusEarnResult = {
  earned: number;
  capped: boolean;
};
