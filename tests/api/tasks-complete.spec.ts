import { test, expect } from '@playwright/test';
import { baseUrls } from '../fixtures/test-data';

test.describe('Tasks API — complete (ATDD — SC1 CRUD + R-001)', () => {
  test.skip('[P0] tasks.complete awards XP and is idempotent on retry', async ({ request }) => {
    const complete = await request.post(`${baseUrls.api}/api/trpc/tasks.complete`, {
      data: { id: 'quest-id', timezone: 'Europe/London' },
      headers: { cookie: 'session=test-session' },
    });
    expect(complete.ok()).toBeTruthy();
    const first = await complete.json();

    const retry = await request.post(`${baseUrls.api}/api/trpc/tasks.complete`, {
      data: { id: 'quest-id', timezone: 'Europe/London' },
      headers: { cookie: 'session=test-session' },
    });
    const second = await retry.json();

    expect(first.result.data.xpAward).toBe(second.result.data.xpAward);
    expect(first.result.data.xpPerSkill).toEqual(second.result.data.xpPerSkill);
  });

  test.skip('[P0] rejects complete when quest has zero skills', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.complete`, {
      data: { id: 'invalid-quest-id', timezone: 'UTC' },
      headers: { cookie: 'session=test-session' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
