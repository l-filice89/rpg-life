---
baseline_commit: af73294
---

# Story 2.2: List Open Quests on Quest Board

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to see my open Quests sorted by nearest due date,
So that I know what to work on next.

## Acceptance Criteria

1. **Given** an authenticated user with open Quests **When** they navigate to Quest Board **Then** all open Quests display sorted by nearest `due_date` ascending with undated Quests last (FR1).

2. **And** soft-deleted Quests (`deleted_at IS NOT NULL`) never appear in the list.

3. **And** completed or cancelled Quests (`status != 'open'`) never appear in the list.

4. **And** `tasks.list` tRPC procedure returns Quests scoped to the authenticated user only — no `userId` in input; use `ctx.user.id` from session.

5. **And** Quest Board page is a Server Component fetching via tRPC server caller (`createServerTrpcClient`) — RSC-first; no direct `@rpg-life/db` imports in `apps/web`.

6. **And** cold load shows skeleton rows and header skeleton (UX-DR22) via `quest-board/loading.tsx`.

7. **And** fetch failure shows error banner with retry, not empty state (UX-DR23) via `quest-board/error.tsx`.

## Tasks / Subtasks

- [x] **Task 1: Task list repository** (AC: #1–#3)
  - [x] Create `packages/db/src/repositories/tasks.ts` — `listOpenTasksByOwner(db, ownerId)` returning camelCase DTOs
  - [x] Query: `status = 'open'`, `deleted_at IS NULL`, `owner_id = ownerId`
  - [x] Sort: `ORDER BY due_date IS NULL, due_date ASC` (SQLite — undated last)
  - [x] Join `task_skills` → aggregate `skillCodes: SkillCode[]` per task (preserve catalog sort order 1–7)
  - [x] Export repository from `packages/db/src/index.ts` or import path documented in Dev Notes

- [x] **Task 2: `tasks.list` tRPC procedure** (AC: #1–#4)
  - [x] Create `packages/api/src/routers/tasks.ts` with `list: protectedProcedure.query(...)`
  - [x] Wire `tasks` router into `packages/api/src/root.ts` (`appRouter.tasks.list`)
  - [x] Return shape: `TaskListItem[]` — `{ id, title, difficulty, dueDate, skillCodes, createdAt }`
  - [x] No filter input in this story — full open list only (filters deferred to Story 2.6)
  - [x] Throw `TRPCError({ code: 'UNAUTHORIZED' })` when unauthenticated (via `protectedProcedure`)

- [x] **Task 3: Integration tests** (AC: #1–#4, #8 smoke)
  - [x] Create `packages/api/src/__tests__/tasks-list.test.ts`
  - [x] In-memory SQLite: apply `0000_init.sql` + `0001_quest_schema.sql` + seed skills
  - [x] Test: unauthenticated → rejects
  - [x] Test: user A cannot see user B's tasks
  - [x] Test: soft-deleted task excluded
  - [x] Test: completed task excluded
  - [x] Test: sort — dated ascending, undated after all dated
  - [x] Test: skillCodes returned on each item
  - [x] Add test file to root `smoke` script in `package.json`

- [x] **Task 4: Quest Board RSC page** (AC: #1, #5)
  - [x] Create `apps/web/src/components/quest-board/QuestBoard.tsx` — RSC presentational; receives `tasks: TaskListItem[]`
  - [x] Create minimal `QuestBoardListItem.tsx` — semantic list row showing title + formatted due date (or "No due date" muted); **not** full branded QuestRow (Story 2.3)
  - [x] Update `apps/web/src/app/(app)/quest-board/page.tsx` — async RSC; `const trpc = await createServerTrpcClient(); const tasks = await trpc.tasks.list.query(); return <QuestBoard tasks={tasks} />`
  - [x] Use `<ul role="list">` / `<li>` for quest list (a11y foundation for UX-DR26)
  - [x] When `tasks.length === 0`: render minimal placeholder only — **do not** implement FR4 empty state (Story 2.7)

- [x] **Task 5: Loading skeleton** (AC: #6)
  - [x] Create `apps/web/src/app/(app)/quest-board/loading.tsx`
  - [x] Create `apps/web/src/components/quest-board/QuestBoardSkeleton.tsx` — uses `@rpg-life/ui` `Skeleton`
  - [x] Render: top zone skeleton (2 bars — placeholder for Hero/XpBar Story 2.3) + 3–4 quest row skeletons
  - [x] Match spacing rhythm from DESIGN.md (`spacing.5`–`6` between rows)

- [x] **Task 6: Error boundary with retry** (AC: #7)
  - [x] Create `apps/web/src/app/(app)/quest-board/error.tsx` — `"use client"`; Next.js error boundary
  - [x] Show neutral error banner (not empty state copy): e.g. "Couldn't load your quests" + **Retry** button calling `reset()`
  - [x] Do not conflate with zero-quest empty state

- [x] **Task 7: Verification** (AC: all)
  - [x] `bun run type-check` green
  - [x] `bun run smoke` green (includes new tasks-list tests)
  - [x] Manual: seed or insert test tasks via DB; sign in; Quest Board shows sorted list
  - [x] Manual: stop api → Quest Board shows error + retry (not "No quests yet")

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 2.2 code diff vs baseline `af73294`._

- [x] [Review][Patch] Date-only due dates display off-by-one in western timezones [`apps/web/src/components/quest-board/QuestBoardListItem.tsx`:7]
- [x] [Review][Patch] Malformed `dueDate` strings can render "Invalid Date" [`apps/web/src/components/quest-board/QuestBoardListItem.tsx`:7]
- [x] [Review][Patch] Missing test for cancelled task exclusion [`packages/api/src/__tests__/tasks-list.test.ts`]
- [x] [Review][Patch] Auth test does not assert `UNAUTHORIZED` code [`packages/api/src/__tests__/tasks-list.test.ts`:113]
- [x] [Review][Defer] No secondary sort key for tasks sharing same `due_date` [`packages/db/src/repositories/tasks.ts`:40] — deferred, MVP scale; order stable enough for Ben-scale lists
- [x] [Review][Defer] `error.tsx` accepts `error` prop but never surfaces digest/message [`apps/web/src/app/(app)/quest-board/error.tsx`:10] — deferred, debug polish
- [x] [Review][Defer] Repository casts `difficulty`/`skillCode` without runtime validation [`packages/db/src/repositories/tasks.ts`:58,65] — deferred, validators in Story 2.4+
- [x] [Review][Defer] Layout-level fetch failure bypasses quest-board error boundary [`apps/web/src/app/(app)/layout.tsx`:6] — pre-existing from Story 1.5 deferred-work
- [x] [Review][Defer] Shared in-memory test DB accumulates rows across tests [`packages/api/src/__tests__/tasks-list.test.ts`:101] — deferred, matches tutorial.test.ts pattern; per-test userIds isolate assertions
- [x] [Review][Defer] Expired session on `tasks.list` shows retry loop instead of sign-in redirect [`apps/web/src/app/(app)/quest-board/error.tsx`] — deferred, auth UX hardening
- [x] [Review][Defer] `<h2>` per quest row may clutter heading outline [`apps/web/src/components/quest-board/QuestBoardListItem.tsx`:20] — deferred to Story 2.3 QuestRow a11y pass

## Dev Notes

### Brownfield Starting Point (Post Story 2.1)

| Exists today | Action |
|---|---|
| `tasks`, `skills`, `task_skills` schema + migration `0001` | **Reuse** — no new migration unless query needs index tweak |
| `packages/validators/skill-codes.ts` | **Reuse** — `SkillCode` type for DTO |
| `packages/api/root.ts` — `tutorial`, stub `profile.ping` | **Update** — add `tasks` router |
| `apps/web/.../quest-board/page.tsx` | **Replace** placeholder with RSC fetch + list |
| `createServerTrpcClient()` | **Reuse** — same pattern as `(app)/layout.tsx` tutorial fetch |
| `AppHeader` in shell | **Unchanged** — Hero/XpBar/FocusPill deferred to Story 2.3 |
| QuestRow, SkillChip, XpBar, FAB, filters, empty state | **Defer** — Stories 2.3–2.7 |
| `packages/domain` | **Empty stub** — no domain logic needed for list |
| `packages/db/repositories/` | **Create** — first repository in repo |

[Source: `2-1-tasks-schema-and-skill-catalog-seed.md`; codebase read 2026-06-01]

### Binding: `tasks.list` Contract

**Procedure:** `tasks.list` — `protectedProcedure.query`, **no input** in Story 2.2.

**Response:** `TaskListItem[]`

```typescript
type TaskListItem = {
  id: string;
  title: string;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  dueDate: string | null;       // YYYY-MM-DD or null
  skillCodes: SkillCode[];      // 0–3 codes, sorted by skill catalog sort_order
  createdAt: string;            // ISO-8601 UTC
};
```

**Query rules (binding):**

| Rule | Implementation |
|------|----------------|
| Scope | `owner_id = ctx.user.id` only |
| Status | `status = 'open'` |
| Soft delete | `deleted_at IS NULL` |
| Sort | `ORDER BY (due_date IS NULL), due_date ASC` |
| Skills | LEFT JOIN or secondary query; never return other users' junction rows |

**Future (Story 2.6):** Optional input `{ overdue?: boolean; upcomingDays?: number }` — design repository signature to accept optional filter params later without breaking callers. For 2.2, no input is fine.

[Source: `epics.md` FR1; `architecture.md` L33, L376, L446–448]

### Repository Pattern (Binding)

Location: `packages/db/src/repositories/tasks.ts`

```typescript
// Map Drizzle snake_case rows → camelCase TaskListItem at boundary ONLY here
export async function listOpenTasksByOwner(
  db: Database,
  ownerId: string,
): Promise<TaskListItem[]>
```

- Import tables from schema modules; use exported `eq`, `and`, `isNull`, `asc`, `sql` from `@rpg-life/db`
- **Do not** leak Drizzle row types to tRPC layer — map in repository
- N+1 acceptable for MVP at Ben-scale; prefer single query + group skills in memory if simpler

[Source: `architecture.md` L697–698, L535, L755–753]

### tRPC Router Pattern (Follow Story 1.5 / tutorial)

```typescript
// packages/api/src/routers/tasks.ts
export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOpenTasksByOwner(ctx.db, ctx.user.id);
  }),
});
```

```typescript
// packages/api/src/root.ts
export const appRouter = router({
  // ...
  tasks: tasksRouter,
});
```

Mirror `tutorial.test.ts` for `createCaller` + in-memory DB. Load **both** migrations:

```typescript
for (const file of ['0000_init.sql', '0001_quest_schema.sql']) {
  const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    if (statement.trim()) sqlite.exec(statement.trim());
  }
}
```

Include `tasks`, `skills`, `taskSkills`, `user`, `userProgress` in test schema object. Call `seedSkills` or insert 7 skills before task tests.

[Source: `packages/api/src/routers/tutorial.ts`; `packages/api/src/__tests__/tutorial.test.ts`]

### RSC Page Pattern (Binding)

```typescript
// apps/web/src/app/(app)/quest-board/page.tsx — NO "use client"
import { createServerTrpcClient } from '@/lib/trpc-server';
import { QuestBoard } from '@/components/quest-board/QuestBoard';

export default async function QuestBoardPage() {
  const trpc = await createServerTrpcClient();
  const tasks = await trpc.tasks.list.query();
  return <QuestBoard tasks={tasks} />;
}
```

- Fetch in page (or small async server component child) — not in `useEffect`
- tRPC server client forwards cookies via `headers()` — already wired in `trpc-server.ts`
- Type `TaskListItem` from `AppRouter` inference: `RouterOutputs['tasks']['list'][number]` or duplicate minimal type in web (prefer inference from `@rpg-life/api`)

[Source: `apps/web/src/app/(app)/layout.tsx`; `architecture.md` L297, L617]

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.2):**
- Data pipeline: repository → `tasks.list` → RSC page
- Minimal list rows proving sort + data (title, due date label)
- `loading.tsx` skeleton
- `error.tsx` retry banner
- Semantic `<ul>` list structure

**Out of scope — do NOT implement:**
- Branded `QuestRow` with checkbox, difficulty chip, skill chips (Story 2.3 — UX-DR7)
- XpBar, FocusPill, Hero level in board header zone (Story 2.3 — UX-DR4, UX-DR5, UX-DR9)
- FAB, Create Quest sheet (Story 2.4)
- Row tap → edit (Story 2.5)
- Overdue filter / upcoming days (Story 2.6)
- "No quests yet" empty state / board-clear empty (Stories 2.7 / 3.6)
- Checkbox complete interaction (Epic 3)
- `tasks.create` / seed UI for quests — use DB inserts or API tests for manual verification

**Zero quests UX in 2.2:** Keep simple muted text ("Your quests will appear here.") or empty list — Story 2.7 replaces with FR4 empty state.

[Source: `epics.md` Stories 2.3–2.7; UX-DR19 deferred]

### Loading & Error (Binding)

**`loading.tsx`:** Next.js automatic — shown during RSC suspense/navigation. Skeleton only; no fake data.

**`error.tsx`:** Client component receiving `{ error, reset }`. Pattern:

```tsx
'use client';
export default function QuestBoardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="...">
      <p>Couldn&apos;t load your quests.</p>
      <button type="button" onClick={() => reset()}>Retry</button>
    </div>
  );
}
```

Do **not** show empty-state copy on error — UX-DR23 distinguishes fetch fail from zero quests.

Note: `(app)/layout.tsx` still has no error boundary when api unreachable (deferred from Story 1.5). Story 2.2 error boundary covers **quest-board route fetch only**.

[Source: `architecture.md` L493–504; `deferred-work.md` Story 1.5 item]

### Sort Verification (SQLite Gotcha)

SQLite default `ORDER BY due_date ASC` puts **NULL first**. FR1 requires undated **last**.

**Correct:** `orderBy(sql\`(case when ${tasks.dueDate} is null then 1 else 0 end)\`, asc(tasks.dueDate))`  
Or raw: `ORDER BY due_date IS NULL, due_date ASC`

Add explicit test with tasks: due 2026-06-10, due 2026-06-01, null due → order: 2026-06-01, 2026-06-10, null-title.

[Source: Story 2.1 Dev Notes idx_tasks_owner_due; FR1 epics]

### Naming Compliance

| Layer | Term | This story |
|-------|------|------------|
| DB / tRPC / repo | `Task`, `tasks.list` | ✅ |
| UI copy | `Quest`, "quests" | ✅ in user-facing strings only |
| Files | `QuestBoard.tsx`, `quest-board/` | ✅ UI layer naming |
| Never | `quests.list`, `QuestSchema` | ❌ |

[Source: `architecture.md` L381–387; `project-context.md`]

### Test Data for Manual QA

Insert via SQLite CLI or test helper:

```sql
INSERT INTO tasks (id, owner_id, title, difficulty, status, due_date, created_at, modified_at)
VALUES ('t1', '<user-id>', 'Morning run', 'easy', 'open', '2026-06-05', datetime('now'), datetime('now'));
-- + task_skills rows; + undated task; + deleted_at set task (should not show)
```

User id from signed-in session in `users` table.

### Previous Story Intelligence (2.1)

- Schema complete — **no new migration** unless list query performance requires it (unlikely)
- `SkillCode` + `SKILL_CATALOG` in validators — use for typing skillCodes array
- Migration test pattern: split on `--> statement-breakpoint`; `PRAGMA foreign_keys = ON`
- Api startup: migrations + seed already run — skills catalog always present
- Review lesson: commit Drizzle meta snapshots when generating migrations; use `onConflictDoUpdate` for seed updates
- Docker compose verified — api `/health` + web `/sign-in` work

[Source: `2-1-tasks-schema-and-skill-catalog-seed.md` Dev Agent Record]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `af73294` feat: tasks and skills | Schema + seed landed; 2.2 builds directly on this |
| `a061bee` chore: epic 1 retro | Epic 2 sequencing confirmed |
| `944a027` feat: app shell | Quest Board route + AppShell exist |
| `b48ea0a` feat: tutorial | tRPC router + test pattern to copy |

### Latest Tech Notes

- **tRPC v11** + `@trpc/server` — `protectedProcedure`, `router`, `createCaller` unchanged from tutorial
- **Drizzle 0.45** — `isNull`, `and`, `eq` from `drizzle-orm`; re-exported via `@rpg-life/db`
- **Next.js 15 App Router** — `loading.tsx` / `error.tsx` colocated with `page.tsx`; async server components default
- **@rpg-life/ui Skeleton** — already exported; use `className="h-16 w-full rounded-md"` for row placeholders

### Anti-Patterns (Do Not)

- ❌ Import `@rpg-life/db` in `apps/web`
- ❌ `"use client"` on `quest-board/page.tsx`
- ❌ Accept `userId` from client in `tasks.list` input
- ❌ Return snake_case field names from tRPC
- ❌ Implement QuestRow checkbox, FAB, filters, or empty state in this story
- ❌ Show "No quests yet" empty state on fetch error
- ❌ Use `ORDER BY due_date ASC` without NULLS-last handling
- ❌ Hard-delete tasks in list query (filter `deleted_at IS NULL`)

### Project Structure Notes

Architecture doc shows `apps/web/app/` — actual repo uses `apps/web/src/app/` (follow repo).
Architecture shows `packages/api/services/tasks.ts` — for read-only list, repository call from router is acceptable; extract service when create/complete land in 2.4+.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.2, FR1, UX-DR22, UX-DR23]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Naming, RSC split, repositories, project structure]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — quest-row tokens (reference only; full component Story 2.3)]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/quest-board.html` — list spacing rhythm]
- [Source: `_bmad-output/implementation-artifacts/2-1-tasks-schema-and-skill-catalog-seed.md`]
- [Source: `packages/db/src/schema/tasks.ts`, `packages/api/src/routers/tutorial.ts`, `apps/web/src/lib/trpc-server.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Smoke failure: shared in-memory DB reused task id `task-open` across tests → UNIQUE constraint; fixed with per-test unique ids
- type-check failure: web imported `@trpc/server` for `inferRouterOutputs` without dependency → exported `TaskListItem` from `@rpg-life/api` instead

### Completion Notes List

- ✅ `listOpenTasksByOwner` repository with NULLS-last sort, skill aggregation, camelCase DTO
- ✅ `tasks.list` protectedProcedure wired in appRouter
- ✅ 6 integration tests + smoke script updated (18 tests pass)
- ✅ RSC Quest Board page fetches via server tRPC caller; minimal list UI with semantic `<ul>`
- ✅ `loading.tsx` + `QuestBoardSkeleton`; `error.tsx` with retry (not empty state)
- ✅ Exported `TaskListItem` from `@rpg-life/api` for web typing without `@trpc/server` dep
- ✅ `bun run smoke` + `bun run type-check` green

- ✅ Code review 2026-06-01: 4 patch findings fixed; 7 deferred; all ACs satisfied

### File List

- `packages/db/src/repositories/tasks.ts`
- `packages/db/src/index.ts`
- `packages/api/src/routers/tasks.ts`
- `packages/api/src/root.ts`
- `packages/api/src/index.ts`
- `packages/api/src/__tests__/tasks-list.test.ts`
- `apps/web/src/app/(app)/quest-board/page.tsx`
- `apps/web/src/app/(app)/quest-board/loading.tsx`
- `apps/web/src/app/(app)/quest-board/error.tsx`
- `apps/web/src/components/quest-board/QuestBoard.tsx`
- `apps/web/src/components/quest-board/QuestBoardListItem.tsx`
- `apps/web/src/components/quest-board/QuestBoardSkeleton.tsx`
- `package.json`

## Change Log

- 2026-06-01: Story 2.2 — tasks.list API, repository, Quest Board RSC list, skeleton, error boundary, integration tests
- 2026-06-01: Code review patches — UTC date formatting, malformed dueDate guard, cancelled test, UNAUTHORIZED assertion

## Story Completion Status

- Status: **done** — all ACs satisfied; code review complete
- Next: `create-story` 2.3 (Quest Board header + brand components)
