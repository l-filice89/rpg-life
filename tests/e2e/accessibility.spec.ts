import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signInViaMagicLink } from '../fixtures/auth';
import { testUser } from '../fixtures/test-data';

const flows = [
  { name: 'sign-in', path: '/sign-in', auth: false },
  { name: 'quest-board', path: '/board', auth: true },
  { name: 'profile', path: '/profile', auth: true },
] as const;

test.describe('Accessibility gate (ATDD — SC5)', () => {
  for (const flow of flows) {
    test.skip(`[P0] ${flow.name} has zero critical WCAG violations`, async ({ page }) => {
      if (flow.auth) {
        await signInViaMagicLink(page, testUser.email);
      }
      await page.goto(flow.path);

      const results = await new AxeBuilder({ page }).analyze();
      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(critical).toEqual([]);
    });
  }
});
