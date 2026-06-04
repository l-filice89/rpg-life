import { describe, expect, test } from 'bun:test';
import type { ProfileSummary } from '@rpg-life/api';
import {
  hasCompletedQuestHistory,
  resolveQuestBoardEmptyVariant,
  resolveServerEmptyVariant,
} from './quest-board-empty-variant';

const emptyProfile: ProfileSummary = {
  heroLevel: 0,
  heroXpProgress: 0,
  focusBalance: 0,
  focusCap: 3,
  skills: [
    {
      code: 'vitality',
      displayName: 'Vitality',
      iconKey: null,
      xp: 0,
      level: 0,
      xpProgress: 0,
    },
  ],
};

const profileWithHistory: ProfileSummary = {
  ...emptyProfile,
  heroLevel: 1,
  skills: [{ ...emptyProfile.skills[0]!, xp: 10, level: 1, xpProgress: 0.5 }],
};

describe('hasCompletedQuestHistory', () => {
  test('false for brand-new user', () => {
    expect(hasCompletedQuestHistory(emptyProfile)).toBe(false);
  });

  test('true when any skill has XP', () => {
    expect(hasCompletedQuestHistory(profileWithHistory)).toBe(true);
  });
});

describe('resolveServerEmptyVariant', () => {
  test('null when open quests exist', () => {
    expect(resolveServerEmptyVariant(2, emptyProfile)).toBeNull();
  });

  test('first when zero open and no history', () => {
    expect(resolveServerEmptyVariant(0, emptyProfile)).toBe('first');
  });

  test('clear when zero open and completed history', () => {
    expect(resolveServerEmptyVariant(0, profileWithHistory)).toBe('clear');
  });
});

describe('resolveQuestBoardEmptyVariant', () => {
  test('client flag forces clear over first-time heuristic', () => {
    expect(resolveQuestBoardEmptyVariant(0, emptyProfile, true)).toBe('clear');
  });

  test('null when tasks remain', () => {
    expect(resolveQuestBoardEmptyVariant(1, profileWithHistory, true)).toBeNull();
  });
});
