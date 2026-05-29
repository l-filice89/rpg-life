import { describe, expect, test } from 'bun:test';
import { userProgress } from '../src/schema/user-progress';

describe('user_progress schema', () => {
  test('defines required columns for Story 1.1', () => {
    expect(userProgress.userId.name).toBe('user_id');
    expect(userProgress.focusBalance.name).toBe('focus_balance');
    expect(userProgress.tutorialSeenAt.name).toBe('tutorial_seen_at');
    expect(userProgress.modifiedAt.name).toBe('modified_at');
  });
});
