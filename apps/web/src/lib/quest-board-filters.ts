import type { TaskListItem } from '@rpg-life/api';
import { isOverdue } from '@/lib/format-due-date';

export type QuestBoardFilterState = {
  overdueOnly: boolean;
  upcomingRangeEnabled: boolean;
  upcomingDays: number;
};

export const QUEST_BOARD_FILTERS_STORAGE_KEY = 'rpg-life:quest-board-filters';

export const DEFAULT_QUEST_BOARD_FILTERS: QuestBoardFilterState = {
  overdueOnly: false,
  upcomingRangeEnabled: false,
  upcomingDays: 7,
};

function parseDueDateUtc(dueDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) {
    return null;
  }

  const dueUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(dueUtc)) {
    return null;
  }

  return dueUtc;
}

function todayUtc(): number {
  const today = new Date();
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}

function addUtcDays(baseUtc: number, days: number): number {
  const date = new Date(baseUtc);
  date.setUTCDate(date.getUTCDate() + days);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isBeyondUpcomingRange(dueDate: string, days: number): boolean {
  const dueUtc = parseDueDateUtc(dueDate);
  if (dueUtc === null) {
    return false;
  }

  const limitUtc = addUtcDays(todayUtc(), days);
  return dueUtc > limitUtc;
}

export function filterQuests(
  tasks: TaskListItem[],
  filters: QuestBoardFilterState,
): TaskListItem[] {
  return tasks.filter((task) => {
    if (filters.overdueOnly) {
      return task.dueDate != null && isOverdue(task.dueDate);
    }

    if (filters.upcomingRangeEnabled && task.dueDate != null) {
      if (isOverdue(task.dueDate)) {
        return true;
      }

      if (isBeyondUpcomingRange(task.dueDate, filters.upcomingDays)) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveQuestBoardFilters(filters: QuestBoardFilterState): boolean {
  return filters.overdueOnly || filters.upcomingRangeEnabled;
}

function isValidFilterState(value: unknown): value is QuestBoardFilterState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<QuestBoardFilterState>;
  return (
    typeof candidate.overdueOnly === 'boolean' &&
    typeof candidate.upcomingRangeEnabled === 'boolean' &&
    typeof candidate.upcomingDays === 'number' &&
    candidate.upcomingDays > 0
  );
}

export function loadQuestBoardFilters(): QuestBoardFilterState {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return DEFAULT_QUEST_BOARD_FILTERS;
  }

  try {
    const raw = globalThis.sessionStorage.getItem(QUEST_BOARD_FILTERS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_QUEST_BOARD_FILTERS;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidFilterState(parsed)) {
      return DEFAULT_QUEST_BOARD_FILTERS;
    }

    return {
      overdueOnly: parsed.overdueOnly,
      upcomingRangeEnabled: parsed.upcomingRangeEnabled,
      upcomingDays: parsed.upcomingDays,
    };
  } catch {
    return DEFAULT_QUEST_BOARD_FILTERS;
  }
}

export function saveQuestBoardFilters(state: QuestBoardFilterState): void {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return;
  }

  globalThis.sessionStorage.setItem(QUEST_BOARD_FILTERS_STORAGE_KEY, JSON.stringify(state));
}
