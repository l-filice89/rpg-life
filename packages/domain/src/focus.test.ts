import { describe, expect, test } from 'bun:test';
import { canSpendFocus, computeFocusCap, computeFocusEarn } from './focus';

describe('computeFocusCap', () => {
  test('returns 3 at hero level 0', () => {
    expect(computeFocusCap(0)).toBe(3);
  });

  test('returns 5 at hero level 6', () => {
    expect(computeFocusCap(6)).toBe(5);
  });

  test('returns 6 at hero level 10', () => {
    expect(computeFocusCap(10)).toBe(6);
  });
});

describe('computeFocusEarn', () => {
  test('medium completion earns +1 when under cap', () => {
    expect(computeFocusEarn('medium', 1, 3)).toEqual({
      earned: 1,
      capped: false,
    });
  });

  test('hard completion earns +1 when under cap', () => {
    expect(computeFocusEarn('hard', 0, 3)).toEqual({
      earned: 1,
      capped: false,
    });
  });

  test('trivial completion earns 0', () => {
    expect(computeFocusEarn('trivial', 0, 3)).toEqual({
      earned: 0,
      capped: false,
    });
  });

  test('easy completion earns 0', () => {
    expect(computeFocusEarn('easy', 0, 3)).toEqual({
      earned: 0,
      capped: false,
    });
  });

  test('earn blocked at cap for medium', () => {
    expect(computeFocusEarn('medium', 3, 3)).toEqual({
      earned: 0,
      capped: true,
    });
  });
});

describe('canSpendFocus', () => {
  test('returns true when balance meets default cost', () => {
    expect(canSpendFocus(1)).toBe(true);
  });

  test('returns false when balance below cost', () => {
    expect(canSpendFocus(0)).toBe(false);
  });
});
