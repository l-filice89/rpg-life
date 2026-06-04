import { test, expect } from './fixtures/auth';

test.describe('Quest Create — UJ-1', () => {
  test.beforeEach(async ({ authenticatedPage, testEmail }) => {
    // Clean state: remove any open quests left from a previous interrupted run.
    await authenticatedPage.request.post('/api/auth/test-seed', {
      data: { email: testEmail, action: 'delete-all-quests' },
    });
  });

  test.afterEach(async ({ authenticatedPage, testEmail }) => {
    await authenticatedPage.request.post('/api/auth/test-seed', {
      data: { email: testEmail, action: 'delete-all-quests' },
    });
  });

  test('creates a valid quest and it appears on the board', async ({ authenticatedPage: page }) => {
    await page.goto('/quest-board');

    // Open Create Quest sheet via FAB
    await page.getByRole('button', { name: 'Create quest' }).click();
    await expect(page.getByRole('heading', { name: 'Create Quest' })).toBeVisible();

    // Fill title
    await page.getByLabel('Title').fill('E2E test quest');

    // Select one skill from the Skills group
    const skillsGroup = page.getByRole('group', { name: 'Skills' });
    await skillsGroup.getByText('Concentration').click();

    // Save
    await page.getByRole('button', { name: 'Save Quest' }).click();

    // Quest row should appear on the board with the correct title
    await expect(
      page.getByRole('button', { name: 'Edit quest: E2E test quest' }),
    ).toBeVisible();
  });

  test('save button is disabled when no skill is selected', async ({ authenticatedPage: page }) => {
    await page.goto('/quest-board');

    await page.getByRole('button', { name: 'Create quest' }).click();
    await expect(page.getByRole('heading', { name: 'Create Quest' })).toBeVisible();

    // Fill title only — do NOT select a skill
    await page.getByLabel('Title').fill('E2E no-skill quest');

    // Save Quest should remain disabled
    await expect(page.getByRole('button', { name: 'Save Quest' })).toBeDisabled();
  });
});
