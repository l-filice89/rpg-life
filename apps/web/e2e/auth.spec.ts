import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('redirects unauthenticated users from home to sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Enter the realm' })).toBeVisible();
  });

  test('redirects unauthenticated users from quest-board to sign-in', async ({ page }) => {
    await page.goto('/quest-board');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('redirects unauthenticated users from profile to sign-in', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('shows realm address validation for invalid email', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email-signin', 'not-an-email');
    await page.getByRole('button', { name: 'Send sign-in link' }).click();
    await expect(page.getByText('Enter a valid realm address')).toBeVisible();
  });
});
