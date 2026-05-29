# Testing Conventions

This document describes the testing patterns, helpers, and conventions for the rpg-life monorepo.

## Test Runner

All tests use **Bun's built-in test runner** (`bun test`). It's Jest-compatible (`describe`, `test`, `expect`) and runs TypeScript natively with zero configuration.

```bash
# Run all tests across the monorepo
bun turbo test

# Run tests in a specific workspace
cd apps/api && bun test

# Run a single test file
bun test apps/api/src/__tests__/projects.test.ts

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## Test Pyramid

| Level           | Proportion | What to Test                                               | Speed           |
| --------------- | ---------- | ---------------------------------------------------------- | --------------- |
| **Unit**        | 60-70%     | Pure functions, validators, formatters, business logic     | < 5ms per test  |
| **Integration** | 20-30%     | tRPC routers, DB queries, auth flows, middleware           | < 50ms per test |
| **E2E**         | 5-10%      | Critical user journeys only (signup, login, core features) | < 5s per test   |

## File Naming

| Convention  | Use For                    | Example            |
| ----------- | -------------------------- | ------------------ |
| `*.test.ts` | Unit and integration tests | `projects.test.ts` |
| `*.spec.ts` | E2E tests (Playwright)     | `auth.spec.ts`     |

## Test Location

- **Unit/integration tests**: Co-located with source in `__tests__/` directories
- **E2E tests**: In `e2e/` directory within the app workspace
- **Test helpers**: In `__tests__/helpers/` within each workspace
- **Mock factories**: In `__tests__/mocks/` within each workspace

## Test Patterns

### tRPC Router Testing (via createCaller)

The primary pattern for testing tRPC routers. Tests procedures directly without HTTP overhead.

```typescript
import { describe, test, expect } from 'bun:test';
import {
  createTestContext,
  createCaller,
  createMockDb,
  createTestUser,
  testProject,
} from './helpers';

describe('projects.create', () => {
  test('creates project with user as owner', async () => {
    const db = createMockDb({ insert: [testProject] });
    const ctx = createTestContext({
      db,
      user: createTestUser(),
    });
    const caller = createCaller(ctx);

    const result = await caller.projects.create({
      name: 'Test Project',
    });

    expect(result).toEqual(testProject);
  });

  test('rejects unauthenticated request', async () => {
    const caller = createCaller(createTestContext({ user: null }));

    await expect(caller.projects.create({ name: 'Test' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
```

### Hono Integration Testing (via app.request)

Tests HTTP-level behavior without starting a server.

```typescript
import { describe, test, expect } from 'bun:test';
import { app } from '../index';

describe('Health check', () => {
  test('GET /health returns 200', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
```

### Zod Schema Validation Testing

```typescript
import { describe, test, expect } from 'bun:test';
import { CreateUserSchema } from '@rpg-life/shared';

describe('CreateUserSchema', () => {
  test('accepts valid input', () => {
    const result = CreateUserSchema.safeParse({
      email: 'user@test.com',
      name: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid email', () => {
    const result = CreateUserSchema.safeParse({
      email: 'not-an-email',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });
});
```

## Test Helpers

### Location: `apps/api/src/__tests__/helpers/`

| Helper                          | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `createTestContext(overrides?)` | Creates a mock tRPC context. Default: anonymous user, mock DB.   |
| `createCaller(ctx)`             | Creates a tRPC caller from a context for direct procedure calls. |
| `createMockDb(config?)`         | Proxy-based mock DB with chainable query API.                    |
| `createTestUser(overrides?)`    | Creates a User object matching the tRPC User type.               |

### Fixtures: `apps/api/src/__tests__/helpers/fixtures.ts`

| Fixture                | Description                       |
| ---------------------- | --------------------------------- |
| `TEST_USER_ID`         | Stable UUID for test user         |
| `TEST_ADMIN_ID`        | Stable UUID for test admin        |
| `TEST_PROJECT_ID`      | Stable UUID for test project      |
| `testUser`             | Full user object (role: "user")   |
| `testAdmin`            | Full admin object (role: "admin") |
| `testProject`          | Full project object               |
| `testProjectWithOwner` | Project with joined owner fields  |

## Mock Factories

### Location: `apps/api/src/__tests__/mocks/`

### AI Provider Mock (`mocks/ai.ts`)

```typescript
import { createMockAIResponse, createMockAIModule } from './mocks';

// Mock the entire module
mock.module('@rpg-life/ai-integrations', () => createMockAIModule());

// Or customize the response
const mockGenerate = createMockAIResponse({ text: 'Custom response' });
mock.module('@rpg-life/ai-integrations', () => createMockAIModule(mockGenerate));
```

### Redis Mock (`mocks/redis.ts`)

```typescript
import { createMockRedis } from './mocks';
import { _setRedisForTest } from '../lib/cache';

const redis = createMockRedis();
_setRedisForTest(redis as never);

// Direct store manipulation for test setup
redis.store.set('key', { value: 'data' });
```

## Mock Guidelines

| Mock This                                   | Don't Mock This                      |
| ------------------------------------------- | ------------------------------------ |
| External APIs (AI providers, email, Stripe) | Your own database queries            |
| Redis/cache layer                           | Auth middleware (test real behavior) |
| Third-party HTTP services                   | Zod validation                       |
| Time-dependent operations (`Date.now`)      | tRPC procedures                      |

## E2E Testing (Playwright)

E2E tests live in `apps/web/e2e/` and use Playwright.

```bash
# Run E2E tests (starts dev servers automatically)
cd apps/web && bun run test:e2e

# Interactive UI mode
cd apps/web && bun run test:e2e:ui
```

### Config: `apps/web/playwright.config.ts`

- Auto-starts API (port 3002) and web (port 3000) dev servers
- Uses Chromium by default
- Traces on first retry, screenshots on failure

### E2E Test Guidelines

- **Max 5-10 E2E tests per app** — cover critical paths only
- **Don't test what unit/integration tests cover** — E2E is for full user journeys
- **Use stable selectors** — prefer `data-testid`, `role`, or `name` over CSS classes
- **Keep tests independent** — each test creates its own state

## Environment Setup

Tests use `bunfig.toml` `[test] preload` to set environment variables before `env.ts` validates:

```toml
# apps/api/bunfig.toml
[test]
preload = ["./src/__tests__/setup.ts"]
```

The setup file sets all required env vars with test values. This prevents validation errors from eager imports.

## Coverage

```bash
# Generate coverage for a single workspace
cd apps/api && bun test --coverage

# Coverage output goes to ./coverage/ (configured in root bunfig.toml)
```

Coverage outputs are cached by Turborepo (`"outputs": ["coverage/**"]` in turbo.json).

## CI Integration

All tests run in CI via `bun turbo test`. See `.github/workflows/ci.yml` for the pipeline configuration. E2E tests run as a separate step requiring deployed preview URLs.
