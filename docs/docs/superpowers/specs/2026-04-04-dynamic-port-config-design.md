# Dynamic Port Configuration — Design Spec

**Date:** 2026-04-04
**Scope:** Root `.env`-driven port overrides for all monorepo apps, zero behavior change when unset.

---

## 1. Problem

Developers cloning rpg-life who want to run apps on non-default ports must hunt down hardcoded port numbers across multiple `package.json` files. There is no single place to change ports.

---

## 2. Goal

A developer edits only the root `.env` file to change any app's port. Existing behavior is preserved when vars are not set (shell fallbacks provide the same defaults). Railway production is unaffected.

---

## 3. Approach

**Named `PORT_*` vars** in root `.env.example` with shell fallback syntax in app scripts. The API renames its schema key from `PORT` to `PORT_API`; `index.ts` reads `process.env.PORT ?? env.PORT_API` so Railway's injected `PORT` still takes precedence in production.

---

## 4. File Changes

### 4.1 Root `.env.example`

Replace the existing `PORT=3002` line with the full `PORT_*` block:

```env
# App ports (override in .env to change local dev ports)
PORT_WEB=3000
PORT_API=3002
PORT_MARKETING=3001
PORT_DOCS=3003
PORT_STORYBOOK=6006
```

### 4.2 `apps/api/src/lib/env.ts`

Rename the schema key:

```ts
// Before
PORT: z.coerce.number().default(3002),

// After
PORT_API: z.coerce.number().default(3002),
```

### 4.3 `apps/api/src/index.ts`

Railway injects `PORT` at runtime. Read it first, fall back to the validated `PORT_API`:

```ts
// Before
port: env.PORT,

// After
port: Number(process.env.PORT ?? env.PORT_API),
```

### 4.4 App `package.json` scripts

| App              | Script          | Before                   | After                                       |
| ---------------- | --------------- | ------------------------ | ------------------------------------------- |
| `apps/web`       | `dev`           | `next dev --port 3000`   | `next dev --port ${PORT_WEB:3000}`         |
| `apps/marketing` | `dev`           | `next dev --port 3001`   | `next dev --port ${PORT_MARKETING:-3001}`   |
| `apps/marketing` | `start`         | `next start --port 3001` | `next start --port ${PORT_MARKETING:-3001}` |
| `apps/docs`      | `dev`           | `next dev --port 3003`   | `next dev --port ${PORT_DOCS:-3003}`        |
| `apps/docs`      | `start`         | `next start --port 3003` | `next start --port ${PORT_DOCS:-3003}`      |
| `apps/storybook` | `storybook:dev` | `storybook dev -p 6006`  | `storybook dev -p ${PORT_STORYBOOK:-6006}`  |

`apps/web` has a `start` script (`next start`) but no `--port` flag — Next.js defaults to 3000 without one, matching `PORT_WEB`'s default. No port flag change needed there.

### 4.5 `turbo.json` — `globalEnv`

Add all five vars so Turbo busts cache when ports change:

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
]
```

### 4.6 `apps/api/.env.example`

A per-app `.env.example` exists at `apps/api/.env.example` with `PORT=3002`. Replace that line with `PORT_API=3002`.

### 4.7 `apps/api/src/__tests__/env.test.ts`

The env test file references `PORT` by name (passes `PORT: '8080'` and asserts `result.PORT`). Rename all occurrences of `PORT` → `PORT_API` throughout the test file to match the schema rename.

### 4.8 `CLAUDE.md`

Update the environment variables table: rename `PORT` row to `PORT_API`, keep `Required: No` and update the description to "API server port (default: 3002, overridden by Railway's `PORT` in production)".

---

## 5. Constraints

- Shell fallback `${VAR:-default}` preserves existing behavior when vars are not set — no developer action required after pulling.
- `.env` is gitignored — only `.env.example` is committed.
- Railway injects `PORT` at runtime; `index.ts` must read `process.env.PORT` first so production is unaffected by the rename.
- `apps/api/.env.example` exists and also needs `PORT` → `PORT_API` updated.
- Shell fallback syntax `${VAR:-default}` is POSIX-only. Windows is out of scope for this repo (all CI runs on Linux, contributors are expected to use macOS/Linux or WSL).

---

## 6. Testing

| Check                          | Command                                             | Expected           |
| ------------------------------ | --------------------------------------------------- | ------------------ |
| Type-check passes after rename | `bun turbo type-check`                              | Exit 0             |
| API boots on renamed var       | `cd apps/api && PORT_API=3002 bun run src/index.ts` | Server starts      |
| Web boots on named var         | `PORT_WEB=3000 bun turbo dev --filter=@rpg-life/web`      | Dev server at 3000 |
| No build regression            | `bun turbo build`                                   | Exit 0             |

---

## 7. Out of Scope

- Per-app `.env` files — not used in this repo
- Mobile/desktop apps — no dev-server port concept
- Storybook `start` script — storybook serves static output via its own built-in server, port flag already works
