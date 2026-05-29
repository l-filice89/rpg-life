# Dynamic Port Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let developers override any app's port by editing only the root `.env` file, with zero behavior change when the vars are unset.

**Architecture:** Add named `PORT_*` env vars to both `.env.example` files, wire shell fallback syntax into each app's `package.json` scripts, rename `PORT` → `PORT_API` in the API's Zod env schema, and update `index.ts` to prefer Railway's injected `PORT` in production. Add all five vars to `turbo.json` `globalEnv` for cache busting.

**Tech Stack:** Bun, Turborepo, Zod, Next.js, Storybook 8, POSIX shell fallback syntax (`${VAR:-default}`)

---

## File Map

| Action | File                                 | What changes                                                           |
| ------ | ------------------------------------ | ---------------------------------------------------------------------- |
| Modify | `.env.example`                       | Replace `PORT=3002` with `PORT_WEB/API/MARKETING/DOCS/STORYBOOK` block |
| Modify | `apps/api/.env.example`              | Replace `PORT=3002` with `PORT_API=3002`                               |
| Modify | `apps/api/src/lib/env.ts:4`          | Rename schema key `PORT` → `PORT_API`                                  |
| Modify | `apps/api/src/index.ts:5`            | `port: env.PORT` → `port: Number(process.env.PORT ?? env.PORT_API)`    |
| Modify | `apps/api/src/__tests__/env.test.ts` | Rename `PORT` → `PORT_API` in inline schema + all assertions           |
| Modify | `apps/web/package.json`              | `dev` script: add `--port ${PORT_WEB:3000}`                           |
| Modify | `apps/marketing/package.json`        | `dev`+`start` scripts: add `--port ${PORT_MARKETING:-3001}`            |
| Modify | `apps/docs/package.json`             | `dev`+`start` scripts: add `--port ${PORT_DOCS:-3003}`                 |
| Modify | `apps/storybook/package.json`        | `storybook:dev` script: `-p ${PORT_STORYBOOK:-6006}`                   |
| Modify | `turbo.json`                         | Add 5 `PORT_*` vars to `globalEnv` array                               |
| Modify | `CLAUDE.md`                          | Rename `PORT` → `PORT_API` in env vars table, update description       |

---

## Task 1: Update env schema + test — rename PORT → PORT_API

This is the riskiest change (breaks TypeScript types everywhere `env.PORT` is referenced). Do it first so type-check catches any missed references immediately.

**Files:**

- Modify: `apps/api/src/lib/env.ts:4`
- Modify: `apps/api/src/index.ts:5`
- Modify: `apps/api/src/__tests__/env.test.ts:8,34,71,73`

- [ ] **Step 1: Run existing tests to confirm they pass before touching anything**

```bash
cd apps/api && bun test src/__tests__/env.test.ts
```

Expected: 6 tests pass, 0 failures.

- [ ] **Step 2: Rename `PORT` → `PORT_API` in `apps/api/src/lib/env.ts`**

Change line 4 from:

```ts
PORT: z.coerce.number().default(3002),
```

To:

```ts
PORT_API: z.coerce.number().default(3002),
```

- [ ] **Step 3: Update `apps/api/src/index.ts` to use Railway-safe fallback**

Change line 5 from:

```ts
port: env.PORT,
```

To:

```ts
port: Number(process.env.PORT ?? env.PORT_API),
```

- [ ] **Step 4: Rename `PORT` → `PORT_API` in `apps/api/src/__tests__/env.test.ts`**

The test file has its own inline copy of the schema (does not import from `env.ts`). Change all five occurrences:

Line 66 — test description string:

```ts
// Before
test('coerces PORT to number', () => {
// After
test('coerces PORT_API to number', () => {
```

Line 8 — schema definition:

```ts
// Before
PORT: z.coerce.number().default(3002),
// After
PORT_API: z.coerce.number().default(3002),
```

Line 34 — default assertion:

```ts
// Before
expect(result.PORT).toBe(3002);
// After
expect(result.PORT_API).toBe(3002);
```

Line 71 — coerce test input:

```ts
// Before
PORT: '8080',
// After
PORT_API: '8080',
```

Line 73 — coerce assertion:

```ts
// Before
expect(result.PORT).toBe(8080);
// After
expect(result.PORT_API).toBe(8080);
```

- [ ] **Step 5: Run tests — expect all 6 to pass**

```bash
cd apps/api && bun test src/__tests__/env.test.ts
```

Expected: 6 tests pass, 0 failures.

- [ ] **Step 6: Run type-check across the whole monorepo**

```bash
cd /path/to/repo && bun turbo type-check
```

Expected: Exit 0. If you see `Property 'PORT' does not exist`, you missed a reference — grep for `env\.PORT[^_]` and fix it.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/lib/env.ts apps/api/src/index.ts apps/api/src/__tests__/env.test.ts
git commit -m "feat: rename PORT → PORT_API in API env schema and index"
```

---

## Task 2: Update .env.example files

**Files:**

- Modify: `.env.example:12-13`
- Modify: `apps/api/.env.example:18-19`

- [ ] **Step 1: Replace `PORT=3002` in root `.env.example`**

The root `.env.example` currently has:

```
# API server port (default: 3002)
PORT=3002
```

Replace those two lines with:

```env
# App ports — override in .env to change local dev ports
PORT_WEB=3000
PORT_API=3002
PORT_MARKETING=3001
PORT_DOCS=3003
PORT_STORYBOOK=6006
```

- [ ] **Step 2: Replace `PORT=3002` in `apps/api/.env.example`**

`apps/api/.env.example` line 18-19 currently has:

```
# Server
PORT=3002
```

Change to:

```
# Server
PORT_API=3002
```

- [ ] **Step 3: Commit**

```bash
git add .env.example apps/api/.env.example
git commit -m "feat: replace PORT with PORT_* vars in .env.example files"
```

---

## Task 3: Update app package.json scripts with shell fallback ports

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/marketing/package.json`
- Modify: `apps/docs/package.json`
- Modify: `apps/storybook/package.json`

- [ ] **Step 1: Update `apps/web/package.json` dev script**

Current `dev` script: `"next dev --port 3000"`

Change to: `"next dev --port ${PORT_WEB:3000}"`

(`start` script has no `--port` flag — Next.js defaults to 3000, matching `PORT_WEB`'s default — leave it unchanged.)

- [ ] **Step 2: Update `apps/marketing/package.json` dev and start scripts**

Current scripts:

```json
"dev": "next dev --port 3001",
"start": "next start --port 3001",
```

Change to:

```json
"dev": "next dev --port ${PORT_MARKETING:-3001}",
"start": "next start --port ${PORT_MARKETING:-3001}",
```

- [ ] **Step 3: Update `apps/docs/package.json` dev and start scripts**

Current scripts:

```json
"dev": "next dev --port 3003",
"start": "next start --port 3003",
```

Change to:

```json
"dev": "next dev --port ${PORT_DOCS:-3003}",
"start": "next start --port ${PORT_DOCS:-3003}",
```

- [ ] **Step 4: Update `apps/storybook/package.json` storybook:dev script**

Current script: `"storybook:dev": "storybook dev -p 6006"`

Change to: `"storybook:dev": "storybook dev -p ${PORT_STORYBOOK:-6006}"`

- [ ] **Step 5: Verify dev still starts on the default port**

```bash
bun turbo dev --filter=@rpg-life/marketing &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
kill %1
```

Expected: `200` (or `307` for redirect). The default port must still work without setting any env vars.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/marketing/package.json apps/docs/package.json apps/storybook/package.json
git commit -m "feat: use PORT_* shell fallback syntax in app dev/start scripts"
```

---

## Task 4: Update turbo.json globalEnv

**Files:**

- Modify: `turbo.json:3-13`

- [ ] **Step 1: Add the five PORT\_\* vars to the `globalEnv` array**

Current `globalEnv` (9 entries):

```json
"globalEnv": [
  "DATABASE_URL",
  "JWT_SECRET",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "WEB_URL",
  "MARKETING_URL",
  "ANTHROPIC_API_KEY",
  "DOCS_URL",
  "NEXT_PUBLIC_API_URL"
],
```

Add 5 entries at the end:

```json
"globalEnv": [
  "DATABASE_URL",
  "JWT_SECRET",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "WEB_URL",
  "MARKETING_URL",
  "ANTHROPIC_API_KEY",
  "DOCS_URL",
  "NEXT_PUBLIC_API_URL",
  "PORT_WEB",
  "PORT_API",
  "PORT_MARKETING",
  "PORT_DOCS",
  "PORT_STORYBOOK"
],
```

- [ ] **Step 2: Commit**

```bash
git add turbo.json
git commit -m "chore: add PORT_* vars to turbo.json globalEnv for cache busting"
```

---

## Task 5: Update CLAUDE.md docs

**Files:**

- Modify: `CLAUDE.md` (environment variables table)

- [ ] **Step 1: Find and update the PORT row in CLAUDE.md**

In the environment variables table (search for `| \`PORT\``), change:

```md
| `PORT` | API server port (default: 3002) | No |
```

To:

```md
| `PORT_API` | API server port (default: 3002, overridden by Railway's `PORT` in production) | No |
```

Also add the remaining port vars below it:

```md
| `PORT_WEB` | Web app port (default: 3000) | No |
| `PORT_MARKETING` | Marketing site port (default: 3001) | No |
| `PORT_DOCS` | Docs site port (default: 3003) | No |
| `PORT_STORYBOOK` | Storybook port (default: 6006) | No |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md env vars table — PORT → PORT_API, add PORT_* vars"
```

---

## Task 6: Full verification

- [ ] **Step 1: Run type-check**

```bash
bun turbo type-check
```

Expected: Exit 0.

- [ ] **Step 2: Run API tests**

```bash
cd apps/api && bun test
```

Expected: All tests pass, 0 failures.

- [ ] **Step 3: Run build**

```bash
bun turbo build
```

Expected: Exit 0 across all apps.

- [ ] **Step 4: Smoke-test PORT_API override (local dev path)**

```bash
cd apps/api && PORT_API=3099 bun run src/index.ts &
sleep 2
curl -s http://localhost:3099/health
kill %1
```

Expected: Response from the API on port 3099 (not 3002).

- [ ] **Step 5: Smoke-test PORT override (Railway production path)**

```bash
cd apps/api && PORT=3098 bun run src/index.ts &
sleep 2
curl -s http://localhost:3098/health
kill %1
```

Expected: Response from the API on port 3098. This validates that Railway's injected `PORT` takes precedence over `PORT_API`.

- [ ] **Step 6: Move PRD idea to completed and commit**

```bash
git rm wiki/inbox/idea-dynamic-port-config.md
git commit -m "chore: close dynamic port config idea — implemented"
```
