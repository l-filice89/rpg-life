import { describe, expect, test } from 'bun:test';
import { splitXpAcrossSkills } from './xp-split';

describe('splitXpAcrossSkills', () => {
  test('splits 25 XP across 2 skills as 12 each (remainder dropped)', () => {
    expect(splitXpAcrossSkills(25, ['concentration', 'lore'])).toEqual({
      concentration: 12,
      lore: 12,
    });
  });

  test('assigns full amount to single skill', () => {
    expect(splitXpAcrossSkills(25, ['craft'])).toEqual({
      craft: 25,
    });
  });

  test('throws when no skills provided', () => {
    expect(() => splitXpAcrossSkills(10, [])).toThrow(
      'At least one skill is required to split XP',
    );
  });
});
