import { test, expect } from '@playwright/test';
import { baseUrls, testQuest } from '../fixtures/test-data';

test.describe('Tasks API — create (ATDD — SC1 CRUD)', () => {
  test.skip('[P0] POST tasks.create persists quest with title and skills', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.create`, {
      data: {
        title: testQuest.title,
        difficulty: testQuest.difficulty,
        skillIds: testQuest.skillSlugs,
      },
      headers: { cookie: 'session=test-session' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.result.data).toMatchObject({
      title: testQuest.title,
      difficulty: testQuest.difficulty,
    });
  });

  test.skip('[P1] rejects create without title or skills', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.create`, {
      data: { title: '', skillIds: [] },
      headers: { cookie: 'session=test-session' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
