---
baseline_commit: 6ad1c0a47f8116d529735782a42e24f0e5c729a9
---

# Story 1.1: Scaffold Monorepo and Development Infrastructure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **builder**,
I want the project scaffolded with the approved stack and runnable via Docker Compose,
So that I have a consistent foundation for all feature work.

## Acceptance Criteria

1. **Given** a greenfield repository **When** create-x4 (x4-mono) saas preset is scaffolded and post-scaffold adaptations are applied **Then** the monorepo contains `apps/web` (Next.js 15 RSC), `apps/api` (Bun/Hono/tRPC), and shared packages (`domain`, `db`, `auth`, `validators`, `api`, `ui`).

2. **And** SQLite is configured via `bun:sqlite` + Drizzle at `/data/rpg-life.db` with Docker volume mount.

3. **And** `docker compose up` starts web (:3000) and api (:3002) without manual wiring.

4. **And** `.env.example` documents required env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `API_URL`.

5. **And** Next.js rewrites proxy `/api/auth/*` and `/api/trpc/*` to the api service.

6. **And** initial Drizzle migration creates `user_progress` (`user_id` FK to `users`, `tutorial_seen_at` nullable timestamp, `focus_balance` integer default 0) so Tutorial persistence (Story 1.5) is available before Quest schema lands in Epic 2.

## Tasks / Subtasks

- [x] **Task 1: Scaffold create-x4 saas monorepo** (AC: #1)
  - [x] Run `bunx --bun create-x4 rpg-life --preset saas --yes` (Windows: always use `--bun` flag)
  - [x] Merge scaffold into repo root while **preserving** `_bmad/`, `_bmad-output/`, `docs/`, `.git/`
  - [x] Remove unused starter apps: `apps/mobile-main`, `apps/desktop`, `apps/marketing`
  - [x] Remove `packages/ai-integrations`
  - [x] Verify Turborepo root scripts: `bun dev` starts web + api in parallel

- [x] **Task 2: Reconfigure database Postgres → SQLite** (AC: #2)
  - [x] Rename/reconfigure `packages/database` → `packages/db` (update all workspace imports)
  - [x] Configure Drizzle with `drizzle-orm/bun-sqlite` driver
  - [x] Set `DATABASE_URL=file:/data/rpg-life.db`
  - [x] Add `drizzle.config.ts` pointing at `packages/db/schema/`
  - [x] Enable `PRAGMA foreign_keys = ON` on connection

- [x] **Task 3: Auth schema + Resend wiring** (AC: #2, #4)
  - [x] Configure better-auth in `packages/auth/src/index.ts` with magic link + Resend
  - [x] Run `bunx --bun auth@latest generate` for auth tables in `packages/db/schema/auth.ts`
  - [x] Mount auth handler at `apps/api/src/auth/handler.ts` → `/api/auth/*`
  - [x] Wire `@t3-oss/env-core` validation in api for auth/email env vars

- [x] **Task 4: `user_progress` schema + initial migration** (AC: #6)
  - [x] Create `packages/db/schema/user-progress.ts`
  - [x] Schema: `user_id` TEXT PK + FK → `users(id)`, `focus_balance` INTEGER NOT NULL DEFAULT 0 CHECK (≥ 0), `tutorial_seen_at` TEXT nullable, `modified_at` TEXT NOT NULL
  - [x] Generate migration via Drizzle Kit (`generate`, not `push`)
  - [x] Migration order: (1) better-auth tables, (2) `user_progress`
  - [x] **Do NOT** create `tasks`, `skills`, `task_skills`, `user_skills` — deferred to Story 2.1

- [x] **Task 5: tRPC + Next.js proxy wiring** (AC: #5)
  - [x] Mount tRPC fetch adapter at `apps/api/src/trpc/handler.ts` → `/api/trpc/*`
  - [x] Create skeleton `packages/api/src/root.ts` with empty `appRouter` (routers added in later stories)
  - [x] Add `apps/web/next.config.ts` rewrites to `${API_URL}/api/auth/*` and `/api/trpc/*`
  - [x] Wire RSC server caller: `apps/web/lib/trpc-server.ts`
  - [x] Wire client provider: `apps/web/components/providers/app-providers.tsx` (tRPC + TanStack Query)
  - [x] Add `@t3-oss/env-nextjs` for web env validation

- [x] **Task 6: Scaffold empty packages** (AC: #1)
  - [x] `packages/domain/` — package.json + tsconfig; stub exports only (domain logic in Story 3.1)
  - [x] `packages/validators/` — package.json + tsconfig; empty index
  - [x] `packages/ui/` — package.json + tsconfig skeleton (shadcn install in Story 1.2)
  - [x] Preserve any existing domain stubs only if compatible; otherwise replace with empty package shell

- [x] **Task 7: Docker Compose + startup migrations** (AC: #2, #3)
  - [x] Add `docker-compose.yml`: `web` (:3000), `api` (:3002), volume `./data:/data`
  - [x] Add `apps/api/Dockerfile` and `apps/web/Dockerfile`
  - [x] api container runs Drizzle `migrate` on startup (not `push`)
  - [x] Gitignore `./data/` at repo root
  - [x] web service: `API_URL=http://api:3002`; local dev: `API_URL=http://localhost:3002`

- [x] **Task 8: Environment + docs stub** (AC: #4)
  - [x] Create `.env.example` with all 6 required vars and inline comments
  - [x] Update root README with: Bun install, env setup, `bun dev`, `docker compose up` smoke steps
  - [x] Document that Resend is required even for local dev (no Mailpit)

- [x] **Task 9: Verification smoke tests** (AC: #1–#6)
  - [x] `bun dev` → web :3000 + api :3002 respond
  - [x] `docker compose up` → both services healthy; `./data/rpg-life.db` persists across restart
  - [x] DB contains better-auth `users` table + `user_progress` with correct columns
  - [x] `curl http://localhost:3000/api/trpc/` returns tRPC handler response (not connection refused)
  - [x] `curl http://localhost:3000/api/auth/` reaches auth handler (not 502)

## Dev Notes

### Brownfield Reality Check

Epics AC says "greenfield repository" but **this repo is not greenfield**. Current state:

| Exists today | Action |
|---|---|
| `_bmad/`, `_bmad-output/`, `docs/` | **Preserve** — planning artifacts |
| Root `bun-react-template` (`src/`, root `package.json`) | **Replace** with x4 monorepo structure |
| `packages/domain/src/*.ts` (stub throws) | **Replace** with empty package shell — real domain in Story 3.1 |
| `tests/`, `playwright.config.ts` at root | **Remove/replace** — E2E moves to `apps/web/e2e/` in Epic 4 |
| No `apps/`, no `docker-compose.yml` | **Create** via create-x4 + adaptations |

**Scaffold strategy:** Run create-x4 into a temp directory, then merge monorepo files into repo root. Do not scaffold inside `_bmad-output/`. Commit planning artifacts untouched.

### Target Monorepo Topology

```
apps/
  web/          Next.js 15 App Router, RSC, port 3000
  api/          Bun + Hono + tRPC, better-auth, port 3002
packages/
  api/          tRPC router definitions (shared types)
  db/           Drizzle schema, migrations, SQLite client
  auth/         better-auth server config + client helpers
  domain/       Pure progression logic (stub in 1.1; implemented 3.1)
  ui/           shadcn/ui skeleton (tokens in 1.2)
  validators/   Shared Zod schemas (empty in 1.1)
tooling/        Shared eslint, typescript, tailwind configs
docker-compose.yml
.env.example
```

[Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation, Target Monorepo Structure]

### Tech Stack (Locked Versions)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Bun ≥ 1.1 (1.3.14 current) | API runtime + package manager |
| Frontend | Next.js 15 App Router, React 19 | RSC-first |
| Backend | Bun + Hono + tRPC v11 | HTTP between web ↔ api |
| ORM | Drizzle ORM + `bun:sqlite` | No Postgres, no `pg` driver |
| Auth | better-auth magic link | Resend for email (dev + prod) |
| UI | shadcn/ui + Tailwind v4 | Structure only in 1.1; tokens in 1.2 |
| Monorepo | Turborepo + Bun workspaces | `bun dev` parallel start |
| E2E | Playwright 1.60.0 | Scaffold may include; no pass requirement in 1.1 |
| Logging | pino (api) | Never log magic link tokens |

[Source: `_bmad-output/planning-artifacts/architecture.md` — Technical Preferences, Infrastructure]

### Post-Scaffold Adaptation Sequence

Execute in this order (architecture implementation sequence step 1):

1. Remove unused apps/packages (mobile, desktop, marketing, ai-integrations)
2. Reconfigure `packages/database` → `packages/db` with SQLite
3. Add `packages/ui`, `packages/domain`, `packages/validators` skeletons
4. Add `docker-compose.yml` + Dockerfiles
5. Configure better-auth + Resend; generate auth schema
6. Add `user_progress` schema + migration
7. Wire tRPC HTTP link in Next.js (RSC server caller + React Query client)

[Source: `_bmad-output/planning-artifacts/architecture.md` L155–163, L337–346]

### `user_progress` Schema (Binding)

Story 1.1 AC is the minimum. Reconcile with architecture + brainstorming:

```typescript
// packages/db/schema/user-progress.ts — illustrative
export const userProgress = sqliteTable('user_progress', {
  userId: text('user_id').primaryKey().references(() => users.id),
  focusBalance: integer('focus_balance').notNull().default(0),
  tutorialSeenAt: text('tutorial_seen_at'), // nullable ISO timestamp
  modifiedAt: text('modified_at').notNull(), // include now — Story 2.1 must NOT alter this table
});
```

| Decision | Choice | Rationale |
|---|---|---|
| PK shape | `user_id` as PK (1:1 with user) | Matches brainstorming ER; simpler than separate `id` |
| ID format | TEXT UUID | Align with better-auth defaults; pick one format at scaffold, never mix |
| `modified_at` | Include in 1.1 | Not in AC but prevents Story 2.1 schema migration |
| `story_flags`, `last_story_level` | **Defer** | Post-MVP narrative — not in scope |

FK must reference better-auth generated `users.id` — verify column type compatibility after auth schema generate.

[Source: `_bmad-output/planning-artifacts/epics.md` L241; `architecture.md` L264; `prds/.../addendum.md` L97–106]

### `.env.example` Template

```env
# Database (api only) — local dev uses repo-root ./data volume path
DATABASE_URL=file:../../data/rpg-life.db
# Docker: DATABASE_URL=file:/data/rpg-life.db

# better-auth
BETTER_AUTH_SECRET=          # generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend — required even locally)
RESEND_API_KEY=
EMAIL_FROM=                  # verified sender in Resend dashboard

# Next.js → api proxy
API_URL=http://api:3002      # docker compose
# API_URL=http://localhost:3002  # local bun dev
```

[Source: `_bmad-output/planning-artifacts/architecture.md` L328–333]

### Next.js Rewrite Config (Expected Shape)

```typescript
// apps/web/next.config.ts
async rewrites() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3002';
  return [
    { source: '/api/auth/:path*', destination: `${apiUrl}/api/auth/:path*` },
    { source: '/api/trpc/:path*', destination: `${apiUrl}/api/trpc/:path*` },
  ];
}
```

Same-origin rewrites are **required** for HttpOnly session cookies and magic link callbacks.

[Source: `_bmad-output/planning-artifacts/architecture.md` L274, L508–513]

### Docker Compose (Expected Shape)

| Service | Port | Notes |
|---|---|---|
| `api` | 3002 | Bun Dockerfile; `./data:/data`; runs migrations on start |
| `web` | 3000 | Next.js standalone; `depends_on: api`; `API_URL=http://api:3002` |

Only api mounts `./data/`. Root `./data/` gitignored.

[Source: `_bmad-output/planning-artifacts/architecture.md` L316–320, L574–581]

### Explicit Scope Boundaries

**In scope (Story 1.1):**
- create-x4 saas scaffold + all post-scaffold adaptations listed above
- SQLite + Drizzle + auth schema + `user_progress` migration
- better-auth + Resend config (no sign-in UI — Story 1.3)
- tRPC skeleton wiring (empty router OK)
- Docker Compose runnable stack
- `.env.example` + README setup stub

**Out of scope (later stories):**
- Crystal Path design tokens / shadcn components → **Story 1.2**
- Sign-in page, magic link flow, `protectedProcedure` enforcement → **Story 1.3**
- App shell, sidebar, auth middleware gate → **Story 1.4**
- Tutorial UI + `tutorial.markSeen` → **Story 1.5**
- Quest/task schema, skills seed, business tRPC routers → **Epic 2**
- Domain unit tests with test vectors → **Story 3.1**
- CI pipeline, coverage gate, a11y audit → **Epic 4**

### Naming Conventions (Enforce at Scaffold)

| Layer | Convention | Example |
|---|---|---|
| DB tables/columns | snake_case | `user_progress`, `tutorial_seen_at` |
| tRPC | camelCase routers/procedures | `tasks.list`, `profile.get` |
| Domain functions | camelCase pure | `computeFreshness` |
| UI copy | Quest (never Task) | "Quest Board" in UI; `Task` in code |
| React components | PascalCase files | `QuestBoard.tsx` |
| Feature folders | kebab-case | `quest-board/` |

[Source: `_bmad-output/planning-artifacts/architecture.md` — Naming Patterns]

### Anti-Patterns (Do Not)

- ❌ Use Postgres/`pg` driver — SQLite only
- ❌ Run `drizzle-kit push` in Docker/production — use versioned migrations
- ❌ Create quest/skill tables in Story 1.1 — Story 2.1 owns that migration
- ❌ Alter `user_progress` schema in Story 2.1 — table must be complete in 1.1
- ❌ Mix `packages/database` and `packages/db` naming — rename consistently
- ❌ Skip Resend config — blocking dependency for auth E2E (Story 1.3)
- ❌ Log magic link tokens or session secrets (pino rule)
- ❌ Implement XP/Focus logic in routers — domain package only (later stories)
- ❌ Scaffold inside `_bmad-output/` or overwrite planning artifacts

[Source: `_bmad-output/planning-artifacts/architecture.md` — Anti-patterns, Enforcement Guidelines]

### Cross-Story Handoff

| Downstream | Depends on 1.1 delivering |
|---|---|
| **1.3 Magic Link Sign-In** | Rewrites, better-auth + Resend, `users` + `user_progress` tables |
| **1.5 Tutorial** | `user_progress.tutorial_seen_at` column exists |
| **2.1 Tasks Schema** | Must NOT recreate or alter `user_progress` |
| **4.4 Docker Verification** | Full compose stack from 1.1 |

### Testing Requirements (Story 1.1)

No domain test vectors required in this story. Verification is **smoke/manual**:

- `bun dev` and `docker compose up` both work
- Migration creates expected tables
- Proxy routes reach api handlers

Playwright E2E pass requirement is **Epic 4**, not Story 1.1. x4 starter may include Playwright scaffold — leave in place but do not block 1.1 on E2E passes.

[Source: `_bmad-output/planning-artifacts/epics.md` NFR9–NFR11; Epic 4 stories]

### Project Structure Notes

- Architecture target tree at `architecture.md` L574–680 is the authoritative directory layout
- `packages/api/routers/` gets one file per router in later stories — create empty `root.ts` now
- RSC/client split rule: no `"use client"` on pages; providers wrapper at layout level only
- Route groups `(auth)/` + `(app)/` created as empty shells OK for 1.1

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.1 AC, Additional Requirements]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template, Data Architecture, Auth, Infrastructure, Project Structure]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` — user_progress MVP fields]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-05-28-112057.md` — SQLite field notes (filter to 1.1 scope only)]
- [Source: `docs/success_criteria.md` — SC4 Docker deployment (foundation for Epic 4)]

## Dev Agent Record

### Agent Model Used

Composer (Cursor Agent)

### Debug Log References

- Merged create-x4 saas scaffold from temp dir; fixed nested `packages/packages` collision with pre-existing root layout
- Renamed `@rpg-life-scaffold/*` → `@rpg-life/*`; `packages/database` → `packages/db`
- better-auth 1.6.x split packages caused missing `@better-auth/core`; pinned **better-auth@1.2.8** for stable Bun workspace install
- Local `DATABASE_URL` uses `file:../../data/rpg-life.db` (repo-root `./data`); Docker uses `file:/data/rpg-life.db`
- Hono app renamed workspace `@rpg-life/server` (apps/api) vs `@rpg-life/api` (packages/api routers)

### Completion Notes List

- ✅ create-x4 saas monorepo merged; `apps/web`, `apps/api` (`@rpg-life/server`), packages `api|db|auth|domain|validators|ui|shared`
- ✅ SQLite + Drizzle via `bun:sqlite`; migrations create `users`, auth tables, `user_progress`
- ✅ better-auth magic link + Resend wiring (dev fallback logs link when keys absent)
- ✅ tRPC skeleton `health` procedure; Next.js rewrites for `/api/auth/*` and `/api/trpc/*`
- ✅ Docker Compose + Dockerfiles; api runs migrations on container start via `apps/api/src/start.ts`
- ✅ Smoke tests (`bun run smoke`) — 5 passing
- ✅ Manual verify: API `/health`, proxied `/api/trpc/health`, SQLite tables at `data/rpg-life.db`

### File List

- `.env.example`
- `.gitignore`
- `README.md`
- `docker-compose.yml`
- `package.json`
- `bun.lock`
- `scripts/dev.ts`
- `scripts/check-db.ts`
- `apps/api/Dockerfile`
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/start.ts`
- `apps/api/src/lib/env.ts`
- `apps/api/tests/scaffold.test.ts`
- `apps/web/Dockerfile`
- `apps/web/next.config.ts`
- `apps/web/package.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/lib/env.ts`
- `apps/web/src/lib/trpc-server.ts`
- `apps/web/src/components/providers/app-providers.tsx`
- `packages/api/package.json`
- `packages/api/src/root.ts`
- `packages/api/src/context.ts`
- `packages/api/src/index.ts`
- `packages/auth/package.json`
- `packages/auth/src/server.ts`
- `packages/db/package.json`
- `packages/db/drizzle.config.ts`
- `packages/db/migrations/0000_init.sql`
- `packages/db/src/client.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/migrate-cli.ts`
- `packages/db/src/schema/auth.ts`
- `packages/db/src/schema/user-progress.ts`
- `packages/db/src/schema.test.ts`
- `packages/domain/package.json`
- `packages/domain/src/index.ts`
- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/validators/package.json`
- `packages/validators/src/index.ts`

## Change Log

- 2026-05-29: Story 1.1 — scaffold create-x4 monorepo, SQLite/Drizzle, auth+migration foundation, Docker Compose, proxy wiring, smoke tests
- 2026-05-29: Code review — removed leftover create-x4 scaffold, fixed Docker proxy bake, enforced Resend/magic-link arch, added focus_balance CHECK, aligned DB path defaults + 8 more patches; type-check + smoke green. Status → done.

### Review Findings

_Code review 2026-05-29 (3 layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: 40 hand-authored Story 1.1 files vs baseline `6ad1c0a`._

#### Decision Needed (resolved 2026-05-29 → converted to Patch)

- Resolution: "Remove now" — delete out-of-scope create-x4 scaffold (see Patch P10).
- Resolution: "Enforce architecture" — make Resend required + remove magic-link URL from logs (see Patch P11).

#### Patch (all applied + verified 2026-05-29)

- [x] [Review][Patch] Docker web bakes `API_URL` at build time → `/api/trpc` proxies to web container's own localhost in Compose — FIXED: web Dockerfile takes `ARG API_URL` (default `http://api:3002`), compose passes it as build arg [apps/web/Dockerfile, docker-compose.yml, apps/web/next.config.ts]
- [x] [Review][Patch] `.env.example` active default `API_URL` now `http://localhost:3002`; docker host passed via build arg [.env.example]
- [x] [Review][Patch] `apps/api/package.json` `start`→`src/start.ts`, `build`→`src/start.ts`, `main`→`src/app.ts`; removed dead `src/index.ts` [apps/api/package.json]
- [x] [Review][Patch] `user_progress.focus_balance` now has `CHECK (focus_balance >= 0)` in schema + initial migration [packages/db/src/schema/user-progress.ts, packages/db/migrations/0000_init.sql]
- [x] [Review][Patch] web `dev` now uses `next dev --port ${PORT_WEB:-3000}` to honor resolved port [apps/web/package.json]
- [x] [Review][Patch] `DATABASE_URL` fallback defaults aligned to `file:../../data/rpg-life.db` across drizzle.config + client [packages/db/drizzle.config.ts, packages/db/src/client.ts]
- [x] [Review][Patch] Web Dockerfile sets `ENV HOSTNAME=0.0.0.0` for Next standalone bind [apps/web/Dockerfile]
- [x] [Review][Patch] API compose service sets `NODE_ENV=production` [docker-compose.yml]
- [x] [Review][Patch] `./lib/env` now imported before `@rpg-life/auth/server` in app.ts (env validated first) [apps/api/src/app.ts]
- [x] [Review][Patch] (P10) Removed out-of-scope create-x4 scaffold: web `(auth)`/`(dashboard)`/`api`/`trpc` routes, all `components/*` except providers, `hooks`, dead `lib/*`, `middleware.ts`; api `index.ts`/`trpc.ts`/`routers`/`scripts`/`__tests__`/`lib/{cache,errors,openapi}`/`middleware/rateLimit`; `packages/shared`; root `@ai-sdk`/`@upstash`/`ai` deps; storybook tasks + stale `turbo.json` globalEnv; reconciled `.eslintrc.json` boundaries to real packages
- [x] [Review][Patch] (P11) `RESEND_API_KEY`/`EMAIL_FROM` now required in api env; auth fails fast if unset and no longer logs the magic-link URL [apps/api/src/lib/env.ts, packages/auth/src/server.ts]
- [x] [Review][Patch] (verify) Fixed two latent build-blocking type errors surfaced during verification: `bun:sqlite` `Database` import vs exported `Database` type collision (aliased import); better-auth `advanced.database.generateId: 'uuid'` (string) → `() => crypto.randomUUID()` [packages/db/src/client.ts, packages/auth/src/server.ts]

_Verification: `bun install` clean (6 pkgs removed); `tsc --noEmit` passes for apps/api + apps/web; `bun run smoke` 5/5 pass._

#### Deferred

- [x] [Review][Defer] Playwright filter `@rpg-life/api` (pkg is `@rpg-life/server`) + version `1.58.2` vs arch pin `1.60.0` — deferred, e2e is Epic 4 scope
- [x] [Review][Defer] CORS `WEB_URL` vs auth `BETTER_AUTH_URL`/trustedOrigins divergence — deferred, both default localhost:3000
- [x] [Review][Defer] `packages/api/src/context.ts` types `user.email`/`name` as required strings — deferred, minor type tightening
- [x] [Review][Defer] `docker-compose.yml` `depends_on` without healthcheck/readiness — deferred, web retries
- [x] [Review][Defer] `.env.example` placeholder `BETTER_AUTH_SECRET` satisfies 32-char min (copy-pasteable) — deferred, document only
- [x] [Review][Defer] Windows portability: root `clean` uses `rm -rf`; `scripts/dev.ts` spawns extensionless `node_modules/.bin/turbo` — deferred, dev-convenience

_Dismissed as noise (3): Blind Hunter "missing lib/logger & middleware/logger" (files exist in repo); "migrations run every boot w/o lock" (single-instance compose, drizzle migrate idempotent); "unescaped magic-link HTML url" (subsumed by token-logging decision)._
