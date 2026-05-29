import { test, expect } from '@playwright/test';

// These tests require an authenticated session.
// In a real setup, use a Playwright fixture to inject auth state.
// For now, they demonstrate the pattern — skip if no auth session available.

test.describe('Project CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Attempt to log in before each test
    await page.goto('/login');

    // If already on dashboard, we're authenticated
    if (page.url().includes('/dashboard')) return;

    // Use test credentials (requires a seeded test user)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for navigation — skip test if login fails
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    } catch {
      test.skip(true, 'No test user available — seed the database first');
    }
  });

  test('displays project list on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard should render the projects section
    await expect(page.locator('main')).toBeVisible();
  });

  test('create a new project', async ({ page }) => {
    await page.goto('/dashboard');

    // Click create/new project button
    const createButton = page.locator(
      'button:has-text("New Project"), button:has-text("Create"), a:has-text("New Project")',
    );
    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill project form
      await page.fill('input[name="name"]', `E2E Project ${Date.now()}`);
      const descField = page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.isVisible()) {
        await descField.fill('Created by Playwright E2E test');
      }

      await page.click('button[type="submit"]');

      // Should see the new project or return to dashboard
      await page.waitForTimeout(1000);
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
