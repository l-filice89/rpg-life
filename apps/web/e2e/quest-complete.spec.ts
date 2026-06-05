import { test, expect } from './fixtures/auth';

test.describe('Quest Complete + Reward — UJ-2', () => {
  test.afterEach(async ({ authenticatedPage, testEmail }) => {
    await authenticatedPage.request.post('/api/auth/test-seed', {
      data: { email: testEmail, action: 'delete-all-quests' },
    });
  });

  test('completes a quest and shows reward modal', async ({ authenticatedPage: page, testEmail }) => {
    // Seed a known open quest
    const seedRes = await page.request.post('/api/auth/test-seed', {
      data: {
        email: testEmail,
        action: 'create-quest',
        quest: {
          title: 'E2E complete quest',
          difficulty: 'easy',
          skillCodes: ['concentration'],
          dueDate: null,
        },
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto('/quest-board');

    // Find the seeded quest row and click its complete checkbox
    await expect(
      page.getByRole('button', { name: 'Edit quest: E2E complete quest' }),
    ).toBeVisible();

    await page.getByRole('checkbox', { name: 'Complete quest: E2E complete quest' }).click();

    // Confirm modal
    await expect(page.getByRole('heading', { name: 'Mark this quest complete?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Reward modal (or level-up overlay) should appear within 2 s
    await expect(page.getByRole('heading', { name: 'Quest complete!' })).toBeVisible({ timeout: 5000 });

    // At least one skill XP entry should be visible
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();

    // Dismiss via Continue
    await page.getByRole('button', { name: 'Continue' }).click();

    // Quest should no longer be in the open list
    await expect(
      page.getByRole('button', { name: 'Edit quest: E2E complete quest' }),
    ).not.toBeVisible();
  });

  test('shows board-clear state after completing the only quest', async ({
    authenticatedPage: page,
    testEmail,
  }) => {
    // Seed exactly one quest
    const seedRes = await page.request.post('/api/auth/test-seed', {
      data: {
        email: testEmail,
        action: 'create-quest',
        quest: {
          title: 'E2E sole quest',
          difficulty: 'easy',
          skillCodes: ['vitality'],
          dueDate: null,
        },
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto('/quest-board');

    await page.getByRole('checkbox', { name: 'Complete quest: E2E sole quest' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();

    // Wait for reward / level-up
    await expect(page.getByRole('heading', { name: 'Quest complete!' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Continue' }).click();

    // Board-clear empty state
    await expect(page.getByRole('heading', { name: 'Quest board clear' })).toBeVisible();
  });
});
