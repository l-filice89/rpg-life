import { test, expect } from '@playwright/test';
import { signInViaMagicLink } from '../fixtures/auth';
import { testUser } from '../fixtures/test-data';

test.describe('Focus reschedule (ATDD — SC3, UJ-4)', () => {
  test.skip('[P0] user reschedules overdue quest by spending 1 Focus', async ({ page }) => {
    await signInViaMagicLink(page, testUser.email);
    await page.goto('/board');

    await page.getByRole('button', { name: /overdue/i }).click();
    await page.getByText(/overdue quest/i).first().click();
    await page.getByRole('button', { name: /reschedule/i }).click();
    await page.getByText(/spend 1 focus/i).click();
    await page.getByLabel(/due date|new date/i).fill('2026-06-15');
    await page.getByRole('button', { name: /confirm|save/i }).click();

    await expect(page.getByText(/quest rescheduled/i)).toBeVisible();
    await expect(page.getByTestId('focus-pill')).not.toHaveText(/^1 Focus$/);
  });
});
