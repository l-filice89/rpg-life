import { describe, expect, test } from 'bun:test';
import { splitXpAcrossSkills } from '../../../packages/domain/src/xp';

describe('XP split (ATDD — SC2 domain coverage)', () => {
  test.skip('[P0] splits XP evenly across linked skills', () => {
    expect(splitXpAcrossSkills(30, 3)).toEqual([10, 10, 10]);
    expect(splitXpAcrossSkills(25, 2)).toEqual([12.5, 12.5]);
  });
});
