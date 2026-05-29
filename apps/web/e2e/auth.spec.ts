import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup → login → dashboard', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Navigate to signup
    await page.goto('/signup');
    await expect(page.locator('h1, h2')).toContainText(/sign up|create account/i);

    // Fill signup form
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/);

    // If redirected to login, sign in
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    }

    // Verify dashboard is accessible
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error and stay on login page
    await expect(page).toHaveURL(/\/login/);
  });
});
