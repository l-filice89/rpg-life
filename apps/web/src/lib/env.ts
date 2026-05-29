import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.string().url().default('http://localhost:3002'),
  },
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
  emptyStringAsUndefined: true,
});
