---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/reconcile-brainstorm.md
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/.decision-log.md
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-05-29'
project_name: 'rpg-life'
user_name: 'Luca'
date: '2026-05-29'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

14 FRs across 6 feature areas define a single-player habit RPG with a tight core loop: plan Quests → complete → earn XP/Focus → reflect on stats.

| Area | FRs | Architectural implication |
|------|-----|---------------------------|
| Quest Board (FR-1–4) | List, sort, filter, empty state | Read-heavy API with query params (`overdue`, `upcomingDays`); client-side filter state (session-only); default sort by nearest due date |
| Quest CRUD (FR-5–6) | Create/edit/delete with Skill tags | Validation layer (1–3 Skills, title required); soft delete; Focus-gated mutations (add due date, delete overdue) |
| Completion & rewards (FR-7–8) | Confirm → complete → reward modal | Highest-complexity write path: freshness calc, XP split, Focus earn, Hero level check, idempotent re-complete |
| My Profile (FR-9) | Hero level, Skill bars, Focus | Aggregated read endpoint (`GET /api/v1/me`); all 7 Skills always returned; refresh after complete |
| Focus currency (FR-10–11) | Earn on medium/hard; spend on bypass actions | Server-enforced cap (`3 + floor(heroLevel/3)`); spend types as enum; anti-exploit (delete overdue costs Focus) |
| Navigation & shell (FR-12–14) | Sidebar, Tutorial first-run | App shell with overlay nav; first-run state (`tutorial_seen_at` — recommend server-side) |

**Non-Functional Requirements:**

| NFR | Requirement | Architectural driver |
|-----|-------------|---------------------|
| Platform | Browser-first, mobile-primary | Responsive SPA; touch-target sizing; progressive desktop enhancement |
| Connectivity | Online-only MVP | No sync engine; explicit error + retry on all mutations |
| Performance | Reward modal ≤1s after complete | Server-side domain calc must be fast; avoid N+1 on complete response |
| Accessibility | Semantic HTML, keyboard, screen reader, focus trap | Component architecture must support a11y from the start (sidebar, modals, FAB) |
| Security | better-auth magic link; no client-trusted XP/Focus | All progression logic server-side; API validates ownership on every mutation |
| Auth | Session cookie via better-auth | Middleware/guard on all `/api/v1/*` routes; magic link email flow |

**Scale & Complexity:**

- **Primary domain:** Full-stack web application (browser frontend + API + relational DB)
- **Complexity level:** Medium — small feature surface, non-trivial domain rules; elevated to **Medium-High** if timezone/freshness or idempotency persistence are deferred
- **Estimated architectural components:** ~8–9
  1. Auth integration (better-auth + email provider)
  2. API layer (REST, `/api/v1/*`)
  3. Task/Quest service
  4. Progression domain service (XP freshness, level calc, Focus rules) — **pure, unit-testable**
  5. Data access layer (SQLite + migrations)
  6. Frontend app shell (sidebar, routing, auth gate)
  7. Feature views (Quest Board, Create/Edit, Profile, modals)
  8. Shared UI primitives (modals, sheets, toasts, loading states)
  9. Idempotency/audit persistence on task completion

### Technical Constraints & Dependencies

**Already decided (PRD §8, addendum):**

- Auth: better-auth with magic link email sign-in
- Database: SQLite (referenced in reconcile/brainstorm — **architectural confirmation pending in step 3**)
- API naming: `Task` in DTOs, "Quest" in UI copy
- Online-only — no offline queue
- XP freshness rates locked: 2%/day undated decay, 5%/day overdue decay, 0.5 floor
- Hero/Skill levels computed at read time from `user_skills.xp` — not stored as source of truth
- Story/narrative schema deferred post-MVP

**Dependencies:**

- better-auth (auth + session management)
- **Email delivery provider (blocking for auth E2E)** — Resend, Mailgun, or similar; decision required before first deploy
- SQLite driver/ORM (TBD — step 3)
- Supplementary schema input: brainstorming session field-level SQLite notes (not yet in `inputDocuments`)

**Greenfield:** No existing codebase; all decisions start fresh. App topology (monolith vs split) **not yet decided** — step 3 evaluates starters.

### Cross-Cutting Concerns Identified

1. **Server-side domain integrity** — XP, Focus, and freshness calculations in a single authoritative domain layer; API handlers delegate, never inline math.
2. **Idempotency & completion persistence** — Task completion must be safe to retry; persist `xp_awarded` (and completion timestamp) on first complete so re-complete returns identical payload without double-award.
3. **Date/timezone handling (critical)** — Freshness uses *local calendar dates*, not server timezone. Store UTC timestamps; accept client IANA timezone or explicit `completedLocalDate` on complete; document contract in API spec.
4. **Authorization scoping** — Every mutation validates `owner_id === authenticated user_id`.
5. **Error handling & retry UX** — Online-only: all write failures need user-visible retry (create, complete, Focus spend, delete).
6. **Accessibility** — Focus trap in sidebar/modals, keyboard navigation, screen reader labels.
7. **Tutorial first-run state** — Recommend server-side `tutorial_seen_at` for cross-device consistency (PRD allows client flag; pick one in architecture).
8. **Transactional writes** — Complete and Focus spend touch multiple tables atomically; Focus spend needs concurrency guard (prevent double-spend from parallel tabs).
9. **Domain logic testability** — Progression rules (freshness, Focus cap, XP split) as pure functions with comprehensive unit tests; learning-project quality gate.
10. **Read-after-write consistency** — Profile (`GET /me`) must reflect completion immediately; no stale-cache layer in MVP.

### Assumption Audit Summary

| Risk tier | Assumptions | Mitigation |
|-----------|-------------|------------|
| **Critical** | Timezone/local date for freshness | Explicit API contract; pure date functions with test vectors |
| **High** | Idempotency storage, Focus race conditions | Schema fields for completion award; transactional Focus debit |
| **Medium** | SQLite confirmation, app topology, email provider | Resolve in steps 3–4; flag email as blocking dependency |
| **Low** | Session filters, no WebSockets | No action needed for MVP |

## Starter Template Evaluation

### Technical Preferences (Confirmed)

| Preference | Selection |
|------------|-----------|
| Language | TypeScript end-to-end |
| Frontend | Next.js App Router with RSC |
| Backend | Bun (separate `apps/api`) |
| Monorepo | Turborepo — two apps: `web` + `api` |
| API layer | tRPC v11 (HTTP between web ↔ api) |
| Database | SQLite via Drizzle ORM (`bun:sqlite`) |
| Auth | better-auth magic link (PRD) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Deployment | Docker Compose (local + VPS-ready) |
| Email | Resend (or similar) for magic links — blocking dependency |

### Primary Technology Domain

Full-stack TypeScript monorepo: Next.js RSC frontend + Bun/Hono/tRPC backend, shared packages for domain logic, database, and auth.

### Starter Options Considered

| Starter | Fit | Verdict |
|---------|-----|---------|
| **create-x4** (x4-mono) | Bun api + Next.js web + tRPC + Better Auth + Drizzle + Turborepo | **Selected** — closest match; SQLite + shadcn + Docker added post-scaffold |
| create-t3-turbo | tRPC + Better Auth + Drizzle + shadcn in monorepo | Rejected — tRPC runs in Next.js, not separate Bun API; Postgres default |
| create-turbo-stack | Interactive scaffold, configurable stack | Alternative — less proven; same manual work for SQLite/Docker |

### Selected Starter: create-x4 (x4-mono)

**Rationale:**

- Matches the required two-app split (Next.js RSC frontend, Bun API backend)
- Ships tRPC v11, Better Auth, Drizzle, Turborepo, and Bun workspaces
- SaaS preset includes web + api without mobile/desktop overhead
- SQLite, shadcn/ui, Docker, and domain package are bounded first-story adaptations

**Initialization Command:**

```bash
bunx create-x4 rpg-life --preset saas --yes
```

On Windows if npm is used for install: `bunx --bun create-x4 rpg-life --preset saas --yes`

**Post-scaffold adaptations (Story 0 — project init):**

1. Remove unused apps: `mobile-main`, `desktop`, `marketing`; remove `packages/ai-integrations`
2. Reconfigure `packages/database`: Neon Postgres → SQLite (`bun:sqlite` + Drizzle); persist via Docker volume
3. Add `packages/ui`: shadcn/ui + Tailwind v4 (reference create-t3-turbo `packages/ui` pattern)
4. Add `packages/domain`: pure functions for XP freshness, Focus rules, level calc (unit-testable)
5. Add `docker-compose.yml`: `api` (Bun, port 3002), `web` (Next.js, port 3000), shared env, SQLite volume mount
6. Configure better-auth magic link + Resend; run `bunx --bun auth@latest generate` for auth schema
7. Wire tRPC HTTP link in Next.js: RSC uses server caller; client components use React Query

### Target Monorepo Structure

```
apps/
  web/          Next.js 15 App Router, RSC, shadcn, tRPC client
  api/          Bun + Hono + tRPC server, better-auth handler, port 3002
packages/
  api/          tRPC router definitions (shared types)
  db/           Drizzle schema, migrations, SQLite client
  auth/         better-auth server config + client helpers
  domain/       Progression logic (freshness, Focus, levels) — pure, tested
  ui/           shadcn/ui components + Tailwind config
  validators/   Shared Zod schemas (Task create, Focus spend, etc.)
tooling/        Shared eslint, typescript, tailwind configs
docker-compose.yml
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**

- TypeScript strict across all packages
- Bun ≥ 1.1 as API runtime and package manager (latest stable: 1.3.14)
- Node-compatible Next.js build for `apps/web`

**API Layer:**

- Hono HTTP server on Bun
- tRPC v11 with shared routers in `packages/api`
- better-auth mounted at `/api/auth/*`

**Database:**

- Drizzle ORM (starter: Postgres → **adapt to SQLite**)
- Migration workflow via Drizzle Kit
- better-auth schema generated via CLI

**Frontend:**

- Next.js 15 App Router with React 19
- Tailwind CSS v4
- tRPC client with end-to-end type inference
- shadcn/ui (**added post-scaffold**)

**Testing:**

- Bun test runner for `packages/domain` unit tests
- Playwright E2E (optional, from x4 starter)

**Development Experience:**

- Turborepo task orchestration + caching
- `bun dev` starts web + api in parallel
- Hot reload on both apps

**Note:** Project initialization via create-x4 + post-scaffold adaptations should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Monorepo split: `apps/web` (Next.js RSC) + `apps/api` (Bun/Hono/tRPC)
- SQLite + Drizzle with `bun:sqlite` driver
- better-auth magic link via Resend (all environments)
- Same-origin auth via Next.js rewrites to api
- Server-side domain logic in `packages/domain` (freshness, Focus, levels)
- Timezone-aware freshness: client sends IANA timezone on complete
- Idempotency fields on `tasks` completion

**Important Decisions (Shape Architecture):**

- tRPC router structure (`tasks`, `profile`, `focus`, `tutorial`)
- RSC-first frontend with minimal client component boundaries
- Zod validation in shared `packages/validators`
- Playwright E2E in CI pipeline
- Docker Compose for local + VPS deploy

**Deferred Decisions (Post-MVP):**

- Rate limiting on API
- Server-side caching layer
- User timezone persistence (per-request IANA string sufficient for MVP)
- Story/narrative schema

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | SQLite | PRD/addendum; sufficient for single-user learning MVP |
| Driver | `bun:sqlite` + `drizzle-orm/bun-sqlite` | Native to Bun API runtime; no native addon rebuild in Docker |
| ORM | Drizzle ORM | Starter alignment; type-safe; better-auth adapter |
| DB file path | `/data/rpg-life.db` | Docker volume on `api` service (`./data:/data`) |
| Migrations | Drizzle Kit `generate` + `migrate` | Versioned SQL; run on api container startup |
| Validation | Zod in `packages/validators` | Shared between tRPC inputs and React Hook Form |
| Caching | None (MVP) | Read-after-write consistency; no stale profile after complete |
| Idempotency | `tasks.completed_at`, `tasks.xp_awarded`, `tasks.freshness_multiplier` | Safe retry on network failure; identical reward payload on re-complete |
| Level computation | Read-time from `user_skills.xp` | PRD/addendum — not stored as source of truth |
| Tutorial state | `user_progress.tutorial_seen_at` | Server-side; cross-device consistency |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | better-auth | PRD locked |
| Sign-in method | Magic link email | PRD locked |
| Email delivery | **Resend (dev + prod)** | User preference; single provider; requires `RESEND_API_KEY` locally |
| Session | HttpOnly cookie via better-auth | PRD NFR |
| Cross-app cookies | Next.js rewrites proxy `/api/auth/*` + `/api/trpc/*` → api | Same-origin from browser; simpler magic link callback on mobile |
| Authorization | tRPC `protectedProcedure`; `ctx.session.user.id` only | Never trust client-supplied userId |
| CSRF | SameSite=Lax cookie on same origin (via rewrite) | Sufficient for MVP same-origin setup |
| Progression integrity | All XP/Focus writes server-side in domain layer | PRD security NFR — no client-trusted progression |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | tRPC v11 over HTTP | User preference; end-to-end type safety |
| PRD REST sketch | Maps to tRPC procedures (not REST routes) | `tasks.list` ≈ `GET /api/v1/tasks`, etc. |
| Routers | `tasks`, `profile`, `focus`, `tutorial` | Mirrors PRD feature areas |
| Timezone contract | Client sends `timezone` (IANA) on `tasks.complete` | Critical freshness requirement; store UTC in DB |
| Error handling | tRPC `TRPCError` codes → client retry toasts | PRD online-only failure UX |
| Rate limiting | Deferred post-MVP | Learning/single-user scope |
| Auth routes | better-auth at `/api/auth/*` on api, proxied via web | Standard better-auth mount |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering default | **RSC-first** | User preference — server components by default |
| Client boundaries | **Minimal `"use client"`** — only for interaction | Modals, FAB, checkbox confirm, sidebar overlay, forms, toasts; pages/layouts stay server where possible |
| Server data fetching | tRPC server caller in RSC (cookies forwarded via rewrite) | Quest Board list, Profile stats — no client JS for reads |
| Client mutations | tRPC + TanStack Query in client islands | Complete flow, create/edit sheets, Focus spend |
| Filter state | React `useState` in Quest Board (session-only) | PRD assumption — not URL params |
| Route groups | `(auth)/` + `(app)/` under `apps/web/app/` | Clear auth gate vs authenticated shell |
| Feature colocation | `quest-board/`, `profile/`, `modals/` | Readable feature structure |
| Shared UI | `packages/ui` (shadcn) | Consistent primitives across features |
| Forms | React Hook Form + Zod resolver → `packages/validators` | Single validation source |
| a11y | shadcn/Radix primitives for modals, sidebar focus trap | PRD NFR |

**Client component candidates (minimal set):**

- `SidebarOverlay`, `TutorialSheet`, `CreateQuestSheet`, `ConfirmCompleteModal`, `RewardModal`
- `QuestBoardFilters` (session state), `QuestRow` (checkbox interaction), `FabCreateQuest`
- `FocusSpendPrompt`, `ToastProvider`, tRPC/React Query provider wrapper

Everything else (Quest Board page shell, Profile page, layouts, empty states) → **Server Components**.

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local/prod runtime | Docker Compose | User preference |
| Services | `web` (:3000), `api` (:3002 internal) | Two-app monorepo |
| Email (dev) | Resend (same as prod) | User preference — no Mailpit |
| Env validation | `@t3-oss/env-core` (api), `@t3-oss/env-nextjs` (web) | Type-safe env at startup |
| CI | GitHub Actions: lint, typecheck, domain unit tests, build, **Playwright E2E** | User preference |
| E2E framework | Playwright **1.60.0** (`@playwright/test`) | x4 starter includes Playwright; cover UJ-1–4 critical paths |
| E2E scope (MVP CI) | Auth gate smoke + Quest create + complete + profile refresh | Core loop validation |
| Logging | pino structured (api); Next.js default (web) | Sufficient for MVP |
| Monitoring/APM | Deferred | Learning project scope |

**Required env vars (minimum):**

- `DATABASE_URL=file:/data/rpg-life.db`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (web public URL)
- `RESEND_API_KEY`, `EMAIL_FROM`
- `API_URL` (internal, for Next.js rewrites)

### Decision Impact Analysis

**Implementation Sequence:**

1. Scaffold create-x4 saas preset + post-scaffold adaptations
2. SQLite + Drizzle migrations + better-auth schema (Resend configured)
3. `packages/domain` + unit tests (freshness, Focus, levels)
4. tRPC routers + protectedProcedure + timezone on complete
5. Next.js rewrites + RSC pages + minimal client islands
6. shadcn/ui shell (sidebar, modals, FAB)
7. Playwright E2E for UJ-1/UJ-2 smoke
8. Docker Compose + CI pipeline

**Cross-Component Dependencies:**

- Resend must work locally before auth E2E can pass
- Next.js rewrites must be in place before cookie auth works across web/api
- `packages/domain` must exist before `tasks.complete` procedure is implemented
- Idempotency columns required before complete flow is safe to test
- Minimal client boundaries depend on tRPC server caller working in RSC with forwarded session

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical conflict points:** 12 areas where AI agents could make incompatible choices without these rules.

### Naming Patterns

**Database Naming Conventions (Drizzle schema in `packages/db`):**

- **Tables:** `snake_case`, plural — `users`, `tasks`, `skills`, `task_skills`, `user_skills`, `user_progress`
- **Columns:** `snake_case` — `owner_id`, `due_date`, `created_at`, `completed_at`, `xp_awarded`, `freshness_multiplier`, `focus_balance`, `tutorial_seen_at`
- **Primary keys:** `id` (text/cuid or uuid — pick one at scaffold, never mix)
- **Foreign keys:** `{table_singular}_id` — `owner_id`, `task_id`, `skill_id`, `user_id`
- **Indexes:** `idx_{table}_{columns}` — e.g. `idx_tasks_owner_status_due`
- **Soft delete:** `deleted_at` nullable timestamp on `tasks` (never hard delete in MVP)

**tRPC / Code Naming:**

- **Routers:** camelCase nouns — `tasks`, `profile`, `focus`, `tutorial`
- **Procedures:** camelCase verb — `tasks.list`, `tasks.create`, `tasks.complete`, `focus.spend`
- **Types/interfaces:** PascalCase — `Task`, `CompleteTaskInput`, `RewardPayload`
- **Domain functions:** camelCase pure functions — `computeFreshness`, `computeHeroLevel`, `splitXpAcrossSkills`
- **Constants:** SCREAMING_SNAKE in `packages/domain/constants.ts` — `BASE_XP`, `MIN_FRESHNESS`

**UI vs API terminology (PRD locked):**

| Layer | Term | Example |
|-------|------|---------|
| Database / tRPC / validators | `Task`, `task` | `tasks.create`, `TaskSchema` |
| UI copy / components | `Quest`, `quest` | `<QuestBoard>`, "No quests yet" |
| Never | Mix in same layer | ❌ `QuestSchema` in validators; ❌ "Task Board" in UI |

**File & component naming:**

- **React components:** PascalCase files — `QuestBoard.tsx`, `RewardModal.tsx`
- **Feature folders:** kebab-case — `quest-board/`, `reward-modal/`
- **Utilities:** kebab-case files — `format-xp.ts`, `trpc-server.ts`
- **Route segments:** kebab-case — `app/(app)/quest-board/page.tsx`

### Structure Patterns

**Project Organization:**

```
packages/domain/          Pure logic + *.test.ts (co-located unit tests)
packages/db/schema/       Drizzle table definitions only
packages/validators/      Zod schemas (no DB imports)
packages/api/routers/     One file per router — tasks.ts, profile.ts, focus.ts, tutorial.ts
apps/api/src/             Hono mount, tRPC adapter, auth handler — thin, delegates to packages
apps/web/app/             Next.js routes (RSC default)
apps/web/components/      Feature folders + providers/ for client wrappers only
apps/web/e2e/             Playwright specs (*.spec.ts)
```

**Test locations:**

| Test type | Location | Naming |
|-----------|----------|--------|
| Domain unit tests | `packages/domain/**/*.test.ts` | Co-located with source |
| tRPC integration | `packages/api/**/*.test.ts` or `apps/api/**/*.test.ts` | Optional; prefer domain tests first |
| E2E | `apps/web/e2e/*.spec.ts` | UJ-1 through UJ-4 paths |
| No | Tests inside `apps/web/components/` | Keep components lean |

**RSC / client split rule:**

- Default: no `"use client"` on pages, layouts, or presentational server components
- `"use client"` only on files that use hooks, event handlers, or browser APIs
- Extract the smallest interactive leaf — e.g. `QuestRowActions.tsx` not entire `QuestBoard.tsx`
- One `apps/web/components/providers/app-providers.tsx` wraps tRPC + QueryClient (client boundary at layout level)

### Format Patterns

**tRPC responses (no custom wrappers):**

- Return domain objects directly from procedures — no `{ data, error }` envelope
- Errors: `throw new TRPCError({ code, message })` only — never return `{ success: false }`
- Codes: `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT` (Focus race / insufficient balance)

**Date/time formats:**

| Context | Format |
|---------|--------|
| DB storage | UTC ISO-8601 via Drizzle `timestamp` — `created_at`, `completed_at`; date-only column for `due_date` |
| tRPC complete input | `timezone: string` (IANA, required) — e.g. `"Europe/Ljubljana"` |
| API responses | ISO strings for timestamps; `dueDate: "2026-05-30"` as date string |
| UI display | Format in server components via `Intl.DateTimeFormat` with user timezone from request/context |

**JSON field naming:**

- tRPC/TypeScript layer: **camelCase** — `dueDate`, `xpAwarded`, `focusBalance`
- Drizzle schema: **snake_case** mapped at boundary — one mapping layer in `packages/db` repositories
- Never snake_case leaking into components

**Reward payload shape (complete response):**

```typescript
{
  xpAward: number;
  xpPerSkill: Record<SkillCode, number>;
  focusEarned: number;
  heroLevelBefore: number;
  heroLevelAfter: number;
  leveledUp: boolean;
  freshness?: {
    multiplier: number;
    reason: 'undated_age' | 'overdue';
    daysApplied: number;
    baseXp: number;
    finalXp: number;
  };
}
```

### Communication Patterns

**TanStack Query / tRPC mutations:**

- Invalidate after mutation: `tasks.list` + `profile.get` on complete/create/delete/focus spend
- Mutation keys: use tRPC utils — `utils.tasks.list.invalidate()`, never manual string cache keys
- Optimistic updates: **none for MVP** — server is source of truth for XP/Focus

**Logging (api only):**

- pino JSON in production; pretty in dev
- Log: request id, procedure name, userId, duration — never log magic link tokens or session secrets
- Level: `error` for 5xx, `warn` for business rule rejections, `info` for startup/migrations

### Process Patterns

**Error handling:**

| Layer | Pattern |
|-------|---------|
| Domain | Return `Result<T, DomainError>` or throw domain errors caught in procedure — never HTTP concepts |
| tRPC procedure | Catch domain errors → map to `TRPCError` with user-safe `message` |
| Client | `onError` on mutations → toast with retry action (PRD online-only) |
| RSC | `error.tsx` boundary per route group; no try/catch in every page |

**User-facing error copy:**

- Neutral tone per PRD — no shame language on overdue/Focus failures
- Actionable when Focus insufficient: explain earn path (medium/hard completions)

**Loading states:**

| Context | Pattern |
|---------|---------|
| RSC pages | `<Suspense fallback={<QuestBoardSkeleton />}>` |
| Client mutations | `isPending` from `useMutation` — disable button, show spinner on FAB/modal submit |
| No | Global loading bar for MVP |

**Auth flow:**

1. Magic link request → better-auth via `/api/auth/*` (proxied)
2. Callback lands on web origin → session cookie set
3. tRPC context reads session from better-auth on every `protectedProcedure`
4. Unauthenticated → redirect to `(auth)/sign-in` in middleware

**Validation timing:**

- Zod parse at tRPC input layer (`.input(TaskCreateSchema)`)
- Forms: same schema via `@hookform/resolvers/zod`
- Domain layer: trust validated input; re-validate invariants only (e.g. skill count ≤ 3)

**Transactions:**

- `tasks.complete` and `focus.spend` wrap in Drizzle transaction
- Domain functions receive `tx` handle — pure calc outside, writes inside transaction

### Enforcement Guidelines

**All AI agents MUST:**

- Put progression math in `packages/domain` — never in tRPC routers or React components
- Use `protectedProcedure` for all user-scoped mutations and reads
- Use `Task` in code, `Quest` in UI copy — never swap
- Keep `"use client"` files as small as possible
- Use shared Zod schemas from `packages/validators` — no duplicate validation
- Map DB snake_case → TS camelCase in one repository layer
- Persist idempotency fields on first complete before returning reward payload

**Pattern verification:**

- CI: lint + typecheck + domain unit tests + Playwright E2E
- Code review checklist: domain purity, client boundary size, naming table above

### Pattern Examples

**Good:**

```typescript
// packages/domain/freshness.ts — pure, tested
export function computeFreshness(task: TaskDates, completedAt: LocalDate, constants: FreshnessConstants): number

// packages/api/routers/tasks.ts — thin
complete: protectedProcedure
  .input(CompleteTaskSchema)
  .mutation(({ ctx, input }) => completeTask(ctx.db, ctx.session.user.id, input))

// apps/web/components/quest-row-actions.tsx — minimal client island
"use client"
export function QuestRowActions({ taskId }: { taskId: string }) { /* checkbox + modals */ }
```

**Anti-patterns:**

- ❌ XP calculation in `RewardModal.tsx`
- ❌ `userId` passed from client in tRPC input
- ❌ `"use client"` on `QuestBoardPage`
- ❌ `quest.create` procedure name
- ❌ `drizzle-kit push` in production Dockerfile
- ❌ Custom `{ success, data, error }` response wrapper around tRPC returns

## Project Structure & Boundaries

### Complete Project Directory Structure

```
rpg-life/
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint, typecheck, domain tests, build, Playwright E2E
├── .env.example
├── .gitignore
├── docker-compose.yml                # web, api, ./data volume
├── turbo.json
├── package.json                      # Bun workspaces root
├── bun.lock
├── README.md
│
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts              # Bun.serve / Hono entry
│   │       ├── app.ts                # Hono app: CORS, logger, routes
│   │       ├── trpc/
│   │       │   └── handler.ts        # tRPC fetch adapter mount at /api/trpc
│   │       └── auth/
│   │           └── handler.ts        # better-auth handler at /api/auth/*
│   │
│   └── web/
│       ├── Dockerfile
│       ├── package.json
│       ├── next.config.ts            # rewrites → api:3002
│       ├── middleware.ts             # auth gate for (app) routes
│       ├── playwright.config.ts
│       ├── tsconfig.json
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx            # root layout
│       │   ├── (auth)/
│       │   │   ├── layout.tsx
│       │   │   └── sign-in/
│       │   │       └── page.tsx      # magic link request (client island)
│       │   └── (app)/
│       │       ├── layout.tsx        # shell: header, sidebar slot, providers
│       │       ├── quest-board/
│       │       │   ├── page.tsx      # RSC: prefetch tasks.list
│       │       │   ├── loading.tsx
│       │       │   └── error.tsx
│       │       └── profile/
│       │           ├── page.tsx      # RSC: prefetch profile.get
│       │           ├── loading.tsx
│       │           └── error.tsx
│       ├── components/
│       │   ├── providers/
│       │   │   └── app-providers.tsx # "use client": tRPC + QueryClient
│       │   ├── quest-board/
│       │   │   ├── QuestBoard.tsx           # RSC presentational
│       │   │   ├── QuestBoardFilters.tsx    # "use client" session filters
│       │   │   ├── QuestRow.tsx             # RSC row shell
│       │   │   ├── QuestRowActions.tsx      # "use client" checkbox + modals
│       │   │   ├── QuestBoardEmpty.tsx      # RSC
│       │   │   └── FabCreateQuest.tsx       # "use client"
│       │   ├── create-quest-sheet/
│       │   │   └── CreateQuestSheet.tsx     # "use client" + RHF
│       │   ├── modals/
│       │   │   ├── ConfirmCompleteModal.tsx
│       │   │   ├── RewardModal.tsx
│       │   │   └── FocusSpendPrompt.tsx
│       │   ├── sidebar/
│       │   │   ├── SidebarOverlay.tsx       # "use client"
│       │   │   └── AppHeader.tsx            # RSC: Hero level + Focus pill
│       │   ├── profile/
│       │   │   ├── ProfileStats.tsx         # RSC
│       │   │   └── SkillXpBar.tsx           # RSC
│       │   └── tutorial/
│       │       └── TutorialSheet.tsx        # "use client"
│       ├── lib/
│       │   ├── trpc-server.ts        # RSC caller (cookies forwarded)
│       │   └── trpc-client.ts        # browser client
│       └── e2e/
│           ├── auth.spec.ts
│           ├── quest-create.spec.ts
│           ├── quest-complete.spec.ts
│           └── profile.spec.ts
│
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts              # appRouter export
│   │       ├── trpc.ts               # initTRPC, protectedProcedure, context type
│   │       ├── context.ts            # session + db from better-auth
│   │       ├── routers/
│   │       │   ├── index.ts          # merge routers
│   │       │   ├── tasks.ts
│   │       │   ├── profile.ts
│   │       │   ├── focus.ts
│   │       │   └── tutorial.ts
│   │       └── services/
│   │           ├── tasks.ts            # CRUD orchestration
│   │           ├── complete-task.ts    # transactional complete + idempotency
│   │           └── focus-spend.ts      # transactional Focus spend
│   │
│   ├── auth/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts              # better-auth instance (magic link + Resend)
│   │       └── client.ts             # web client helpers
│   │
│   ├── db/
│   │   ├── package.json
│   │   ├── drizzle.config.ts
│   │   ├── migrations/               # Drizzle Kit SQL migrations
│   │   └── src/
│   │       ├── index.ts              # bun:sqlite + drizzle client
│   │       ├── schema/
│   │       │   ├── index.ts
│   │       │   ├── auth.ts           # better-auth generated tables
│   │       │   ├── tasks.ts
│   │       │   ├── skills.ts
│   │       │   ├── task-skills.ts
│   │       │   ├── user-skills.ts
│   │       │   └── user-progress.ts
│   │       ├── repositories/
│   │       │   ├── tasks.ts          # snake_case ↔ camelCase mapping
│   │       │   ├── user-skills.ts
│   │       │   └── user-progress.ts
│   │       └── seed/
│   │           └── skills.ts         # 7 MVP skills catalog
│   │
│   ├── domain/
│   │   ├── package.json
│   │   └── src/
│   │       ├── constants.ts          # BASE_XP, MIN_FRESHNESS, curves
│   │       ├── freshness.ts
│   │       ├── freshness.test.ts
│   │       ├── levels.ts             # hero + skill level calc
│   │       ├── levels.test.ts
│   │       ├── focus.ts              # cap, earn, spend rules
│   │       ├── focus.test.ts
│   │       ├── xp-split.ts
│   │       └── types.ts
│   │
│   ├── validators/
│   │   ├── package.json
│   │   └── src/
│   │       ├── task.ts               # TaskCreateSchema, TaskUpdateSchema
│   │       ├── complete.ts           # CompleteTaskSchema (timezone required)
│   │       ├── focus.ts              # FocusSpendSchema
│   │       └── skill-codes.ts        # enum of 7 skills
│   │
│   └── ui/
│       ├── package.json
│       ├── components.json           # shadcn config
│       └── src/
│           ├── button.tsx
│           ├── sheet.tsx
│           ├── dialog.tsx
│           ├── toast.tsx
│           ├── skeleton.tsx
│           └── ...                   # shadcn primitives only
│
├── tooling/
│   ├── eslint/
│   ├── typescript/                   # shared tsconfigs
│   └── tailwind/                     # shared Tailwind v4 theme
│
└── data/                             # gitignored; Docker bind mount
    └── rpg-life.db
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Location | Exposed to |
|----------|----------|------------|
| better-auth | `apps/api/src/auth/handler.ts` → `/api/auth/*` | Browser (via web rewrite) |
| tRPC | `apps/api/src/trpc/handler.ts` → `/api/trpc/*` | Browser + RSC server caller |
| Domain logic | `packages/domain/` | **Internal only** — imported by `packages/api/services/` |
| DB access | `packages/db/repositories/` | **Internal only** — imported by services, never by web app directly |

**Component Boundaries:**

- **RSC pages** fetch via `lib/trpc-server.ts` — no direct DB imports in `apps/web`
- **Client islands** call `lib/trpc-client.ts` for mutations only
- **`packages/ui`** — presentational primitives; no tRPC, no business logic
- **Feature components** in `apps/web/components/{feature}/` — may compose ui + client tRPC

**Service Boundaries:**

```
tRPC router (thin)
  → service (orchestration + transaction)
    → domain (pure calc)
    → repository (DB read/write + mapping)
```

**Data Boundaries:**

- Single SQLite file owned exclusively by `apps/api` process
- `apps/web` never opens DB connection
- Auth tables (better-auth) + app tables in same DB, same Drizzle instance
- Skills catalog seeded once via migration/seed script

### Requirements to Structure Mapping

| FR / Journey | Files |
|--------------|-------|
| FR-1–4 Quest Board | `routers/tasks.ts` → `list`; `quest-board/page.tsx`, `QuestBoardFilters.tsx` |
| FR-5–6 Create/edit | `routers/tasks.ts` → `create`, `update`, `delete`; `CreateQuestSheet.tsx` |
| FR-7–8 Complete | `services/complete-task.ts`, `domain/freshness.ts`; `QuestRowActions.tsx`, `RewardModal.tsx` |
| FR-9 Profile | `routers/profile.ts` → `get`; `profile/page.tsx`, `ProfileStats.tsx` |
| FR-10–11 Focus | `routers/focus.ts` → `spend`; `domain/focus.ts`, `FocusSpendPrompt.tsx` |
| FR-12–14 Shell | `(app)/layout.tsx`, `SidebarOverlay.tsx`, `TutorialSheet.tsx`, `routers/tutorial.ts` |
| UJ-1 First quest | `e2e/quest-create.spec.ts`, `TutorialSheet.tsx`, `QuestBoardEmpty.tsx` |
| UJ-2 Complete | `e2e/quest-complete.spec.ts`, `ConfirmCompleteModal.tsx`, `RewardModal.tsx` |
| UJ-3 Profile | `e2e/profile.spec.ts`, `profile/page.tsx` |
| UJ-4 Reschedule | `routers/focus.ts`, `FocusSpendPrompt.tsx` |

**Cross-cutting:**

| Concern | Location |
|---------|----------|
| Auth | `packages/auth/`, `middleware.ts`, `context.ts` |
| Validation | `packages/validators/` |
| Progression rules | `packages/domain/` |
| Env | `apps/api/src/env.ts`, `apps/web/env.ts` (t3-env) |

### Integration Points

**Internal communication:**

```
Browser → web:3000/api/trpc → rewrite → api:3002/api/trpc → Hono → tRPC → services → domain + db
Browser → web:3000/api/auth → rewrite → api:3002/api/auth → better-auth
RSC server → trpc-server caller → same path with forwarded Cookie header
```

**External integrations:**

| Service | Used by | Purpose |
|---------|---------|---------|
| Resend | `packages/auth/` | Magic link email (dev + prod) |

**Data flow (complete quest):**

1. `QuestRowActions` → `tasks.complete` mutation `{ taskId, timezone }`
2. `complete-task.ts` loads task + skills in transaction
3. If already completed → return stored `xp_awarded` payload (idempotent)
4. Else `domain/freshness` + `domain/xp-split` + `domain/focus` → write `user_skills`, `user_progress`, `tasks`
5. Return `RewardPayload` → `RewardModal` renders
6. Invalidate `tasks.list` + `profile.get`

### Development Workflow Integration

| Command | Effect |
|---------|--------|
| `bun dev` (root) | Turborepo: api :3002 + web :3000 |
| `bun test` (domain) | Freshness, Focus, level unit tests |
| `bun run e2e` (web) | Playwright against docker-compose stack |
| `docker compose up` | Full stack with persisted SQLite in `./data` |

**Deployment structure:**

- `apps/api/Dockerfile` — Bun runtime, runs migrations on start, exposes 3002
- `apps/web/Dockerfile` — Next.js standalone, rewrites to api service name in compose network
- `./data` volume mounted only on api container

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

- Bun API + Next.js RSC + tRPC + SQLite + better-auth + Docker Compose — compatible via Next.js rewrites (same-origin cookies)
- tRPC replaces PRD REST sketch cleanly — procedure mapping documented
- `packages/domain` isolation supports "no client-trusted XP" NFR
- Resend-all-environments simplifies dev/prod parity; requires local API key before auth E2E passes

**Pattern Consistency:**

- Task/Quest naming split enforced across DB/tRPC vs UI layers
- RSC-first + minimal client islands aligns with component tree in project structure
- snake_case DB → camelCase TS mapping via repositories matches format patterns
- Idempotency fields in schema align with complete flow and audit findings

**Structure Alignment:**

- Every FR category maps to explicit router + page + component paths
- Service layer (`complete-task.ts`, `focus-spend.ts`) sits between routers and domain as intended
- E2E specs align with UJ-1 through UJ-4 and CI decision

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR group | Architectural support |
|----------|----------------------|
| FR-1–4 Quest Board | `tasks.list` + filters + RSC page + client filter island |
| FR-5–6 CRUD | `tasks.create/update/delete` + Focus-gated mutations in services |
| FR-7–8 Complete | `complete-task.ts` + domain freshness + idempotency + reward modal |
| FR-9 Profile | `profile.get` + RSC profile page + all 7 skills |
| FR-10–11 Focus | `domain/focus.ts` + `focus.spend` + cap enforcement |
| FR-12–14 Shell | App layout, sidebar, tutorial router + `tutorial_seen_at` |

**Non-Functional Requirements Coverage:**

| NFR | Support |
|-----|---------|
| Mobile-first browser | Next.js responsive + shadcn touch targets |
| Online-only + retry | tRPC error → toast pattern documented |
| Reward ≤1s | Server-side domain calc; no cache layer |
| a11y | Radix/shadcn modals, focus trap in client islands |
| Security | protectedProcedure + domain layer + no client XP writes |
| Magic link auth | better-auth + Resend + rewrite proxy |

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical and important decisions documented with rationale. Version pins: Bun 1.3.14, Playwright 1.60.0, tRPC v11.

**Structure Completeness:** Full monorepo tree with file-level specificity — not generic placeholders.

**Pattern Completeness:** Naming, format, process, and anti-patterns documented with code examples.

### Gap Analysis Results

**Important (non-blocking):**

1. **Brainstorming session not in `inputDocuments`** — field-level SQLite notes in `brainstorming-session-2026-05-28-112057.md` should be loaded during Story 0 schema implementation
2. **UX spec deferred** — visual design, spacing, animation timing not specified; architecture defines component slots, not pixel specs
3. **create-x4 Postgres → SQLite adaptation** — documented as Story 0 work; not yet executed (expected for greenfield)

**Nice-to-have:**

- Primary key format (cuid vs uuid) — decide at scaffold, document in README
- User timezone persistence — per-request IANA sufficient for MVP; profile field deferred

**Critical gaps:** None.

### Validation Issues Addressed

No contradictory decisions found. PRD REST sketch superseded by tRPC — explicitly documented. Assumption audit items (timezone, idempotency, Focus races) all have architectural homes.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY WITH MINOR GAPS

**Confidence Level:** High

**Key Strengths:**

- Domain logic isolated and testable before UI work
- Clear Task/Quest boundary prevents agent naming drift
- Minimal client component rule keeps RSC benefits
- Idempotency and timezone contracts address highest-risk audit findings
- Full FR → file mapping gives agents unambiguous targets

**Areas for Future Enhancement:**

- UX spec for visual polish and micro-interactions
- Rate limiting and monitoring post-MVP
- User timezone persistence on profile
- Story/narrative schema when post-MVP

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Load brainstorming session when implementing Drizzle schema details

**First Implementation Priority:**

```bash
bunx create-x4 rpg-life --preset saas --yes
```

Then execute Story 0 post-scaffold adaptations (SQLite, shadcn, Docker, domain package, delete unused apps).

## UX Integration Addendum

**UX workspace:** `planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/` (`DESIGN.md`, `EXPERIENCE.md` — status: final)  
**Reconciled:** 2026-05-29 — no blocking conflicts with architecture decisions.

### Alignment summary ✅

| Architecture decision | UX reflection |
|----------------------|---------------|
| Next.js RSC + minimal client islands | EXPERIENCE Foundation; reads server-rendered, mutations in client islands |
| shadcn/ui + Tailwind v4 | DESIGN brand-layer on shadcn defaults; no custom Dialog/Sheet rebuild |
| better-auth magic link + Resend | Auth B: Sign in page; post-send confirmation state (same route) |
| Sidebar + Quest Board + FAB | IA matches; bottom nav rejected in UX |
| Session-only filter state | Quest Board filters behavioral rules |
| Task/Quest naming split | Voice/tone uses Quest in UI; code stays Task |
| tRPC mutations + retry toasts | State Patterns: network error + retry, no silent fail |
| Anti-shame / neutral overdue | DESIGN + EXPERIENCE: muted overdue, no alarm red |
| Playwright UJ-1–4 | EXPERIENCE Key Flows cover all four journeys |
| Reward ≤1s NFR | Motion: modal prompt; no long intro animation |

### Architecture updates from UX (post-UX)

**1. Design token layer (`packages/ui` + `tooling/tailwind`)**

- Import Crystal Path tokens from `DESIGN.md` as CSS variables in `tooling/tailwind/theme.css` (or `packages/ui/src/theme.css`)
- Brand components extend shadcn: `XpBar`, `FocusPill`, `SkillChip`, `QuestRow` surface styles — not replacements for shadcn primitives
- Skill icon map lives in `packages/ui/src/skill-icons.ts` (Lucide names per DESIGN.md Skill table)
- Dark mode: `prefers-color-scheme` only — no in-app theme toggle MVP

**2. Component tree deltas**

| UX surface | Architecture file(s) | Notes |
|------------|---------------------|-------|
| Sign in (email + post-send state) | `(auth)/sign-in/page.tsx` | Single route; after submit show "Check your stars" confirmation inline (masked email, resend). User then checks **their email app** for the magic link — no `/check-inbox` route |
| Quest sheet (create + edit) | `QuestSheet.tsx` | Single sheet, `mode: 'create' \| 'edit'`; row body tap opens edit (not checkbox) |
| Row tap → edit | `QuestRowEditTrigger.tsx` | Minimal client leaf wrapping row body; checkbox stays in `QuestRowActions.tsx` |
| Two empty states | `QuestBoardEmptyFirst.tsx`, `QuestBoardEmptyClear.tsx` | "No quests yet" vs "Quest board clear" — distinct copy/CTA per EXPERIENCE |
| Hero level-up | `HeroLevelUpOverlay.tsx` | Full-screen when `leveledUp`; replaces standard reward layout (not stacked modals) |
| Reward modal | `RewardModal.tsx` | Standard B; `Dialog` ≥ lg, `Sheet` &lt; md; hosts level-up branch or delegates to overlay |
| Board clear timing | Quest Board page | After reward dismiss + `tasks.list` invalidation, render clear empty when `openCount === 0` (no extra fetch required if cache updated) |

**Updated client component set (minimal):**

- `AppProviders`, `SidebarOverlay`, `TutorialSheet`, `QuestSheet`, `QuestRowActions`, `QuestRowEditTrigger`, `QuestBoardFilters`, `FabCreateQuest`
- `ConfirmCompleteModal`, `RewardModal`, `HeroLevelUpOverlay`, `FocusSpendPrompt`
- Auth: `SignInForm` (handles email capture + post-send confirmation state)

RSC remains: Quest Board page/layout, `QuestBoard`, `QuestRow` shell, `AppHeader`, Profile pages, both empty state shells (static structure; clear vs first driven by server data + client transition after complete).

**3. Modal orchestration rule (from EXPERIENCE)**

- One modal level deep: confirm → reward **replaces** confirm (never two dialogs stacked)
- Hero level-up **replaces** standard reward content when `leveledUp === true`
- `QuestRowActions` owns the confirm → complete → reward state machine

**4. Motion & accessibility addendum**

| Behavior | Implementation |
|----------|----------------|
| XP bar fill on reward open | ~400ms CSS transition; skip when `prefers-reduced-motion` |
| Confetti | Hero level-up only; skip when reduced motion |
| Touch targets | Min 44×44px on checkbox, FAB, nav, primary buttons |
| Screen reader | Announce reward XP gains and level-up in modal |

Motion is presentation-only — no API or domain changes.

**5. E2E scope extension**

Add to `apps/web/e2e/`:

- `board-clear.spec.ts` — complete last open Quest → dismiss reward → assert "Quest board clear" empty
- Auth flow: sign-in form → post-send state on same page → user opens email client → magic link callback in `auth.spec.ts`

**6. Resolved validation gaps**

- ~~UX spec deferred~~ → **UX final** (`DESIGN.md`, `EXPERIENCE.md`)
- Brainstorming session: still load for schema field details at Story 0
- My Profile / Edit Quest mocks: spine-only acceptable per UX validation; no architecture block

### No architecture changes required for

- API layer (tRPC routers unchanged)
- Domain logic / freshness / Focus rules
- Auth topology (rewrites + better-auth)
- Database schema
- Docker / CI pipeline structure (E2E cases expanded only)

### Pre-implementation readiness (post-UX)

**Overall:** READY FOR IMPLEMENTATION — UX gap closed; minor component tree additions documented above.
