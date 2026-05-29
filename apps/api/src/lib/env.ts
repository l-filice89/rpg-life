import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT_API: z.coerce.number().default(3002),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email(),
    WEB_URL: z.string().url().default('http://localhost:3000'),
    APP_VERSION: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
