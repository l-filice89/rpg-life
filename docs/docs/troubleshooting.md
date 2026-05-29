# Troubleshooting

Common issues and their solutions when working with rpg-life.

## Installation & Setup

### `bun install` fails with resolution errors

**Error**: `error: Failed to resolve package`

**Solution**: Clear the cache and reinstall:

```bash
bun clean
bun install
```

### Environment validation fails on startup

**Error**: `Invalid environment variables: { DATABASE_URL: ['Required'] }`

**Solution**: Ensure `.env.local` exists and has all required variables. See [docs/environment.md](environment.md).

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### `ANTHROPIC_API_KEY must start with 'sk-'`

**Solution**: Your API key format is wrong. Get a valid key from [console.anthropic.com](https://console.anthropic.com). It should look like `sk-ant-api03-...`.

### `JWT_SECRET must be at least 32 characters`

**Solution**: Generate a proper secret:

```bash
openssl rand -base64 32
```

## Database

### `bun db:push` fails with connection error

**Error**: `connection refused` or `ENOTFOUND`

**Solution**: Check your `DATABASE_URL` in `.env.local`:

- Must include `?sslmode=require` for Neon
- Format: `postgresql://user:password@host/dbname?sslmode=require`
- Verify in [Neon Dashboard](https://console.neon.tech) > Connection Details

### `bun db:generate` creates empty migration

**Solution**: No schema changes detected. Drizzle compares your `schema.ts` against the database. Make sure you've actually modified `packages/database/schema.ts`.

### Drizzle Studio won't open

**Error**: Port already in use

**Solution**: Kill existing Drizzle Studio processes or use a different port:

```bash
lsof -i :4983 | grep LISTEN  # Find the process
kill <PID>                     # Kill it
bun db:studio                  # Restart
```

## TypeScript & Builds

### Type errors in monorepo imports

**Error**: `Cannot find module '@rpg-life/shared'`

**Solution**: Build dependent packages first:

```bash
bun turbo build
```

Or run type-check which handles the dependency order:

```bash
bun type-check
```

### Next.js lockfile detection warning

**Warning**: `Lockfile was not detected`

**Solution**: This is expected in a monorepo. The `outputFileTracingRoot` in `next.config.ts` handles this. The warning is harmless.

### Expo type errors with React 19

**Error**: React 19 types conflict with Expo's React 18

**Solution**: The mobile tsconfig has `paths` overrides to force local React 18 types. If you see errors after updating `@types/react` at the root, check that `apps/mobile/tsconfig.json` still has:

```json
{
  "compilerOptions": {
    "paths": { "react": ["./node_modules/@types/react"] }
  }
}
```

## tRPC

### `createCaller is not a function`

**Solution**: tRPC v11 uses `createCallerFactory`:

```typescript
import { createCallerFactory } from '../trpc';
import { appRouter } from '../routers';

const createCaller = createCallerFactory(appRouter);
const caller = createCaller(ctx);
```

### Input validation errors in tests

**Error**: `TRPCError: [BAD_REQUEST]`

**Solution**: Check your input against the Zod schema. Common issues:

- Empty string where `min(1)` is required
- Missing required fields
- UUID format mismatch (use `crypto.randomUUID()`)

## Auth (Better Auth)

### Auth tables missing

**Error**: `relation "user" does not exist`

**Solution**: Auth tables are created by Better Auth's migration, not Drizzle:

```bash
bunx @better-auth/cli migrate
```

Or use `bun db:push` which pushes the full schema including auth tables.

### Session not persisting

**Solution**: Check that:

1. `BETTER_AUTH_URL` matches your API URL
2. `BETTER_AUTH_SECRET` is set
3. Cookies are being sent (check browser DevTools > Application > Cookies)
4. CORS is configured for your web URL (`WEB_URL` env var)

## Rate Limiting & Redis

### Rate limiting not working (all requests pass through)

**Solution**: This is the expected "fail open" behavior when Redis is not configured. To enable rate limiting:

1. Create a free [Upstash Redis](https://console.upstash.com) database
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`

### Redis connection errors in logs

**Solution**: Redis errors are caught and logged — the app continues working without rate limiting. If you want to suppress these in development, simply remove the `UPSTASH_REDIS_*` env vars.

## CI/CD

### CI failing on `bun.lock` mismatch

**Solution**: Dependabot PRs that update `package.json` need the lockfile regenerated:

```bash
git checkout <branch>
bun install      # Regenerates bun.lock
git add bun.lock
git commit -m "chore: regenerate bun.lock"
git push
```

### Workflow merge fails with "workflow scope" error

**Error**: `refusing to allow an OAuth App to create or update workflow`

**Solution**: PRs that modify `.github/workflows/` files can't be merged via the `gh` CLI. Merge them through the GitHub web UI instead.
