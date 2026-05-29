import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.string().url().default('http://localhost:3002'),
  },
  client: {},
  runtimeEnv: {
    API_URL: process.env.API_URL,
  },
  emptyStringAsUndefined: true,
});
