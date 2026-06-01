import {
  MIN_FRESHNESS,
  OVERDUE_DECAY_PER_DAY,
  UNDATED_DECAY_PER_DAY,
} from './constants';
import { daysBetweenLocalDates } from './local-date';
import type { FreshnessInput, FreshnessResult } from './types';

export function computeFreshness(input: FreshnessInput): FreshnessResult {
  const { dueDate, createdLocalDate, completedLocalDate } = input;

  if (dueDate !== null) {
    const daysOverdue = daysBetweenLocalDates(dueDate, completedLocalDate);

    if (daysOverdue === 0) {
      return {
        multiplier: 1,
        reason: 'on_time',
        daysApplied: 0,
      };
    }

    const multiplier = Math.max(
      MIN_FRESHNESS,
      1 - OVERDUE_DECAY_PER_DAY * daysOverdue,
    );

    return {
      multiplier,
      reason: 'overdue',
      daysApplied: daysOverdue,
    };
  }

  const daysSinceCreation = daysBetweenLocalDates(
    createdLocalDate,
    completedLocalDate,
  );
  const multiplier = Math.max(
    MIN_FRESHNESS,
    1 - UNDATED_DECAY_PER_DAY * daysSinceCreation,
  );

  return {
    multiplier,
    reason: 'undated_age',
    daysApplied: daysSinceCreation,
  };
}
