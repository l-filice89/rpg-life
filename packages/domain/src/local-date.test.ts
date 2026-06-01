import { describe, expect, test } from 'bun:test';
import { daysBetweenLocalDates, utcToLocalDate } from './local-date';

describe('utcToLocalDate', () => {
  test('maps UTC evening to same calendar day in America/Los_Angeles', () => {
    expect(utcToLocalDate('2026-06-01T23:30:00.000Z', 'America/Los_Angeles')).toBe(
      '2026-06-01',
    );
  });

  test('maps UTC midnight to next calendar day in Europe/Ljubljana during summer', () => {
    expect(utcToLocalDate('2026-06-01T23:00:00.000Z', 'Europe/Ljubljana')).toBe(
      '2026-06-02',
    );
  });
});

describe('daysBetweenLocalDates', () => {
  test('returns 0 for same calendar day', () => {
    expect(daysBetweenLocalDates('2026-06-01', '2026-06-01')).toBe(0);
  });

  test('returns positive whole days across month boundary', () => {
    expect(daysBetweenLocalDates('2026-06-01', '2026-06-08')).toBe(7);
  });

  test('never returns negative when to is before from', () => {
    expect(daysBetweenLocalDates('2026-06-10', '2026-06-01')).toBe(0);
  });
});
