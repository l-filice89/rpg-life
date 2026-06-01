---
baseline_commit: a061bee
---

# Story 2.1: Tasks Schema and Skill Catalog Seed

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **builder**,
I want the database schema for Quests and the seven Skills seeded,
So that Quest CRUD and progression have a data foundation.

## Acceptance Criteria

1. **Given** the Drizzle migration system from Story 1.1 **When** app schema migrations run on api startup **Then** tables exist: `tasks`, `skills`, `task_skills`, `user_skills` with columns per architecture and brainstorming field notes.

2. **And** `tasks` includes: `id`, `owner_id` (FK → `users`), `title`, `difficulty`, `due_date`, `status`, `created_at`, `modified_at`, `deleted_at`, plus completion/idempotency columns `completed_at`, `xp_awarded`, `freshness_multiplier` (required by architecture for Epic 3 — add now, not in a later migration).

3. **And** `user_progress` already exists from Story 1.1 — **do not recreate or alter** its schema (no `story_flags`, no `last_story_level` in MVP).

4. **And** all seven Skills are seeded idempotently: Concentration, Vitality, Lore, Presence, Order, Resolve, Craft (codes: `concentration` … `craft`).

5. **And** naming follows architecture conventions: snake_case DB columns; soft delete via `deleted_at` on `tasks`; `Task` in code, never `Quest` in schema/validators.

6. **And** Story/narrative tables are **NOT** created (post-MVP).

7. **And** `PRAGMA foreign_keys = ON` remains enabled; all new FKs use `ON DELETE CASCADE` where junction rows must die with parent (`task_skills` → `tasks`).

8. **And** `bun run type-check` + `bun run smoke` pass; new schema tests cover migration apply + 7-row skill seed.

## Tasks / Subtasks

- [x] **Task 1: Drizzle schema modules** (AC: #1–#3, #5–#6)
  - [x] Create `packages/db/src/schema/tasks.ts` — `tasks` table (see Dev Notes binding schema)
  - [x] Create `packages/db/src/schema/skills.ts` — catalog table; `code` TEXT PK
  - [x] Create `packages/db/src/schema/task-skills.ts` — composite PK `(task_id, skill_code)`; FK cascade on task delete
  - [x] Create `packages/db/src/schema/user-skills.ts` — composite PK `(user_id, skill_code)`; `xp` INTEGER NOT NULL DEFAULT 0 with CHECK `>= 0`
  - [x] Export all tables from `packages/db/src/index.ts`
  - [x] Merge into `packages/db/src/client.ts` schema object (alongside auth + userProgress)
  - [x] Update `packages/db/drizzle.config.ts` `schema` array with all four new files
  - [x] **Do not touch** `packages/db/src/schema/user-progress.ts`

- [x] **Task 2: Versioned migration** (AC: #1, #7)
  - [x] Run `bun run db:generate` from repo root → produces `packages/db/migrations/0001_*.sql`
  - [x] Verify migration order: runs **after** `0000_init.sql` (auth + `user_progress` only)
  - [x] Migration creates all four tables + indexes (see Dev Notes)
  - [x] **Never** use `drizzle-kit push` in Docker/production — `migrate` only (architecture anti-pattern)
  - [x] Ignore stale `0000_lazy_epoch.sql` (Postgres leftover; not in `_journal.json`)

- [x] **Task 3: Skill catalog seed** (AC: #4, #8)
  - [x] Create `packages/db/src/seed/skills.ts` — export `seedSkills(db)` with idempotent upsert (`onConflictDoNothing` or count guard)
  - [x] Replace stub `packages/db/src/seed.ts` — export `runSeed(db)` calling `seedSkills`
  - [x] Wire `apps/api/src/start.ts`: `await runMigrations()` then `await runSeed(db)` (log "Skills catalog seeded" once)
  - [x] Seed rows: code, display_name, sort_order 1–7, optional `description` + `icon_key` per UX icon map

- [x] **Task 4: Shared `SkillCode` enum** (AC: #5)
  - [x] Create `packages/validators/src/skill-codes.ts` — `SkillCode` z.enum + `SKILL_CODES` const array (single source for seed + future tRPC)
  - [x] Export from `packages/validators/src/index.ts`
  - [x] Seed imports codes from validators — no duplicate string literals

- [x] **Task 5: Schema tests** (AC: #8)
  - [x] Extend `packages/db/src/schema.test.ts` OR add `packages/db/src/__tests__/quest-schema.test.ts`
  - [x] In-memory SQLite: apply `0000_init.sql` + new `0001_*.sql`; assert tables exist
  - [x] Run `seedSkills` → `SELECT COUNT(*) FROM skills` === 7; re-run seed → still 7
  - [x] Assert FK: insert task with invalid `owner_id` fails; insert `task_skills` without task fails
  - [x] Assert `user_progress` columns unchanged (Story 1.1 contract)
  - [x] Add new test file to root `smoke` script in `package.json` if created outside `schema.test.ts`

- [x] **Task 6: Verification** (AC: #1–#8)
  - [x] `bun run type-check` green
  - [x] `bun run smoke` green
  - [x] Local: start api → logs migrations + seed; inspect `./data/rpg-life.db` — `\`.tables\`` shows new tables + 7 skills
  - [x] `docker compose up` — api starts cleanly; DB persists new schema across restart
  - [x] Update `packages/db/README.md` or root README db section if present — document seed-on-startup

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 2.1 uncommitted diff vs baseline `a061bee`._

- [x] [Review][Patch] Missing Drizzle meta snapshot for `0001` + legacy Postgres `0000_snapshot.json` blocks `drizzle-kit generate` [`packages/db/migrations/meta/`] — fixed: SQLite `0000_snapshot.json` + `0001_snapshot.json`; journal version 6; `db:generate` clean
- [x] [Review][Patch] Skill seed uses `onConflictDoNothing` — catalog label/icon/sort_order changes never apply to existing DBs [`packages/db/src/seed/skills.ts`:17] — fixed: `onConflictDoUpdate` for display_name, sort_order, icon_key
- [x] [Review][Defer] `tasks.owner_id ON DELETE CASCADE` hard-deletes all tasks if user row is removed — MVP soft-delete is `deleted_at` only, not user lifecycle [`packages/db/src/schema/tasks.ts`:10]
- [x] [Review][Defer] Docker/README changes exceed pure schema scope but satisfy Task 6 verification — acceptable carry [`apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore`]

## Dev Notes

### Brownfield Starting Point (Post Epic 1)

| Exists today | Action |
|---|---|
| `packages/db/migrations/0000_init.sql` | **Keep** — auth + `user_progress`; Story 2.1 adds `0001_*` only |
| `packages/db/src/schema/user-progress.ts` | **Do not modify** |
| `packages/db/src/schema/auth.ts` | **Reuse** — `tasks.owner_id` FK → `users.id` (TEXT PK) |
| `packages/db/src/client.ts` | **Update** — merge new schema modules |
| `packages/db/drizzle.config.ts` | **Update** — register new schema files |
| `packages/db/src/seed.ts` (stub) | **Replace** — real seed runner |
| `apps/api/src/start.ts` | **Update** — call `runSeed` after migrations |
| `packages/validators/` (empty) | **Update** — add `skill-codes.ts` only |
| No `tasks` tRPC router | **Defer** — Story 2.2 |
| No repositories | **Defer** — Story 2.2+ (`packages/db/src/repositories/tasks.ts` per architecture) |
| Quest Board UI | **Unchanged** — still placeholder until Epic 2.2+ |

[Source: codebase read 2026-06-01; Epic 1 File Lists; `epic-1-retro-2026-05-29.md`]

### Binding Schema: `tasks`

Epic AC lists minimum columns; architecture + Epic 3 require idempotency fields **in this story**:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PK | Generate in app on create (crypto.randomUUID() or cuid — match future tRPC) |
| `owner_id` | TEXT | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Authorization scope |
| `title` | TEXT | NOT NULL | Max 200 enforced in validators (Story 2.4) |
| `description` | TEXT | NULL | Optional; no UI in MVP — column cheap for future |
| `due_date` | TEXT | NULL | `YYYY-MM-DD` date-only, not timestamp |
| `difficulty` | TEXT | NOT NULL | `trivial` \| `easy` \| `medium` \| `hard` |
| `status` | TEXT | NOT NULL DEFAULT `'open'` | `open` \| `completed` \| `cancelled` |
| `completed_at` | TEXT | NULL | ISO-8601 UTC on complete |
| `xp_awarded` | INTEGER | NULL | Set on first complete (idempotency) |
| `freshness_multiplier` | REAL | NULL | Set on first complete |
| `created_at` | TEXT | NOT NULL | ISO-8601 UTC |
| `modified_at` | TEXT | NOT NULL | ISO-8601 UTC |
| `deleted_at` | TEXT | NULL | Soft delete; exclude from default lists |

**Timestamp convention (critical):** New app tables use **TEXT ISO-8601** (same as `user_progress.modified_at`). Do **not** copy better-auth's `integer` timestamp_ms pattern onto `tasks`.

**Checks:** Enforce `completed_at` set when `status = 'completed'` in service layer (Story 3.2); optional SQL CHECK in migration if Drizzle supports cleanly.

[Source: `architecture.md` L262, L367; `brainstorming-session-2026-05-28-112057.md` L208–224; `epics.md` Story 2.1 AC]

### Binding Schema: `skills` (catalog)

| Column | Type | Constraints |
|--------|------|-------------|
| `code` | TEXT | PK — lowercase snake, e.g. `concentration` |
| `display_name` | TEXT | NOT NULL — UI label, e.g. `Concentration` |
| `description` | TEXT | NULL |
| `sort_order` | INTEGER | NOT NULL — 1–7 |
| `icon_key` | TEXT | NULL — Lucide name for UI (Story 2.3) |

### Binding Schema: `task_skills`

| Column | Type | Constraints |
|--------|------|-------------|
| `task_id` | TEXT | PK (composite), FK → `tasks(id)` ON DELETE CASCADE |
| `skill_code` | TEXT | PK (composite), FK → `skills(code)` |

1–3 rows per task enforced in **service layer** (Story 2.4), not DB CHECK.

### Binding Schema: `user_skills`

| Column | Type | Constraints |
|--------|------|-------------|
| `user_id` | TEXT | PK (composite), FK → `users(id)` ON DELETE CASCADE |
| `skill_code` | TEXT | PK (composite), FK → `skills(code)` |
| `xp` | INTEGER | NOT NULL DEFAULT 0, CHECK (`xp` >= 0) |

Rows created on first XP award (Story 3.2) — **no user_skills seed** in 2.1.

### Seed Data (Binding)

| code | display_name | sort_order | icon_key |
|------|--------------|------------|----------|
| concentration | Concentration | 1 | Target |
| vitality | Vitality | 2 | HeartPulse |
| lore | Lore | 3 | BookOpen |
| presence | Presence | 4 | Users |
| order | Order | 5 | LayoutList |
| resolve | Resolve | 6 | Shield |
| craft | Craft | 7 | Hammer |

[Source: `brainstorming-session-2026-05-28-112057.md` L273–283; `epics.md` UX-DR6; `architecture.md` L712]

### Recommended Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_tasks_owner_status` | `(owner_id, status)` | Open/completed lists |
| `idx_tasks_owner_due` | `(owner_id, due_date)` | Quest Board sort (Story 2.2) |
| `idx_task_skills_skill` | `(skill_code)` | Future skill filter |
| `idx_user_skills_user` | `(user_id)` | Profile load (Story 3.4) |

Partial indexes (`WHERE deleted_at IS NULL`) are nice-to-have; plain indexes OK for MVP SQLite scale.

[Source: `brainstorming-session-2026-05-28-112057.md` L264–271]

### Drizzle File Layout (Architecture Target)

```
packages/db/src/schema/
  auth.ts           # exists
  user-progress.ts  # exists — DO NOT EDIT
  tasks.ts          # NEW
  skills.ts         # NEW
  task-skills.ts    # NEW
  user-skills.ts    # NEW
packages/db/src/seed/
  skills.ts         # NEW
```

[Source: `architecture.md` L688–701]

### Migration Workflow (Binding)

```bash
# After editing schema TS files:
bun run db:generate   # creates 0001_*.sql — commit SQL + meta snapshot

# Local verify:
bun run db:migrate    # or start api (start.ts runs migrate)

# NEVER in Dockerfile:
# drizzle-kit push
```

Api startup sequence (binding):

```typescript
// apps/api/src/start.ts
await runMigrations();
await runSeed(db);
```

[Source: Story 1.1 Task 7; `architecture.md` L259, L567]

### `SkillCode` Validator (Binding)

```typescript
// packages/validators/src/skill-codes.ts
export const SKILL_CODES = [
  'concentration', 'vitality', 'lore', 'presence',
  'order', 'resolve', 'craft',
] as const;
export type SkillCode = (typeof SKILL_CODES)[number];
export const SkillCodeSchema = z.enum(SKILL_CODES);
```

Full task Zod schemas (`TaskCreateSchema`) deferred to Story 2.4 — **only** skill codes in 2.1.

### Test Pattern (Reuse from Story 1.5)

Follow `packages/api/src/__tests__/tutorial.test.ts` migration loading:

1. In-memory `Database(':memory:')`
2. `PRAGMA foreign_keys = ON`
3. Split `0000_init.sql` + `0001_*.sql` on `--> statement-breakpoint`
4. `drizzle(sqlite, { schema })` with all tables exported

Update root smoke if new test path:

```json
"smoke": "bun test apps/api/tests/scaffold.test.ts packages/db/src/schema.test.ts [new file]"
```

[Source: `tutorial.test.ts` L31–42; root `package.json` L20]

### Explicit Scope Boundaries

**In scope (Story 2.1):**
- Drizzle schema for `tasks`, `skills`, `task_skills`, `user_skills`
- Migration `0001_*` + seed on api startup
- `SkillCode` shared enum in validators
- Schema/seed unit tests; smoke green

**Out of scope (later stories):**
- `tasks.list` / `tasks.create` tRPC → **Story 2.2 / 2.4**
- Repositories + camelCase mapping → **Story 2.2+**
- Quest Board UI, FAB, filters → **Stories 2.2–2.7**
- Domain freshness/XP logic → **Story 3.1**
- `packages/ui/src/skill-icons.ts` → **Story 2.3**
- E2E with real Quest data → **Epic 4**

### Epic 1 / Retro Intelligence

**From Epic 1 retrospective:**
- Forward-provision schema early (1.1 `user_progress` pattern) — 2.1 must include idempotency columns now to avoid Epic 3 migration churn
- Migration tests use committed SQL files, not `push`
- Wire new db tests into root `smoke` (P1 retro action partially applies)
- Code review with fresh context before marking done

**From Story 1.5 (last Epic 1 story):**
- Router pattern established — 2.1 does **not** add routers yet; 2.2 follows `tutorial.ts` pattern
- In-memory SQLite + migration SQL split proven in API tests — reuse in db package tests
- `user_progress` provision on sign-in unchanged — no migration needed

[Source: `epic-1-retro-2026-05-29.md`; `1-5-first-run-tutorial.md`]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `a061bee` chore: epic 1 retro | Epic 2 kickoff; deferred-work ledger current |
| `b48ea0a` feat: tutorial | Migration test pattern; `start.ts` migration hook |
| `944a027` feat: app shell | Quest Board placeholder route exists — schema unblocks 2.2 |
| `6ea9ed4` feat: design setup | Skill icon names documented in UX — use in seed `icon_key` |

### Latest Tech Notes

- **Drizzle ORM** `^0.45.1` + **drizzle-kit** `^0.31.9` — use `sqliteTable`, `check()`, composite PK via tuple in second callback arg
- **Bun SQLite** — `bun:sqlite` driver already wired; seed uses same `db` instance as migrations
- **FK on delete:** `references(() => tasks.id, { onDelete: 'cascade' })` on `task_skills.task_id`
- **Idempotent seed:** `db.insert(skills).values(rows).onConflictDoNothing()` on `code` PK

### Anti-Patterns (Do Not)

- ❌ Alter `user_progress` or add narrative columns
- ❌ Create `tasks` router or Quest UI in this story
- ❌ Use `Quest` in table/procedure names
- ❌ `drizzle-kit push` in Docker or CI
- ❌ Hard-delete tasks (use `deleted_at` only)
- ❌ Integer timestamps on `tasks` (inconsistent with app-table convention)
- ❌ Defer `xp_awarded` / `freshness_multiplier` to Epic 3 (causes migration mid-epic)

[Source: `architecture.md` Enforcement Guidelines L528–536]

### Project Structure Notes

- Schema paths match architecture `packages/db/schema/` → actual repo uses `packages/db/src/schema/` (follow repo, not doc typo)
- Repositories folder deferred until tRPC reads/writes tasks
- Validators stay DB-free (no Drizzle imports)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.1, Epic 2, FR1 foundation]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture L251–264, Naming L364–387, Project Structure L682–701]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-05-28-112057.md` — Field-level schema L195–283]
- [Source: `_bmad-output/implementation-artifacts/1-1-scaffold-monorepo-and-development-infrastructure.md` — migration + startup pattern]
- [Source: `_bmad-output/implementation-artifacts/epic-1-retro-2026-05-29.md` — Epic 2 prep]
- [Source: `packages/db/src/schema/user-progress.ts`, `packages/db/migrations/0000_init.sql`, `apps/api/src/start.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- `drizzle-kit generate` failed: legacy Postgres `0000_snapshot.json` incompatible — wrote `0001_quest_schema.sql` manually + updated `_journal.json` (matches committed SQL pattern from Story 1.1)
- FK rejection tests use raw `sqlite.exec` — drizzle insert builder is lazy until `.run()`/`.execute()`

### Completion Notes List

- ✅ Four Drizzle schema modules: `tasks`, `skills`, `task_skills`, `user_skills` with indexes + FK cascades
- ✅ Migration `0001_quest_schema.sql` after `0000_init.sql`; `user_progress` untouched
- ✅ `tasks` includes idempotency columns (`completed_at`, `xp_awarded`, `freshness_multiplier`) + soft delete
- ✅ `SKILL_CATALOG` + `SkillCodeSchema` in `@rpg-life/validators`; seed imports catalog (no duplicate literals)
- ✅ `runSeed(db)` on api startup after migrations; CLI `bun db:seed` also works
- ✅ 7 quest-schema tests + smoke wired; `type-check` + `smoke` green (12 tests)
- ✅ README updated: seed-on-startup documented
- ℹ️ `docker compose up` verified 2026-06-01 — api + web start; migrations + seed; `/health` 200; web `/sign-in` 200. Fixes: `.dockerignore`, api Dockerfile, web Dockerfile (`WORKDIR apps/web` for build, drop missing `public/` copy).

### File List

- `packages/db/src/schema/tasks.ts`
- `packages/db/src/schema/skills.ts`
- `packages/db/src/schema/task-skills.ts`
- `packages/db/src/schema/user-skills.ts`
- `packages/db/src/seed/skills.ts`
- `packages/db/src/seed.ts`
- `packages/db/src/client.ts`
- `packages/db/src/index.ts`
- `packages/db/drizzle.config.ts`
- `packages/db/package.json`
- `packages/db/migrations/0001_quest_schema.sql`
- `packages/db/migrations/meta/_journal.json`
- `packages/db/src/__tests__/quest-schema.test.ts`
- `packages/validators/src/skill-codes.ts`
- `packages/validators/src/index.ts`
- `apps/api/src/start.ts`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `.dockerignore`
- `package.json`
- `README.md`
- `bun.lock`

## Change Log

- 2026-06-01: Story 2.1 — quest schema migration, skill catalog seed, validators SkillCode, api startup seed, tests
- 2026-06-01: Docker api — `.dockerignore`, api Dockerfile, `runMigrations` from `@rpg-life/db` main entry
- 2026-06-01: Docker web — build from `apps/web` cwd; remove missing `public/` copy

## Story Completion Status

- Status: **review** — all ACs satisfied; ready for code review
- Next: run `code-review` with fresh-context LLM, then Story 2.2 (`tasks.list`)
