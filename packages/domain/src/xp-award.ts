import { BASE_XP } from './constants';
import type { Difficulty } from './types';

export function computeXpAward(
  difficulty: Difficulty,
  freshnessMultiplier: number,
): number {
  const base = BASE_XP[difficulty];
  return Math.max(1, Math.floor(base * freshnessMultiplier));
}
