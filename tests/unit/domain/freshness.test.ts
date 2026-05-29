import { describe, expect, test } from 'bun:test';
import { computeFreshness } from '../../../packages/domain/src/freshness';

describe('computeFreshness (ATDD — SC2 domain coverage)', () => {
  test.skip('[P0] dated quest earns full XP through due date', () => {
    const multiplier = computeFreshness({
      dueDate: new Date('2026-06-01T00:00:00Z'),
      createdAt: new Date('2026-05-20T00:00:00Z'),
      completedAt: new Date('2026-05-31T12:00:00Z'),
      timezone: 'Europe/London',
    });
    expect(multiplier).toBe(1);
  });

  test.skip('[P0] undated quest decays but never below minFreshness (0.5)', () => {
    const multiplier = computeFreshness({
      dueDate: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      completedAt: new Date('2026-06-01T00:00:00Z'),
      timezone: 'UTC',
    });
    expect(multiplier).toBeGreaterThanOrEqual(0.5);
    expect(multiplier).toBeLessThan(1);
  });

  test.skip('[P1] overdue dated quest applies overdue decay after due date', () => {
    const multiplier = computeFreshness({
      dueDate: new Date('2026-05-01T00:00:00Z'),
      createdAt: new Date('2026-04-01T00:00:00Z'),
      completedAt: new Date('2026-05-15T00:00:00Z'),
      timezone: 'America/New_York',
    });
    expect(multiplier).toBeLessThan(1);
    expect(multiplier).toBeGreaterThanOrEqual(0.5);
  });
});
