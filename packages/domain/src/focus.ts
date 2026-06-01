import { FOCUS_SPEND_COST } from './constants';
import type { Difficulty, FocusEarnResult } from './types';

export { FOCUS_SPEND_COST };

export function computeFocusCap(heroLevel: number): number {
  return 3 + Math.floor(heroLevel / 3);
}

export function computeFocusEarn(
  difficulty: Difficulty,
  currentBalance: number,
  cap: number,
): FocusEarnResult {
  const earnsFocus = difficulty === 'medium' || difficulty === 'hard';

  if (!earnsFocus || currentBalance >= cap) {
    return {
      earned: 0,
      capped: earnsFocus && currentBalance >= cap,
    };
  }

  return {
    earned: 1,
    capped: false,
  };
}

export function canSpendFocus(balance: number, cost: number = FOCUS_SPEND_COST): boolean {
  return balance >= cost;
}
