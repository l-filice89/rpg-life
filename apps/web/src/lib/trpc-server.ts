import 'server-only';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@rpg-life/api';
import { headers } from 'next/headers';
import { env } from './env';

export async function createServerTrpcClient() {
  const headerList = await headers();
  const cookie = headerList.get('cookie') ?? '';

  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.API_URL}/api/trpc`,
        headers: {
          cookie,
        },
      }),
    ],
  });
}
