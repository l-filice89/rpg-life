import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';
import { checkA11y } from './helpers/axe';

// ---------------------------------------------------------------------------
// Task 3: Unauthenticated surfaces
// ---------------------------------------------------------------------------

test.describe('Accessibility audit — unauthenticated', () => {
  test('sign-in page — zero critical violations', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    await checkA11y(page, 'sign-in page');
  });
});

// ---------------------------------------------------------------------------
// Tasks 4–8: Authenticated surfaces
// ---------------------------------------------------------------------------

authTest.describe('Accessibility audit — authenticated', () => {
  // Task 4: Quest Board
  authTest('quest board with quests — zero critical violations', async ({
    authenticatedPage: page,
    testEmail,
  }) => {
    // Seed ≥1 open quest
    const seedRes = await page.request.post('/api/auth/test-seed', {
      data: {
        email: testEmail,
        action: 'create-quest',
        quest: {
          title: 'A11y audit quest',
          difficulty: 'easy',
          skillCodes: ['concentration'],
          dueDate: null,
        },
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto('/quest-board');
    await page.waitForLoadState('domcontentloaded');
    // Wait for quest row to appear (ensures dynamic content settled)
    await expect(page.getByRole('checkbox', { name: /Complete quest:/i })).toBeVisible();

    await checkA11y(page, 'quest board with quests');

    // Cleanup
    await page.request.post('/api/auth/test-seed', {
      data: { email: testEmail, action: 'delete-all-quests' },
    });
  });

  // Tasks 5 & 6: Confirm complete modal → Reward modal (sequential flow)
  authTest('confirm complete modal — zero critical violations', async ({
    authenticatedPage: page,
    testEmail,
  }) => {
    const seedRes = await page.request.post('/api/auth/test-seed', {
      data: {
        email: testEmail,
        action: 'create-quest',
        quest: {
          title: 'A11y modal quest',
          difficulty: 'easy',
          skillCodes: ['vitality'],
          dueDate: null,
        },
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto('/quest-board');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('checkbox', { name: 'Complete quest: A11y modal quest' })).toBeVisible();

    // Task 5: Confirm modal a11y check
    await page.getByRole('checkbox', { name: 'Complete quest: A11y modal quest' }).click();
    await expect(page.getByRole('heading', { name: 'Mark this quest complete?' })).toBeVisible();
    await checkA11y(page, 'confirm complete modal');

    // Task 6: Reward modal a11y check (continues from confirm)
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByRole('heading', { name: 'Quest complete!' })).toBeVisible({ timeout: 5000 });
    // Wait for animations to settle before auditing
    await page.waitForTimeout(300);
    await checkA11y(page, 'reward modal');

    await page.getByRole('button', { name: 'Continue' }).click();
  });

  // Task 7: Profile page
  authTest('profile page — zero critical violations', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    // Wait for hero level text to confirm page is rendered
    await expect(page.getByText(/Hero Lv \d+/)).toBeVisible();

    await checkA11y(page, 'profile page');
  });

  // Task 8: Sidebar navigation
  authTest('sidebar navigation open — zero critical violations', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/quest-board');
    await page.waitForLoadState('domcontentloaded');

    // Open sidebar via hamburger button
    const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    await menuButton.click();
    // Wait for sidebar panel to be fully visible
    const navigationDialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect(navigationDialog).toBeVisible();

    await checkA11y(page, 'sidebar navigation open');

    // Close sidebar and verify escape behavior
    await page.keyboard.press('Escape');
    await expect(navigationDialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});
