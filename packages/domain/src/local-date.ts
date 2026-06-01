import type { LocalDate } from './types';

/**
 * Converts a UTC ISO timestamp to a local calendar date in the given IANA timezone.
 */
export function utcToLocalDate(isoUtc: string, timezone: string): LocalDate {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid UTC timestamp: ${isoUtc}`);
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error(`Failed to format local date for timezone: ${timezone}`);
  }

  return `${year}-${month}-${day}`;
}

/**
 * Returns whole calendar days from `from` to `to` (inclusive of direction: to - from).
 * Both dates must be `YYYY-MM-DD`.
 */
export function daysBetweenLocalDates(from: LocalDate, to: LocalDate): number {
  const fromMs = parseLocalDateUtc(from);
  const toMs = parseLocalDateUtc(to);
  const diffMs = toMs - fromMs;
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

function parseLocalDateUtc(date: LocalDate): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Invalid local date: ${date}`);
  }
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}
