---
baseline_commit: c664fe0
---

# Story 4.1: Playwright E2E Test Suite

Status: done

## Story

As a **builder**,
I want automated end-to-end tests covering critical user journeys,
So that regressions in the core loop are caught before merge.

## Acceptance Criteria

1. **Given** the implemented MVP features from Epics 1–3 **When** Playwright E2E suite runs **Then** at least **5 passing specs** exist covering: auth gate smoke, Quest create (UJ-1), Quest complete + reward (UJ-2), Profile refresh (UJ-3), and Focus reschedule or filter flow (UJ-4) (SC3, NFR10).

2. **And** tests use `@playwright/test` 1.58.2 (already installed) against local dev stack or CI equivalent.

3. **And** E2E validates full Quest CRUD path contributes to SC1 verification.

4. **And** all specs are located under `apps/web/e2e/`.

5. **And** `bun run type-check` remains green after adding test files.

## Tasks / Subtasks

- [x] **Task 1: Authenticated test fixture** (AC: #1–#3 — prerequisite for UJ-1 through UJ-4)
  - [x] Create `apps/web/e2e/fixtures/auth.ts` — Playwright fixture that seeds a test user and injects a session cookie
  - [x] Add `/api/auth/test-session` route in `apps/api/src/middleware/` gated strictly to `NODE_ENV=test`; endpoint accepts `{ email }`, creates/fetches the user via DB, calls better-auth session creation, returns `Set-Cookie` header
  - [x] Fixture: call test-session endpoint via `request.post`, store cookies in `storageState`, use `test.use({ storageState })` in authenticated specs
  - [x] Fixture must also seed a test user row + `user_progress` row if missing (idempotent)
  - [x] Document the fixture contract in `apps/web/e2e/fixtures/README.md` (brief inline comment is sufficient)

- [x] **Task 2: Auth gate smoke spec (existing + extend)** (AC: #1)
  - [x] `apps/web/e2e/auth.spec.ts` already contains 4 auth-gate tests — **keep as-is**; they cover auth gate smoke (NFR10 partially)
  - [x] Verify all 4 existing tests pass after fixture infrastructure added

- [x] **Task 3: Quest create spec — UJ-1** (AC: #1, #3)
  - [x] Create `apps/web/e2e/quest-create.spec.ts`
  - [x] Use authenticated fixture (`test.use({ storageState: authenticatedState })`)
  - [x] Spec: navigate to `/quest-board` → tap FAB → assert Create Quest sheet opens → fill title ("E2E test quest") → select 1 Skill chip → click Save → assert quest row appears in board with correct title
  - [x] Spec: attempt save without Skill → assert save button disabled (validation gate)
  - [x] Clean up: soft-delete created quest at end of spec (via API request or direct DB, isolated per test)

- [x] **Task 4: Quest complete + reward spec — UJ-2** (AC: #1, #3)
  - [x] Create `apps/web/e2e/quest-complete.spec.ts`
  - [x] Fixture: seed a known open Quest via `POST /api/auth/test-seed` before test (authenticated via cookie)
  - [x] Spec: navigate to quest board → find seeded quest row → click checkbox → assert confirm modal opens with "Mark this quest complete?" → click Yes → assert reward modal visible within 2s → assert per-Skill XP appears → click Continue → assert quest no longer in open list
  - [x] Spec: board-clear path — if seeded quest was the only one, assert board-clear empty state appears after Continue

- [x] **Task 5: Profile refresh spec — UJ-3** (AC: #1)
  - [x] Create `apps/web/e2e/profile.spec.ts`
  - [x] Spec: navigate to My Profile → assert Hero level visible → assert XP bars for all 7 Skills visible → assert Focus balance visible
  - [x] Spec: Profile shows 7 Skill rows even at 0 XP (navigate fresh, no prior completions for user)

- [x] **Task 6: Focus reschedule spec — UJ-4** (AC: #1)
  - [x] Create `apps/web/e2e/focus-reschedule.spec.ts`
  - [x] Fixture setup: seed a test user with `focus_balance >= 1` (set via test-session `focusBalance` param), seed an overdue quest (`due_date` in the past via test-seed)
  - [x] Spec: navigate to Quest Board → find overdue quest row → click Edit → change due date to future → click Save → assert "Spend 1 Focus" dialog → confirm → assert "Quest rescheduled" toast → assert Focus balance decremented in header

- [x] **Task 7: Wire E2E into CI** (preliminary — full wiring is Story 4.2)
  - [x] Verify `playwright.config.ts` `webServer` config is correct (already configured for ports 3000/3002)
  - [x] Confirm `npx playwright test` runs locally against `bun dev`
  - [x] Add `"e2e": "playwright test"` script to `apps/web/package.json` if not present

### Review Findings

- [x] [Review][Patch] Shared test user causes cross-spec race conditions and flaky parallel runs [apps/web/e2e/fixtures/auth.ts:4]
- [x] [Review][Patch] `test-session` user upsert is non-atomic and can fail under concurrent requests [apps/api/src/middleware/test-session.ts:49]
- [x] [Review][Patch] `delete-all-quests` cleanup fails on overdue quests, leaving dirty state between tests [apps/api/src/middleware/test-session.ts:204]
- [x] [Review][Patch] `test-seed` trusts request email without binding to session identity, enabling cross-user mutation in test env [apps/api/src/middleware/test-session.ts:160]
- [x] [Review][Patch] Auth fixture does not fail fast when `Set-Cookie` is missing or unparsable [apps/web/e2e/fixtures/auth.ts:41]
- [x] [Review][Patch] Profile UJ-3 spec does not explicitly assert XP bar UI elements for all seven skills [apps/web/e2e/profile.spec.ts:22]
- [x] [Review][Patch] Test endpoint logs include raw email PII in backend logs [apps/api/src/middleware/test-session.ts:59]

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `apps/web/e2e/auth.spec.ts` (4 tests) | **Keep** — auth gate smoke; all 4 pass |
| `apps/web/playwright.config.ts` | **Keep/verify** — testDir `./e2e`, webServer ports 3000/3002 |
| `@playwright/test: 1.58.2` in root `package.json` | **Use** — already installed |
| No authenticated fixture | **Create** — `e2e/fixtures/auth.ts` |
| No quest-create/complete/profile/focus specs | **Create** — 4 new spec files |

[Source: `apps/web/e2e/auth.spec.ts`, `apps/web/playwright.config.ts`, root `package.json`]

### Authenticated Fixture Strategy (Critical — T1 from Epic 3 Retro)

Magic link auth cannot be automated in CI (no email client). Solution: test-session endpoint.

```
apps/api/src/middleware/test-session.ts   # NEW — only mounted when NODE_ENV=test
apps/web/e2e/fixtures/auth.ts             # NEW — Playwright fixture
```

Test-session endpoint contract:
- Route: `POST /api/auth/test-session`
- Body: `{ email: string }` (use `e2e-test@rpg-life.test`)
- Guards: `if (process.env.NODE_ENV !== 'test') return 403`
- Action: upsert user row → upsert `user_progress` row → create better-auth session → return session cookie
- Returns: `200 { userId }` with `Set-Cookie: better-auth.session_token=...`

Playwright fixture usage:
```typescript
// e2e/fixtures/auth.ts
import { test as base, request } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const req = await request.newContext({ baseURL: 'http://localhost:3000' });
    const res = await req.post('/api/auth/test-session', {
      data: { email: 'e2e-test@rpg-life.test' },
    });
    const cookies = res.headers()['set-cookie'];
    // parse cookies and add to context
    await ctx.addCookies(parseCookies(cookies));
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});
```

[Source: `epic-3-retro-2026-06-04.md` T1; `apps/api/src/app.ts` for middleware mount pattern]

### Existing Auth Tests (Keep Intact)

`auth.spec.ts` tests:
1. Redirects `/` → `/sign-in` (unauthenticated)
2. Redirects `/quest-board` → `/sign-in`
3. Redirects `/profile` → `/sign-in`
4. Invalid email shows "Enter a valid realm address"

These cover auth gate smoke. They count toward the 5-spec minimum.

[Source: `apps/web/e2e/auth.spec.ts`]

### Spec File Map

| File | UJ | Tests |
|------|-----|-------|
| `auth.spec.ts` | Gate | 4 existing |
| `quest-create.spec.ts` | UJ-1 | create valid quest, save-disabled validation |
| `quest-complete.spec.ts` | UJ-2 | complete → reward modal → board-clear |
| `profile.spec.ts` | UJ-3 | profile shows all 7 skills, hero level |
| `focus-reschedule.spec.ts` | UJ-4 | overdue reschedule with 1 Focus spend |

Minimum 5 specs must pass in CI (NFR10).

### Quest Seeding Pattern

Prefer using the tRPC client via authenticated `request` context to seed test data:
```typescript
// In test setup — POST directly to tRPC procedure
const res = await authenticatedRequest.post('/api/trpc/tasks.create', {
  data: { title: 'E2E Quest', difficulty: 'easy', skillIds: [1], dueDate: null },
});
```

If tRPC batch format is tricky, add a thin `POST /api/test-seed` endpoint (test-only) that creates a quest + optionally sets focus balance.

### Playwright Config Notes

Current `playwright.config.ts`:
- `baseURL: http://localhost:3000`
- `testDir: ./e2e`
- `fullyParallel: true` (local) / `workers: 1` (CI)
- `retries: 2` in CI
- WebServer: starts `bun turbo dev` for both api and web

**For CI (Story 4.2):** E2E will run against docker-compose stack or pre-started services, not the dev server `webServer` config. Story 4.2 handles CI wiring.

### Anti-Patterns (Do Not)

- ❌ Do NOT bypass auth by testing internal functions — test from browser perspective only
- ❌ Do NOT use `page.waitForTimeout(n)` — use `expect(locator).toBeVisible()` with Playwright auto-wait
- ❌ Do NOT share mutable test data across specs — each spec must be isolated
- ❌ Do NOT mount test-session endpoint in production (`NODE_ENV !== 'test'` guard is mandatory)
- ❌ Do NOT skip the Focus spec — UJ-4 is a required path (NFR10)

### Project Structure

```
apps/web/e2e/
  auth.spec.ts                    # EXISTING — keep
  quest-create.spec.ts            # NEW
  quest-complete.spec.ts          # NEW
  profile.spec.ts                 # NEW
  focus-reschedule.spec.ts        # NEW
  fixtures/
    auth.ts                       # NEW — authenticated page fixture

apps/api/src/middleware/
  test-session.ts                 # NEW — gated by NODE_ENV=test
apps/api/src/app.ts               # UPDATE — mount test-session route
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.1, SC3, NFR10]
- [Source: `apps/web/playwright.config.ts`]
- [Source: `apps/web/e2e/auth.spec.ts`]
- [Source: `_bmad-output/implementation-artifacts/epic-3-retro-2026-06-04.md` — T1, T2]
- [Source: `_bmad-output/implementation-artifacts/3-2-confirm-and-complete-quest.md`]
- [Source: `_bmad-output/implementation-artifacts/3-3-reward-modal-and-hero-level-up-celebration.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5

### Debug Log References

- `@rpg-life/validators` not a direct dep of `apps/api` — inlined `SkillCode` type to avoid import error
- `isNull` / `tasks` imports added then removed (unused after switching to `listOpenTasksByOwner`)
- `delete-all-quests` action added to `test-seed` to simplify beforeEach/afterEach cleanup without tracking individual task IDs

### Completion Notes List

- AC#1: 5+ passing specs — auth.spec.ts (4 existing), quest-create.spec.ts (2), quest-complete.spec.ts (2), profile.spec.ts (2), focus-reschedule.spec.ts (1) — total 11 specs across 5 files covering UJ-1 through UJ-4
- AC#2: Uses `@playwright/test` 1.58.2 already installed in root package.json
- AC#3: Quest CRUD path (create → list → complete → delete cleanup) covered by UJ-1 and UJ-2 specs
- AC#4: All specs under `apps/web/e2e/` ✓
- AC#5: `bun run type-check` green in both `apps/api` and `apps/web` ✓
- Added `POST /api/auth/test-session` — upserts user + user_progress (with `tutorialSeenAt` set to suppress tutorial overlay), creates better-auth session by direct DB insert, returns `Set-Cookie`
- Added `POST /api/auth/test-seed` — thin test-only endpoint for create-quest / delete-quest / delete-all-quests actions; avoids tRPC HTTP protocol complexity in specs
- Both test endpoints strictly gated by `NODE_ENV=test` guard, mounted before the auth wildcard in Hono so they are matched first
- `createAuthPage(browser, { focusBalance })` helper in `auth.ts` allows per-spec focus balance setup (used by focus-reschedule spec)
- `page.request.post()` used for seeding/cleanup within specs — inherits session cookie from browser context automatically

### File List

- `apps/api/src/middleware/test-session.ts` (new)
- `apps/api/src/app.ts` (modified — mount test-session + test-seed routes)
- `apps/web/e2e/fixtures/auth.ts` (new)
- `apps/web/e2e/fixtures/README.md` (new)
- `apps/web/e2e/quest-create.spec.ts` (new)
- `apps/web/e2e/quest-complete.spec.ts` (new)
- `apps/web/e2e/profile.spec.ts` (new)
- `apps/web/e2e/focus-reschedule.spec.ts` (new)
- `apps/web/package.json` (modified — added `"e2e": "playwright test"` script)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status updated)

### Change Log

- 2026-06-04: Story 4.1 — Playwright E2E test suite context created
- 2026-06-04: Story 4.1 — Implementation complete: test-session/test-seed API endpoints, auth fixture, 4 new spec files covering UJ-1 through UJ-4

## Story Completion Status

- Status: **review**
- Depends on: Epic 1–3 all done
- Next: Story 4.2 (CI pipeline wires these E2E specs into CI with coverage gate)
