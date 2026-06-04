import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
// Validate env first so auth/db modules never read unvalidated process.env.
import { env } from './lib/env';
import { auth } from '@rpg-life/auth/server';
import { appRouter, createContext } from '@rpg-life/api';
import { logger } from './lib/logger';
import { requestLogger } from './middleware/logger';
import { testSeedHandler, testSessionHandler } from './middleware/test-session';

const app = new Hono();

app.use('*', requestLogger);

app.use(
  '/api/trpc/*',
  cors({
    origin: [env.WEB_URL],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(
  '/api/auth/*',
  cors({
    origin: [env.WEB_URL],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Test-only endpoints — registered BEFORE the auth wildcard so Hono matches
// these specific routes first. Each handler enforces NODE_ENV=test internally.
app.post('/api/auth/test-session', testSessionHandler);
app.post('/api/auth/test-seed', testSeedHandler);

// NOTE: single `*` wildcard — Hono's router fails to match a `**` wildcard once
// exact routes (the test-session/test-seed POSTs above) share the same prefix,
// which silently 404s every better-auth route (incl. get-session and sign-in).
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION ?? '0.0.0',
  }),
);

app.use(
  '/api/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error }) {
      logger.error({ code: error.code, message: error.message }, 'tRPC error');
    },
  }),
);

export default app;
export { app };
export type { AppRouter } from '@rpg-life/api';
