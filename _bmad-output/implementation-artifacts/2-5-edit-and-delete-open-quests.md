---
baseline_commit: 0651426
---

# Story 2.5: Edit and Delete Open Quests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to edit or delete my open Quests,
So that I can keep my Quest Board accurate as plans change.

## Acceptance Criteria

1. **Given** an open Quest on Quest Board **When** Ben taps the row body (not the checkbox) **Then** the Edit Quest sheet opens pre-filled with current title, difficulty, Skills, and due date (FR6, UX-DR14).

2. **And** field order matches Create sheet: title → difficulty → skill chips → due date; save disabled until non-empty trimmed title and ≥1 Skill; max 3 Skills enforced (UX-DR14).

3. **When** Ben saves valid edits **Then** `tasks.update` persists changes scoped to `ctx.user.id` **And** `task_skills` rows are replaced in a transaction **And** the Quest Board reflects updates via `router.refresh()` without manual reload.

4. **And** Skill tag edits are free — no Focus spend (FR6, PRD FR-6).

5. **When** Ben deletes a **non-overdue** open Quest **Then** a confirmation dialog appears **And** confirming soft-deletes the Quest (`deleted_at` set) with no Focus cost **And** the Quest disappears from Quest Board default views (FR6).

6. **When** network fails on update or delete **Then** no partial UI state change **And** error toast with retry hint (NFR2, UX-DR23).

7. **And** completed Quests cannot be edited — `tasks.update` returns `NOT_FOUND` or `BAD_REQUEST` if `status !== 'open'` (FR6); Quest Board only lists open Quests today, but server guard is mandatory.

8. **And** row body tap target is keyboard-accessible (`button` or `role="button"`, Enter/Space); checkbox tap does **not** open edit sheet (UX-DR26, EXPERIENCE.md Quest row).

9. **And** integration tests cover `tasks.update` and `tasks.delete` auth, validation, owner scoping, soft-delete exclusion from `tasks.list`, and completed-task rejection; smoke script updated.

10. **Note (explicit deferrals — do NOT implement in 2.5):** Focus-gated **delete overdue**, **add due date to previously undated Quest**, and **reschedule overdue** → Story 3.5 after `focus.spend` exists (FR6 Focus-gated mutations, FR11). Checkbox complete → Epic 3.

## Tasks / Subtasks

- [x] **Task 1: Validators — update + delete schemas** (AC: #3, #5, #7)
  - [x] Extend `packages/validators/src/task.ts`:
    - `TaskUpdateSchema` = `TaskCreateSchema.extend({ id: z.string().uuid() })`
    - `TaskDeleteSchema` = `z.object({ id: z.string().uuid() })`
  - [x] Export `TaskUpdateInput`, `TaskDeleteInput` from `packages/validators/src/index.ts`

- [x] **Task 2: Repository — `updateTaskForOwner` + `softDeleteTaskForOwner`** (AC: #3, #5, #7)
  - [x] Add `updateTaskForOwner(db, ownerId, input: TaskUpdateInput): Promise<TaskListItem>` in `packages/db/src/repositories/tasks.ts`
    - Fetch task by `id` + `ownerId` + `deletedAt IS NULL` + `status = 'open'` — else throw typed error for router mapping
    - **Add-due-date gate (2.5):** if existing `dueDate` is `null` and input `dueDate` is a non-null date string → reject (defer Focus flow to 3.5; map to `BAD_REQUEST` in router with neutral message)
    - Update `tasks` row: title, difficulty, dueDate, `modifiedAt = now`
    - Replace `task_skills`: delete existing rows for task, insert new set (transaction)
    - Return camelCase `TaskListItem` with sorted `skillCodes`
  - [x] Add `softDeleteTaskForOwner(db, ownerId, taskId: string): Promise<{ id: string }>`
    - Same ownership/open guards as update
    - **Overdue gate (2.5):** if `dueDate` is set and before today (UTC date compare — mirror `isOverdue` logic server-side) → reject with `BAD_REQUEST` (Focus delete deferred to 3.5)
    - Set `deleted_at` + `modified_at` to ISO UTC now; do **not** hard-delete
  - [x] Export new functions from `packages/db/src/index.ts`

- [x] **Task 3: tRPC — `tasks.update` + `tasks.delete`** (AC: #3, #5, #7, #9)
  - [x] Extend `packages/api/src/routers/tasks.ts`:
    - `update: protectedProcedure.input(TaskUpdateSchema).mutation(...)`
    - `delete: protectedProcedure.input(TaskDeleteSchema).mutation(...)`
  - [x] Map repository errors → `TRPCError`: `NOT_FOUND` (wrong id / wrong owner / already deleted), `BAD_REQUEST` (completed, add-due-date gate, overdue delete gate, validation)
  - [x] Export `TaskUpdateInput` from `@rpg-life/api`
  - [x] Create `packages/api/src/__tests__/tasks-update.test.ts`:
    - unauthenticated → `UNAUTHORIZED`
    - invalid id / not owner / soft-deleted / completed task → `NOT_FOUND` or `BAD_REQUEST`
    - valid update → fields + `task_skills` replaced; returned `TaskListItem` matches
    - undated quest + input sets `dueDate` → `BAD_REQUEST` (add-date gate)
    - skill count / duplicate / empty title → `BAD_REQUEST`
  - [x] Create `packages/api/src/__tests__/tasks-delete.test.ts`:
    - unauthenticated → `UNAUTHORIZED`
    - not owner / already deleted → `NOT_FOUND`
    - non-overdue open quest → soft-deleted; excluded from `tasks.list`
    - overdue open quest → `BAD_REQUEST` (Focus gate deferred)
  - [x] Add both test files to root `package.json` `smoke` script

- [x] **Task 4: Shared quest form — extract from Create** (AC: #2, #3)
  - [x] Create `apps/web/src/components/quest-sheet/QuestFormFields.tsx` — controlled fields shared by create/edit (title, difficulty, skills, due date)
  - [x] **Option A (preferred per architecture):** Refactor to `QuestSheet.tsx` with `mode: 'create' | 'edit'` + optional `initialTask: TaskListItem`
  - [x] **Option B:** Keep `CreateQuestSheet.tsx`; add `EditQuestSheet.tsx` importing shared `QuestFormFields`
  - [x] Edit mode: pre-fill from `initialTask`; sheet title "Edit Quest"; primary button "Save Quest"
  - [x] Edit mode due-date UX when `initialTask.dueDate === null`: disable date input OR show helper "Adding a due date costs 1 Focus — coming soon" (Story 3.5); do not call update with new date
  - [x] Reuse patterns from `CreateQuestSheet.tsx`: `useSheetSide`, `TaskCreateSchema`/`TaskUpdateSchema` safeParse, submit guard, toast copy

- [x] **Task 5: Delete confirmation dialog** (AC: #5, #6)
  - [x] In edit sheet footer: destructive "Delete Quest" button (outline/destructive variant)
  - [x] Hidden or disabled when quest is overdue — neutral helper: "Overdue quests require Focus to delete." (Story 3.5)
  - [x] Non-overdue: opens shadcn `Dialog` — title "Delete this quest?"; body neutral copy; Confirm / Cancel
  - [x] Confirm → `trpc.tasks.delete.useMutation`; success → close sheet + dialog, `router.refresh()`; optional success toast (neutral, not punitive)
  - [x] Error → toast with retry hint (mirror create pattern)

- [x] **Task 6: `QuestRowEditTrigger` client leaf** (AC: #1, #8)
  - [x] Create `apps/web/src/components/quest-board/QuestRowEditTrigger.tsx` — `"use client"`
  - [x] Props: `task: TaskListItem`; wraps row body (title + meta chips), **not** checkbox
  - [x] `<button type="button">` full-width text-left styling; `aria-label={`Edit quest: ${task.title}`}`
  - [x] Local state for edit sheet open; renders `EditQuestSheet` / `QuestSheet mode="edit"`
  - [x] Update `QuestRow.tsx` (RSC): keep `QuestRowActions` separate; wrap content div with `QuestRowEditTrigger`

- [x] **Task 7: Wire + verify** (AC: all)
  - [x] `bun run type-check` green
  - [x] `bun run smoke` green
  - [x] Manual: tap row body → edit sheet with values; save updates list order if due date changed
  - [x] Manual: delete non-overdue → confirm → row gone
  - [x] Manual: overdue row still shows edit; delete disabled/blocked with neutral message
  - [x] Manual: checkbox click does not open edit sheet
  - [x] Manual: stop api → save/delete shows error toast

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 2.5 uncommitted diff vs baseline `0651426`._

- [x] [Review][Patch] Server allows overdue Focus bypass via update (clear or reschedule due date) [`packages/db/src/repositories/tasks.ts`:165]
- [x] [Review][Patch] Edit sheet overdue/delete UI uses stale `task` prop, not form `dueDate` [`apps/web/src/components/quest-sheet/EditQuestSheet.tsx`:54]
- [x] [Review][Patch] Duplicate `quest-title` / `quest-due-date` IDs across N mounted edit sheets + create sheet [`apps/web/src/components/quest-sheet/QuestFormFields.tsx`:42]
- [x] [Review][Patch] Delete dialog state not reset when edit sheet closes via backdrop [`apps/web/src/components/quest-sheet/EditQuestSheet.tsx`:57]
- [x] [Review][Patch] Save and delete can overlap — no mutual `isPending` guard [`apps/web/src/components/quest-sheet/EditQuestSheet.tsx`:68]
- [x] [Review][Patch] AC9 gaps: update missing zero-skills and >3-skills tests; delete missing completed-task test [`packages/api/src/__tests__/tasks-update.test.ts`]
- [x] [Review][Defer] TOCTOU: update/delete read task status/deletedAt once, no re-check in transaction [`packages/db/src/repositories/tasks.ts`:177] — MVP single-tab scale
- [x] [Review][Defer] Concurrent tab last-write-win on skill replace — no optimistic locking [`packages/db/src/repositories/tasks.ts`:188] — Ben-scale MVP
- [x] [Review][Defer] `router.refresh()` while edit sheet open resets form from new `task` prop [`apps/web/src/components/quest-sheet/EditQuestSheet.tsx`:57] — rare edge
- [x] [Review][Defer] Invalid calendar dates pass regex-only Zod (e.g. 2026-02-31) [`packages/validators/src/task.ts`:16] — same class as Story 2.4 create
- [x] [Review][Defer] Cancelled tasks get misleading "Completed quests cannot be edited" message [`packages/db/src/repositories/tasks.ts`:50] — cancelled status not surfaced in MVP UI

## Dev Notes

### Brownfield Starting Point (Post Story 2.4)

| Exists today | Action |
|---|---|
| `tasks.create` + `TaskCreateSchema` + `createTaskForOwner` | **Reuse** patterns for update/delete |
| `CreateQuestSheet.tsx` | **Refactor/extract** shared form; add edit mode |
| `QuestRow.tsx` RSC + `QuestRowActions` client checkbox stub | **Update** — add `QuestRowEditTrigger` on body |
| `tasks.list` + soft-delete filter (`deletedAt IS NULL`) | **Reuse** — delete must set `deleted_at`; list unchanged |
| `isOverdue` in `format-due-date.ts` | **Reuse** client-side for delete UI gate; **duplicate UTC logic** in repository for server gate |
| `SkillChip`, `SKILL_CATALOG`, difficulty labels | **Reuse** |
| `toast`, `Sheet`, `Dialog` from `@rpg-life/ui` | **Reuse** |
| `focus.spend`, Focus delete overdue, add due date | **Defer** — Story 3.5 |
| Checkbox complete / confirm modal | **Defer** — Epic 3 |
| Quest Board filters, FR4 empty state | **Defer** — Stories 2.6–2.7 |

[Source: codebase read 2026-06-01; `2-4-create-quest-via-fab.md`]

### Binding: `tasks.update` Contract

**Procedure:** `tasks.update` — `protectedProcedure.mutation`, input `TaskUpdateSchema`.

**Input (`TaskUpdateInput`):**

```typescript
{
  id: string;              // UUID
  title: string;           // trimmed, min 1, max 200
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  skillCodes: SkillCode[]; // 1–3 unique
  dueDate?: string | null; // YYYY-MM-DD or null/omitted
}
```

**Response:** `TaskListItem` (same shape as `tasks.list` items).

**Server guards (mandatory):**

| Guard | Behavior |
|-------|----------|
| Ownership | `owner_id === ctx.user.id` |
| Not soft-deleted | `deleted_at IS NULL` |
| Open only | `status === 'open'` |
| Add due date gate | If DB `due_date` was `null` and input sets a date → `BAD_REQUEST` ("Adding a due date requires Focus — coming in a future update." or similar neutral copy) |
| Skill edits | Free — no Focus |

**Persistence:** Transaction — update `tasks` row + delete/insert `task_skills`; bump `modified_at`.

[Source: `epics.md` Story 2.5; `prd.md` FR-6; `architecture.md` tasks router]

### Binding: `tasks.delete` Contract

**Procedure:** `tasks.delete` — `protectedProcedure.mutation`, input `TaskDeleteSchema` (`{ id }`).

**Response:** `{ id: string }` (minimal ack) or `void` — pick one and stay consistent with other routers.

**Server guards:**

| Guard | Behavior |
|-------|----------|
| Ownership + open + not deleted | Same as update |
| Non-overdue only (Story 2.5) | If `due_date < today` (UTC) → `BAD_REQUEST` — overdue delete deferred to Story 3.5 + `focus.spend` |
| Soft delete | Set `deleted_at` + `modified_at`; never `DELETE FROM tasks` |

**Post-delete:** Quest excluded from `tasks.list` (existing `isNull(deletedAt)` filter).

[Source: `epics.md` Story 2.5 note; `prd.md` FR-6 delete rules]

### UTC Overdue Helper (Server)

Mirror client `isOverdue` without importing from `apps/web`:

```typescript
function isOverdueUtc(dueDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return false;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dueUtc < todayUtc;
}
```

Place in `packages/db/src/repositories/tasks.ts` (private) or `packages/domain` if reused later — keep in repository for minimal scope.

[Source: `apps/web/src/lib/format-due-date.ts`]

### Row Tap vs Checkbox (Binding — UX-DR14, Architecture)

```
┌─────────────────────────────────────────────┐
│ [Checkbox]  │  ← QuestRowActions (client)   │
│  (Epic 3)   │     NOT edit trigger          │
│             │  ┌──────────────────────────┐ │
│             │  │ QuestRowEditTrigger      │ │
│             │  │ (button — row body tap)  │ │
│             │  │ title, chips, due date   │ │
│             │  └──────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- Checkbox: `pointer-events-none` + disabled until Epic 3 — unchanged
- Edit trigger: `<button type="button" className="min-w-0 flex-1 text-left">` wrapping meta block
- Do **not** convert `QuestRow.tsx` to `"use client"` — only leaf islands

[Source: `architecture.md` L1020–1021; `EXPERIENCE.md` Quest row]

### Edit Quest Sheet Layout (Binding — UX-DR14)

```
SheetHeader: "Edit Quest"
─────────────────────────
(same fields as Create — pre-filled)
─────────────────────────
[ Delete Quest ]     (destructive, secondary row — non-overdue only)
[ Save Quest ]       (primary, disabled until valid)
```

Delete uses shadcn `Dialog` overlay — not inline destructive save.

[Source: `EXPERIENCE.md` Edit Quest sheet; `architecture.md` QuestSheet]

### Toast Copy (Binding)

| Event | Copy |
|-------|------|
| Update success | `Quest updated` (optional description: neutral encouragement) |
| Delete success | `Quest removed` or `Quest deleted` — neutral, not punitive |
| Update/delete error | `Could not save quest. Check your connection and try again.` / `Could not delete quest. Check your connection and try again.` |
| Validation parse fail | `Could not save quest. Check the fields and try again.` |

Tone: UX-DR27 — no shame language.

[Source: `EXPERIENCE.md` voice table; `CreateQuestSheet.tsx` error pattern]

### Post-Mutation List Refresh (Binding)

Same as Story 2.4:

```typescript
router.refresh(); // after successful update or delete
```

Do not manually splice local list. Do not import `@rpg-life/db` in web.

[Source: `2-4-create-quest-via-fab.md`]

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.5):**
- `TaskUpdateSchema`, `TaskDeleteSchema`
- `tasks.update`, `tasks.delete` + repository functions
- Edit sheet (row tap) + delete confirmation (non-overdue free)
- `QuestRowEditTrigger` + shared form extraction
- API integration tests + smoke

**Out of scope — do NOT implement:**
- Focus-gated delete overdue (Story 3.5)
- Focus-gated add due date to undated quest (Story 3.5)
- Reschedule overdue via Focus (Story 3.5)
- Checkbox complete / confirm / reward (Epic 3)
- Quest Board filters (Story 2.6)
- FR4 empty state (Story 2.7)
- Editing completed quests (only guard — no completed rows on board yet)
- Hard delete
- Optimistic UI updates

### Previous Story Intelligence (2.4)

- Controlled form state + `safeParse` on submit — no RHF required
- Double-submit guard: check `mutation.isPending` at start of handler
- Title `maxLength={200}` on input
- Assert explicit tRPC error **codes** in tests (`UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`)
- `createTaskForOwner` transaction pattern — copy for update skill replacement
- Code review deferred: invalid FK → raw DB error; shared test DB row accumulation — same class, acceptable

[Source: `2-4-create-quest-via-fab.md`]

### Previous Story Intelligence (2.2–2.3)

- `tasks.list` filters `status = 'open'` AND `deletedAt IS NULL` — delete must only set timestamp
- Sort after edit: changing `due_date` repositions row on refresh
- `QuestRow` `<article>` + semantic list — preserve structure
- RSC Quest Board + client islands pattern — do not clientify page

[Source: `2-2-list-open-quests-on-quest-board.md`; `2-3-quest-board-header-and-brand-components.md`]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `0651426` feat: quest creation | Baseline — create sheet, `tasks.create`, FAB |
| `7be1df9` feat: quest board header | QuestRow, header, brand components |
| `2252f15` feat: task visualization | `tasks.list`, Quest Board RSC |

### Latest Tech Notes

- **tRPC v11** — `useMutation` for update/delete; same cookie session as create
- **Zod 3** — `TaskUpdateSchema` extends create fields + `id`
- **shadcn Dialog** — use for delete confirm; Sheet stays open until delete succeeds or user cancels dialog
- **Drizzle transaction** — `db.transaction` for update + skill replace (matches create)
- **No AlertDialog in `@rpg-life/ui` yet** — use existing `Dialog` primitives from index

### Anti-Patterns (Do Not)

- ❌ Allow overdue delete without Focus in 2.5 (anti-exploit — defer to 3.5)
- ❌ Allow adding first due date on undated quest without Focus (defer to 3.5)
- ❌ Hard-delete tasks
- ❌ Accept `ownerId` from client
- ❌ Open edit sheet from checkbox click
- ❌ Convert `QuestBoard.tsx` or `QuestRow.tsx` to full client components
- ❌ Implement `focus.spend` in this story
- ❌ Skip server guards because board only shows open quests
- ❌ Break `tasks.create` or `tasks.list` behavior
- ❌ Punitive delete copy ("Quest abandoned", etc.)

### Project Structure Notes

```
packages/validators/src/task.ts              # add TaskUpdateSchema, TaskDeleteSchema
packages/db/src/repositories/tasks.ts        # updateTaskForOwner, softDeleteTaskForOwner
packages/api/src/routers/tasks.ts            # update, delete
packages/api/src/__tests__/tasks-update.test.ts
packages/api/src/__tests__/tasks-delete.test.ts
apps/web/src/components/quest-sheet/         # QuestFormFields and/or QuestSheet
apps/web/src/components/quest-board/QuestRowEditTrigger.tsx
apps/web/src/components/quest-board/QuestRow.tsx  # wire trigger
```

Export `TaskUpdateInput` from `@rpg-life/api` alongside `TaskCreateInput`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.5, FR6 note]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-6 edit/delete, Focus deferrals]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — Quest row tap, Edit sheet]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — QuestSheet, QuestRowEditTrigger, tasks.update/delete]
- [Source: `_bmad-output/implementation-artifacts/2-4-create-quest-via-fab.md`]
- [Source: `_bmad-output/implementation-artifacts/2-2-list-open-quests-on-quest-board.md`]
- [Source: `apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`]
- [Source: `apps/web/src/components/quest-board/QuestRow.tsx`]
- [Source: `packages/db/src/repositories/tasks.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Chose Option B (shared `QuestFormFields` + separate `EditQuestSheet`) over unified `QuestSheet` to minimize FAB wiring churn while meeting ACs

### Completion Notes List

- ✅ `TaskUpdateSchema`, `TaskDeleteSchema` in `@rpg-life/validators`
- ✅ `updateTaskForOwner`, `softDeleteTaskForOwner` with `TaskMutationError` + UTC overdue gate
- ✅ `tasks.update`, `tasks.delete` tRPC procedures; 16 new integration tests; smoke updated
- ✅ `QuestFormFields`, `useSheetSide`, `EditQuestSheet` with delete Dialog
- ✅ `CreateQuestSheet` refactored to shared form fields
- ✅ `QuestRowEditTrigger` button on row body; checkbox unchanged
- ✅ `bun run smoke` (48 pass) + `bun run type-check` green

- ✅ Code review 2026-06-01: 6 patches applied (overdue update gate, overdue UI helper, unique form IDs, dialog reset, mutation guard, AC9 tests)

### File List

- `packages/validators/src/task.ts`
- `packages/validators/src/index.ts`
- `packages/db/src/repositories/tasks.ts`
- `packages/db/src/index.ts`
- `packages/api/src/routers/tasks.ts`
- `packages/api/src/index.ts`
- `packages/api/src/__tests__/tasks-update.test.ts`
- `packages/api/src/__tests__/tasks-delete.test.ts`
- `apps/web/src/components/quest-sheet/QuestFormFields.tsx`
- `apps/web/src/components/quest-sheet/use-sheet-side.ts`
- `apps/web/src/components/quest-sheet/EditQuestSheet.tsx`
- `apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`
- `apps/web/src/components/quest-board/QuestRowEditTrigger.tsx`
- `apps/web/src/components/quest-board/QuestRow.tsx`
- `package.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-01: Story 2.5 — `tasks.update`/`tasks.delete`, edit sheet, row tap trigger, delete confirmation, integration tests

- 2026-06-01: Code review patches — overdue update gate, form IDs, dialog reset, mutation guards, expanded tests

## Story Completion Status

- Status: **done** — all ACs satisfied; code review patches applied 2026-06-01
- Next: `create-story` 2.6 (Quest Board Filters)
