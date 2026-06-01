import type { Difficulty } from './types';

export const BASE_XP: Record<Difficulty, number> = {
  trivial: 5,
  easy: 10,
  medium: 25,
  hard: 50,
};

export const A_SKILL = 25;
export const A_USER = 50;
export const MIN_FRESHNESS = 0.5;
export const UNDATED_DECAY_PER_DAY = 0.02;
export const OVERDUE_DECAY_PER_DAY = 0.05;
export const MAX_SKILLS_PER_TASK = 3;
export const FOCUS_SPEND_COST = 1;
