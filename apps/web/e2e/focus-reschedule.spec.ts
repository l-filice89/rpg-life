import { test, expect, createAuthPage } from './fixtures/auth';

// Use a custom test that sets up focus balance before the spec runs.
// focusBalance is set via test-session so the user has enough Focus to reschedule.
const FOCUS_BALANCE = 2;
const OVERDUE_DATE = '2020-01-01'; // guaranteed past
const FUTURE_DATE = '2099-12-31'; // guaranteed future

test.describe('Focus Reschedule — UJ-4', () => {
  test.afterEach(async ({ browser, testEmail }) => {
    // Clean up quests after each test
    const { page, context } = await createAuthPage(browser, {
      email: testEmail,
      focusBalance: FOCUS_BALANCE,
    });
    await page.request.post('/api/auth/test-seed', {
      data: { email: testEmail, action: 'delete-all-quests' },
    });
    await context.close();
  });

  test(
    'spending 1 Focus reschedules an overdue quest and decrements the balance',
    async ({ browser, testEmail }) => {
      // Set up user with focus balance and get authenticated page
      const { page, context } = await createAuthPage(browser, {
        email: testEmail,
        focusBalance: FOCUS_BALANCE,
      });

      // Seed an overdue quest
      const seedRes = await page.request.post('/api/auth/test-seed', {
        data: {
          email: testEmail,
          action: 'create-quest',
          quest: {
            title: 'E2E overdue quest',
            difficulty: 'easy',
            skillCodes: ['resolve'],
            dueDate: OVERDUE_DATE,
          },
        },
      });
      expect(seedRes.ok()).toBeTruthy();

      await page.goto('/quest-board');

      // Focus balance should show FOCUS_BALANCE before reschedule
      await expect(page.getByText(`⚡ ${FOCUS_BALANCE}/`)).toBeVisible();

      // Open the edit sheet for the overdue quest
      await page.getByRole('button', { name: 'Edit quest: E2E overdue quest' }).click();
      await expect(page.getByRole('heading', { name: 'Edit Quest' })).toBeVisible();

      // Change the due date to a future date
      await page.getByLabel('Due date').fill(FUTURE_DATE);

      // Attempt to save — triggers the Focus spend prompt
      await page.getByRole('button', { name: 'Save Quest' }).click();

      // Focus spend dialog should appear
      await expect(page.getByRole('heading', { name: 'Reschedule quest?' })).toBeVisible();
      await expect(page.getByText('Spend 1 Focus to reschedule without penalty.')).toBeVisible();

      // Confirm spending 1 Focus
      await page.getByRole('button', { name: 'Confirm' }).click();

      // Toast "Quest rescheduled" must appear
      await expect(page.getByText('Quest rescheduled')).toBeVisible({ timeout: 5000 });

      // Focus balance in the board header must decrement
      await expect(page.getByText(`⚡ ${FOCUS_BALANCE - 1}/`)).toBeVisible({ timeout: 5000 });

      await context.close();
    },
  );
});
