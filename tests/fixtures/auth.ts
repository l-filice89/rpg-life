import type { Page } from '@playwright/test';

/**
 * Establishes an authenticated session for E2E tests.
 * Requires B-001 auth test harness (Mailpit capture or test-only session route).
 */
export async function signInViaMagicLink(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByTestId('sign-in-email').fill(email);
  await page.getByRole('button', { name: /send|enter/i }).click();
  // TODO: extract magic link from Mailpit and navigate — blocked on Story 1.3 harness
  throw new Error('Auth test harness not implemented (B-001)');
}
