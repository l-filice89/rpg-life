import { describe, expect, test } from 'bun:test';
import { computeFreshness } from './freshness';

describe('computeFreshness', () => {
  test('dated quest completed on due date returns multiplier 1.0', () => {
    const result = computeFreshness({
      dueDate: '2026-06-10',
      createdLocalDate: '2026-06-01',
      completedLocalDate: '2026-06-10',
    });

    expect(result).toEqual({
      multiplier: 1,
      reason: 'on_time',
      daysApplied: 0,
    });
  });

  test('dated quest completed before due date returns multiplier 1.0', () => {
    const result = computeFreshness({
      dueDate: '2026-06-10',
      createdLocalDate: '2026-06-01',
      completedLocalDate: '2026-06-08',
    });

    expect(result.multiplier).toBe(1);
    expect(result.reason).toBe('on_time');
  });

  test('dated quest 1 day overdue returns 0.95 multiplier', () => {
    const result = computeFreshness({
      dueDate: '2026-06-10',
      createdLocalDate: '2026-06-01',
      completedLocalDate: '2026-06-11',
    });

    expect(result.multiplier).toBeCloseTo(0.95, 5);
    expect(result.reason).toBe('overdue');
    expect(result.daysApplied).toBe(1);
  });

  test('dated quest 10 days overdue hits minFreshness floor 0.5', () => {
    const result = computeFreshness({
      dueDate: '2026-06-01',
      createdLocalDate: '2026-05-20',
      completedLocalDate: '2026-06-11',
    });

    expect(result.multiplier).toBe(0.5);
    expect(result.reason).toBe('overdue');
    expect(result.daysApplied).toBe(10);
  });

  test('undated quest same-day complete returns multiplier 1.0', () => {
    const result = computeFreshness({
      dueDate: null,
      createdLocalDate: '2026-06-01',
      completedLocalDate: '2026-06-01',
    });

    expect(result.multiplier).toBe(1);
    expect(result.reason).toBe('undated_age');
    expect(result.daysApplied).toBe(0);
  });

  test('undated quest day 7 returns ~0.86 multiplier at 2%/day', () => {
    const result = computeFreshness({
      dueDate: null,
      createdLocalDate: '2026-06-01',
      completedLocalDate: '2026-06-08',
    });

    expect(result.multiplier).toBeCloseTo(0.86, 2);
    expect(result.reason).toBe('undated_age');
    expect(result.daysApplied).toBe(7);
  });

  test('multiplier never drops below minFreshness 0.5', () => {
    const result = computeFreshness({
      dueDate: null,
      createdLocalDate: '2026-01-01',
      completedLocalDate: '2026-12-31',
    });

    expect(result.multiplier).toBe(0.5);
  });
});
