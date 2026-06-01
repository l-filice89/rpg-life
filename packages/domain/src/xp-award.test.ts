import { describe, expect, test } from 'bun:test';
import { computeXpAward } from './xp-award';

describe('computeXpAward', () => {
  test('returns floor of base * multiplier with minimum 1', () => {
    expect(computeXpAward('medium', 1)).toBe(25);
    expect(computeXpAward('medium', 0.95)).toBe(23);
  });

  test('never returns less than 1 XP', () => {
    expect(computeXpAward('trivial', 0.5)).toBe(2);
    expect(computeXpAward('trivial', 0.01)).toBe(1);
  });
});
