import { test, expect } from '@playwright/test';

test.describe('Auth gate (ATDD — SC1, SC3)', () => {
  test.skip('[P0] unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/board');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.getByRole('heading', { name: /enter the realm/i })).toBeVisible();
  });
});
