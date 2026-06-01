# @rpg-life/server

Standalone API server built with **Hono + tRPC v11** on **Bun**.

## Overview

- **Framework**: Hono (HTTP) + tRPC v11
- **Runtime**: Bun
- **Port**: 3002
- **Auth**: Better Auth magic link via `@rpg-life/auth`
- **Database**: SQLite via Drizzle (`@rpg-life/db`)

## Development

```bash
bun run dev       # Hot reload on :3002 (from monorepo root: bun dev)
bun test          # Scaffold smoke tests
bun run build     # Production bundle
```

## Structure

```
src/
  start.ts              # Server entry
  app.ts                # Hono app: health, auth mount, tRPC mount
  lib/
    env.ts              # Validated environment variables
    logger.ts           # Pino logger
  middleware/
    logger.ts           # Request logging
tests/
  scaffold.test.ts      # Story 1.1 infrastructure smoke tests
```

## Routes

| Route         | Method | Auth   | Description           |
| ------------- | ------ | ------ | --------------------- |
| `/health`     | GET    | No     | Health check          |
| `/api/auth/*` | ALL    | No     | Better Auth endpoints |
| `/api/trpc/*` | ALL    | Varies | tRPC procedures       |

tRPC routers live in `packages/api` (`tasks`, `profile`, `tutorial`).

## Testing

```bash
bun test                    # apps/api smoke tests
bun run smoke               # from repo root — full verification suite
```
