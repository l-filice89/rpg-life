# E2E Fixtures

## `auth.ts` — Authenticated session fixture

Magic-link auth cannot be automated in CI (no email client). Instead, a
dedicated test-only API endpoint seeds a real user + session directly in the
database and returns the session cookie.

### Contract

```
POST /api/auth/test-session   (proxied by Next.js rewrite → Hono API)
Content-Type: application/json

{ "email": "e2e-test@rpg-life.test", "focusBalance"?: number }

→ 200 { userId }
← Set-Cookie: better-auth.session_token=<token>; HttpOnly; SameSite=Lax; Path=/
```

The endpoint is **strictly gated to `NODE_ENV=test`** and returns `403` in
all other environments.

### Usage

**Default fixture (`authenticatedPage`)** — use for most specs:

```typescript
import { test, expect } from './fixtures/auth';

test('my spec', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/quest-board');
  // page is authenticated as e2e-test@rpg-life.test
});
```

**Custom options** — use `createAuthPage` when you need a specific focus
balance or a different email:

```typescript
import { test, expect, createAuthPage } from './fixtures/auth';

test('focus spec', async ({ browser }) => {
  const { page, context } = await createAuthPage(browser, { focusBalance: 5 });
  await page.goto('/quest-board');
  // ...
  await context.close();
});
```

### Seeding quests from specs

Use the tRPC mutation endpoint from an authenticated `APIRequestContext`:

```typescript
// Inside a test that already has authenticatedPage set up
const apiReq = await request.newContext({
  baseURL: 'http://localhost:3000',
  extraHTTPHeaders: {
    Cookie: await getSessionCookie(authenticatedPage),
  },
});
await apiReq.post('/api/trpc/tasks.create', {
  data: { json: { title: 'My Quest', difficulty: 'easy', skillCodes: ['MND'], dueDate: null } },
});
```
