import { test, expect } from '@playwright/test';
import { signInViaMagicLink } from '../fixtures/auth';
import { testUser } from '../fixtures/test-data';

test.describe('Profile refresh (ATDD — SC1, SC3, UJ-3)', () => {
  test.skip('[P0] My Profile shows hero level and all seven skill bars', async ({ page }) => {
    await signInViaMagicLink(page, testUser.email);
    await page.goto('/board');

    await page.getByRole('button', { name: /menu|navigation/i }).click();
    await page.getByRole('link', { name: /my profile/i }).click();

    await expect(page.getByText(/hero/i)).toBeVisible();
    await expect(page.getByTestId('xp-bar')).toBeVisible();
    await expect(page.getByTestId('focus-pill')).toBeVisible();

    const skills = ['Concentration', 'Vitality', 'Lore', 'Presence', 'Order', 'Resolve', 'Craft'];
    for (const skill of skills) {
      await expect(page.getByText(skill, { exact: false })).toBeVisible();
    }
  });
});
