import { test, expect } from './fixtures/auth';

const SKILL_DISPLAY_NAMES = [
  'Concentration',
  'Vitality',
  'Lore',
  'Presence',
  'Order',
  'Resolve',
  'Craft',
] as const;

test.describe('Profile Refresh — UJ-3', () => {
  test('profile shows Hero level, XP bars for all 7 skills, and Focus balance', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/profile');

    // Hero level is visible
    await expect(page.getByText(/Hero Lv \d+/)).toBeVisible();

    // All 7 skill names must be rendered
    for (const skillName of SKILL_DISPLAY_NAMES) {
      await expect(page.getByText(skillName)).toBeVisible();
      await expect(page.getByRole('progressbar', { name: `${skillName} XP progress` })).toBeVisible();
    }

    // Hero XP progress bar is visible
    await expect(page.getByRole('progressbar', { name: 'Hero XP progress' })).toBeVisible();

    // Focus balance pill is present — matches "N / M" pattern
    await expect(page.getByText(/\d+\s*\/\s*\d+/)).toBeVisible();
  });

  test('profile shows all 7 skill rows regardless of XP level', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/profile');

    // Every skill name must appear exactly once
    for (const skillName of SKILL_DISPLAY_NAMES) {
      await expect(page.getByText(skillName)).toBeVisible();
    }

    // Verify heading is present — catches the page rendering at all
    await expect(page.getByText(/Hero Lv \d+/)).toBeVisible();
  });
});
