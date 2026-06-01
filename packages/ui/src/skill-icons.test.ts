import { describe, expect, test } from 'bun:test';
import { SKILL_CODES } from '@rpg-life/validators';
import { getSkillIcon } from './skill-icons';

describe('getSkillIcon', () => {
  test('resolves all seven skill codes', () => {
    for (const code of SKILL_CODES) {
      expect(getSkillIcon(code)).toBeDefined();
    }
  });

  test('throws for unknown skill code', () => {
    expect(() => getSkillIcon('unknown' as never)).toThrow('Unknown skill code');
  });
});
