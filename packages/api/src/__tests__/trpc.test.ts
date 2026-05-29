import { describe, test, expect } from 'bun:test';
import { TRPCError } from '@trpc/server';
import { appRouter } from '../root';

const mockReq = new Request('http://localhost/api/trpc');

function createCaller(user: { id: string; email: string; name: string } | null) {
  return appRouter.createCaller({
    db: {} as never,
    user,
    req: mockReq,
  });
}

describe('tRPC procedures', () => {
  test('health is public', async () => {
    const caller = createCaller(null);
    await expect(caller.health()).resolves.toEqual({ status: 'ok' });
  });

  test('profile.ping requires authentication', async () => {
    const caller = createCaller(null);
    await expect(caller.profile.ping()).rejects.toThrow(TRPCError);
  });

  test('profile.ping returns userId when session present', async () => {
    const caller = createCaller({
      id: 'user-abc',
      email: 'ben@example.com',
      name: 'Ben',
    });
    await expect(caller.profile.ping()).resolves.toEqual({ userId: 'user-abc' });
  });
});
