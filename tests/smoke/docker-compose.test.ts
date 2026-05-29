import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Docker deployment smoke (ATDD — SC4)', () => {
  test.skip('[P0] docker compose up serves web and api with persisted sqlite', async () => {
    const web = await fetch('http://localhost:3000/sign-in');
    expect(web.status).toBe(200);

    const api = await fetch('http://localhost:3002/health');
    expect(api.status).toBe(200);

    const health = (await api.json()) as { status: string };
    expect(health.status).toBe('healthy');

    expect(existsSync(join(process.cwd(), 'data'))).toBe(true);
  });
});
