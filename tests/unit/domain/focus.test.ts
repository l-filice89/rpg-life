import { describe, expect, test } from 'bun:test';
import { focusCap, canSpendFocus } from '../../../packages/domain/src/focus';

describe('Focus rules (ATDD — SC2 domain coverage)', () => {
  test.skip('[P0] focus cap is 3 + floor(heroLevel / 3)', () => {
    expect(focusCap(0)).toBe(3);
    expect(focusCap(3)).toBe(4);
    expect(focusCap(6)).toBe(5);
  });

  test.skip('[P0] cannot spend Focus when balance is zero', () => {
    expect(canSpendFocus(0)).toBe(false);
    expect(canSpendFocus(1)).toBe(true);
  });
});
