import { describe, expect, test } from 'bun:test';
import { TUTORIAL_SECTIONS } from './tutorial-content';

describe('TUTORIAL_SECTIONS', () => {
  test('covers all five required topics', () => {
    expect(TUTORIAL_SECTIONS).toHaveLength(5);
    expect(TUTORIAL_SECTIONS.map((s) => s.title)).toEqual([
      'Quests',
      'Skills',
      'Hero level',
      'Freshness',
      'Focus',
    ]);
  });

  test('each section has non-empty body copy', () => {
    for (const section of TUTORIAL_SECTIONS) {
      expect(section.body.length).toBeGreaterThan(0);
    }
  });
});
