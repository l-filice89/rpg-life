import { describe, expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const COVERAGE_THRESHOLD = 70;
const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json');

describe('Coverage gate (ATDD — SC2)', () => {
  test.skip('[P0] meaningful code coverage is at least 70%', () => {
    expect(existsSync(coveragePath)).toBe(true);
    const summary = JSON.parse(readFileSync(coveragePath, 'utf8')) as {
      total: { lines: { pct: number } };
    };
    expect(summary.total.lines.pct).toBeGreaterThanOrEqual(COVERAGE_THRESHOLD);
  });
});
