# @rpg-life/api

Standalone API server built with **Hono + tRPC v11** running on **Bun**.

## Overview

- **Framework**: Hono (HTTP) + tRPC v11 (type-safe RPC)
- **Runtime**: Bun
- **Port**: 3002
- **Auth**: Better Auth with bearer tokens
- **Database**: Neon Postgres via Drizzle ORM
- **AI**: Vercel AI SDK (Claude + OpenAI)

## Development

```bash
bun run dev       # Start with hot reload on :3002
bun test          # Run 123 tests
bun run build     # Build for production
```

## Structure

```
src/
  index.ts              # Hono app entry, middleware stack, tRPC adapter
  trpc.ts               # tRPC init, context, procedures (public/protected/admin)
  routers/
    index.ts            # appRouter combining all routers
    projects.ts         # CRUD: list, get, create, update, delete
    users.ts            # users.me profile endpoint
    ai.ts               # ai.generate with cost tracking
  middleware/
    rate-limit.ts       # Upstash Redis rate limiting (3 tiers)
  lib/
    env.ts              # Zod-validated environment variables
    errors.ts           # AppError class + Errors.* constructors
    logger.ts           # Pino logger with child loggers
    cache.ts            # Redis cache interface (get/set/del/getOrGenerate)
```

## API Routes

| Route         | Method | Auth   | Description           |
| ------------- | ------ | ------ | --------------------- |
| `/health`     | GET    | No     | Health check          |
| `/api/auth/*` | ALL    | No     | Better Auth endpoints |
| `/trpc/*`     | ALL    | Varies | tRPC procedures       |

## tRPC Procedures

| Procedure         | Auth      | Description                        |
| ----------------- | --------- | ---------------------------------- |
| `projects.list`   | Public    | Paginated project list             |
| `projects.get`    | Protected | Get project by ID                  |
| `projects.create` | Protected | Create project                     |
| `projects.update` | Protected | Update project (owner only)        |
| `projects.delete` | Protected | Delete project (owner only)        |
| `users.me`        | Protected | Current user profile               |
| `ai.generate`     | Protected | Generate AI text with cost logging |

## Middleware Order

```
requestLogger -> CORS -> rate limiting -> auth -> route-specific
```

## Testing

Tests use Bun's test runner with the `createCaller` + `createTestContext` pattern:

```typescript
import { createTestContext, createCaller, createTestUser } from './helpers';

const caller = createCaller(createTestContext({ user: createTestUser() }));
const result = await caller.projects.list({});
```

See [docs/testing-conventions.md](../../docs/testing-conventions.md) for details.
