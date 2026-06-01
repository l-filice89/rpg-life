import { describe, expect, test } from 'bun:test';
import {
  computeHeroLevel,
  computeSkillLevel,
  heroXpProgress,
  skillXpProgress,
} from './levels';

describe('computeHeroLevel', () => {
  test('returns 0 at 0 XP', () => {
    expect(computeHeroLevel(0)).toBe(0);
  });

  test('returns 4 at 800 XP', () => {
    expect(computeHeroLevel(800)).toBe(4);
  });
});

describe('computeSkillLevel', () => {
  test('returns 0 at 0 XP', () => {
    expect(computeSkillLevel(0)).toBe(0);
  });

  test('returns 4 at 400 XP (sqrt(400/25))', () => {
    expect(computeSkillLevel(400)).toBe(4);
  });
});

describe('heroXpProgress', () => {
  test('returns 0 at exact level boundary', () => {
    expect(heroXpProgress(800, 4)).toBe(0);
  });

  test('returns partial progress within level', () => {
    expect(heroXpProgress(850, 4)).toBeCloseTo(50 / 450, 5);
  });
});

describe('skillXpProgress', () => {
  test('returns partial progress within skill level', () => {
    expect(skillXpProgress(30, 1)).toBeCloseTo(5 / 75, 5);
  });
});
