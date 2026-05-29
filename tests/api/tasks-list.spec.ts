import { test, expect } from '@playwright/test';
import { baseUrls } from '../fixtures/test-data';

test.describe('Tasks API — list & read (ATDD — SC1 CRUD)', () => {
  test.skip('[P0] GET tasks.list returns only authenticated user open quests', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.list`, {
      data: {},
      headers: { cookie: 'session=test-session' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          status: 'open',
        }),
      ]),
    );
  });
});
