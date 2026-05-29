import { test, expect } from '@playwright/test';
import { baseUrls } from '../fixtures/test-data';

test.describe('Tasks API — update & delete (ATDD — SC1 CRUD)', () => {
  test.skip('[P0] tasks.update edits open quest fields', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.update`, {
      data: { id: 'quest-id', title: 'Updated quest title' },
      headers: { cookie: 'session=test-session' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.result.data.title).toBe('Updated quest title');
  });

  test.skip('[P0] tasks.delete soft-deletes open quest', async ({ request }) => {
    const response = await request.post(`${baseUrls.api}/api/trpc/tasks.delete`, {
      data: { id: 'quest-id' },
      headers: { cookie: 'session=test-session' },
    });
    expect(response.ok()).toBeTruthy();
    const listResponse = await request.post(`${baseUrls.api}/api/trpc/tasks.list`, {
      headers: { cookie: 'session=test-session' },
    });
    const list = await listResponse.json();
    expect(list.result.data.find((q: { id: string }) => q.id === 'quest-id')).toBeUndefined();
  });
});
