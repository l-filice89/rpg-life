import { test, expect } from '@playwright/test';
import { signInViaMagicLink } from '../fixtures/auth';
import { testUser } from '../fixtures/test-data';

test.describe('Quest complete + reward (ATDD — SC1, SC3, UJ-2)', () => {
  test.skip('[P0] completing a quest shows reward modal within 1 second', async ({ page }) => {
    await signInViaMagicLink(page, testUser.email);
    await page.goto('/board');

    const completeResponse = page.waitForResponse(
      (resp) => resp.url().includes('tasks.complete') && resp.status() === 200,
    );

    await page.getByRole('checkbox', { name: /complete quest/i }).first().click();
    await page.getByRole('button', { name: /^yes$/i }).click();

    const started = Date.now();
    await completeResponse;
    await expect(page.getByTestId('reward-modal')).toBeVisible();
    expect(Date.now() - started).toBeLessThan(1000);

    await expect(page.getByText(/quest complete/i)).toBeVisible();
  });
});
