import { describe, expect, test, beforeEach } from 'bun:test';
import type { TaskListItem } from '@rpg-life/api';
import {
  DEFAULT_QUEST_BOARD_FILTERS,
  filterQuests,
  isBeyondUpcomingRange,
  loadQuestBoardFilters,
  QUEST_BOARD_FILTERS_STORAGE_KEY,
  saveQuestBoardFilters,
} from './quest-board-filters';

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addUtcDays(from: Date, days: number): Date {
  const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function task(overrides: Partial<TaskListItem> & Pick<TaskListItem, 'id'>): TaskListItem {
  return {
    title: 'Quest',
    difficulty: 'easy',
    dueDate: null,
    skillCodes: ['concentration'],
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isBeyondUpcomingRange', () => {
  test('returns false for due date within range', () => {
    const today = new Date();
    const due = formatUtcDate(addUtcDays(today, 3));
    expect(isBeyondUpcomingRange(due, 7)).toBe(false);
  });

  test('returns true for due date beyond range', () => {
    const today = new Date();
    const due = formatUtcDate(addUtcDays(today, 8));
    expect(isBeyondUpcomingRange(due, 7)).toBe(true);
  });
});

describe('filterQuests', () => {
  const today = new Date();
  const overdueDue = formatUtcDate(addUtcDays(today, -2));
  const soonDue = formatUtcDate(addUtcDays(today, 2));
  const farDue = formatUtcDate(addUtcDays(today, 10));

  const tasks: TaskListItem[] = [
    task({ id: '1', dueDate: overdueDue }),
    task({ id: '2', dueDate: soonDue }),
    task({ id: '3', dueDate: farDue }),
    task({ id: '4', dueDate: null }),
  ];

  test('returns all tasks when filters are off', () => {
    expect(filterQuests(tasks, DEFAULT_QUEST_BOARD_FILTERS)).toEqual(tasks);
  });

  test('overdue-only hides non-overdue quests', () => {
    const filtered = filterQuests(tasks, {
      ...DEFAULT_QUEST_BOARD_FILTERS,
      overdueOnly: true,
    });
    expect(filtered.map((item) => item.id)).toEqual(['1']);
  });

  test('upcoming range hides far-future dated quests', () => {
    const filtered = filterQuests(tasks, {
      ...DEFAULT_QUEST_BOARD_FILTERS,
      upcomingRangeEnabled: true,
      upcomingDays: 7,
    });
    expect(filtered.map((item) => item.id)).toEqual(['1', '2', '4']);
  });

  test('upcoming range keeps undated quests visible', () => {
    const onlyUndated = [task({ id: '4', dueDate: null })];
    const filtered = filterQuests(onlyUndated, {
      ...DEFAULT_QUEST_BOARD_FILTERS,
      upcomingRangeEnabled: true,
    });
    expect(filtered).toHaveLength(1);
  });

  test('upcoming range keeps overdue quests visible', () => {
    const filtered = filterQuests(tasks, {
      ...DEFAULT_QUEST_BOARD_FILTERS,
      upcomingRangeEnabled: true,
      upcomingDays: 7,
    });
    expect(filtered.some((item) => item.id === '1')).toBe(true);
  });
});

describe('sessionStorage persistence', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    globalThis.sessionStorage = {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      key(index: number) {
        return [...store.keys()][index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
    } as Storage;
  });

  test('loadQuestBoardFilters returns defaults when empty', () => {
    expect(loadQuestBoardFilters()).toEqual(DEFAULT_QUEST_BOARD_FILTERS);
  });

  test('save and load round-trip filter state', () => {
    const state = {
      overdueOnly: true,
      upcomingRangeEnabled: true,
      upcomingDays: 7,
    };
    saveQuestBoardFilters(state);
    expect(loadQuestBoardFilters()).toEqual(state);
    expect(store.get(QUEST_BOARD_FILTERS_STORAGE_KEY)).toBe(JSON.stringify(state));
  });

  test('loadQuestBoardFilters falls back on corrupt JSON', () => {
    store.set(QUEST_BOARD_FILTERS_STORAGE_KEY, '{not-json');
    expect(loadQuestBoardFilters()).toEqual(DEFAULT_QUEST_BOARD_FILTERS);
  });
});
