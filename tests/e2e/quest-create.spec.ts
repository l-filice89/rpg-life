import { test, expect } from '@playwright/test';
import { signInViaMagicLink } from '../fixtures/auth';
import { testQuest, testUser } from '../fixtures/test-data';

test.describe('Quest create (ATDD — SC1, SC3, UJ-1)', () => {
  test.skip('[P0] user creates a quest via FAB and sees it on the board', async ({ page }) => {
    await signInViaMagicLink(page, testUser.email);
    await page.goto('/board');

    await page.getByTestId('fab-create-quest').click();
    await page.getByLabel(/title/i).fill(testQuest.title);
    await page.getByRole('button', { name: testQuest.difficulty, exact: true }).click();
    await page.getByRole('button', { name: /concentration/i }).click();
    await page.getByRole('button', { name: /save|create/i }).click();

    await expect(page.getByText(testQuest.title)).toBeVisible();
    await expect(page.getByText(/quest created/i)).toBeVisible();
  });
});
