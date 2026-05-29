import { describe, expect, test } from 'bun:test';
import { getPageTitle } from './page-title';

describe('getPageTitle', () => {
  test('returns Quest Board for quest-board route', () => {
    expect(getPageTitle('/quest-board')).toBe('Quest Board');
  });

  test('returns My Profile for profile route', () => {
    expect(getPageTitle('/profile')).toBe('My Profile');
  });

  test('defaults to Quest Board for unknown routes', () => {
    expect(getPageTitle('/other')).toBe('Quest Board');
  });
});
