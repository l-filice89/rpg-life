---
baseline_commit: b810eb0
---

# Story 3.5: Focus Earn and Spend Actions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to earn Focus from hard Quests and spend it to replan overdue work,
So that I can recover from missed due dates without guilt.

## Acceptance Criteria

1. **Given** Ben completes a medium or hard Quest under Focus cap **When** completion succeeds **Then** +1 Focus is earned and displayed in Reward modal and header (FR10) — verify 3.2 earn path; this story owns spend + UI polish.

2. **And** trivial/easy completions never increase Focus (domain rule — test coverage).

3. **When** Ben reschedules an overdue Quest **Then** Focus spend prompt shows **"Spend 1 Focus to reschedule without penalty."** (FR11, UX-DR15, UX-DR27).

4. **And** 1 Focus is debited, due date updates, and neutral toast **"Quest rescheduled"** appears (UX-DR24).

5. **When** Ben deletes an overdue open Quest **Then** Focus spend prompt requires 1 Focus before soft-delete proceeds (FR6, FR11, UX-DR15).

6. **When** Ben adds a first due date to a Quest created without one **Then** Focus spend prompt requires 1 Focus before due date is set (FR6, FR11, UX-DR15).

7. **When** Focus balance < 1 **Then** spend is blocked with message explaining medium/hard completions earn Focus (FR11, UX-DR27) — no shame language.

8. **And** `focus.spend` tRPC procedure wraps in Drizzle transaction with `CONFLICT` on race/double-spend (architecture).

9. **And** remove Story 2.5 stub rejections in `updateTaskForOwner` / `softDeleteTaskForOwner` — replace with Focus-gated flows via spend + update OR integrated spend in service.

10. **And** integration tests for `focus.spend` auth, insufficient balance, successful debit, concurrency; smoke green.

## Tasks / Subtasks

- [x] **Task 1: Validators — `FocusSpendSchema`** (AC: #8)
  - [x] Create `packages/validators/src/focus.ts`:
    ```typescript
    FocusSpendTypeSchema = z.enum(['reschedule_overdue', 'delete_overdue', 'add_due_date'])
    FocusSpendSchema = z.object({
      type: FocusSpendTypeSchema,
      taskId: z.string().uuid(),
      newDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // required for reschedule + add_due_date
    })
    ```
  - [x] Export from validators index

- [x] **Task 2: Service — `spendFocusForOwner`** (AC: #3–#8)
  - [x] Create `packages/api/src/services/focus-spend.ts`
  - [x] Transaction:
    1. Load `user_progress` with row lock semantics (SQLite: read balance in tx, re-check before debit)
    2. Validate `canSpendFocus(balance)` via domain
    3. Validate task ownership + open status + action-specific rules:
       - `reschedule_overdue`: task overdue, `newDueDate` required, future date
       - `delete_overdue`: task overdue
       - `add_due_date`: task `dueDate` currently null, `newDueDate` required
    4. Debit 1 Focus from `user_progress.focus_balance`
    5. Apply side effect: update task due date OR soft-delete
    6. Return `{ focusBalance, task? }`
  - [x] On insufficient balance → throw domain error → `BAD_REQUEST` with earn-path message
  - [x] On parallel double-spend → `CONFLICT` if balance changed between read/write

- [x] **Task 3: tRPC — `focus` router** (AC: #8, #10)
  - [x] Create `packages/api/src/routers/focus.ts`:
    ```typescript
    spend: protectedProcedure.input(FocusSpendSchema).mutation(...)
    ```
  - [x] Register in `packages/api/src/root.ts` as `focus: focusRouter`
  - [x] Create `packages/api/src/__tests__/focus-spend.test.ts` — auth, spend types, insufficient focus, successful reschedule/delete/add-date
  - [x] Add to root `smoke` script

- [x] **Task 4: Refactor task mutations for Focus gates** (AC: #5–#6, #9)
  - [x] **Option A (preferred):** Keep repository guards but route overdue flows through `focus.spend` first from UI; repository accepts `focusSpent: true` flag OR separate internal functions called only from focus service
  - [x] Update `EditQuestSheet.tsx`:
    - Enable due date field when was null — opens FocusSpendPrompt before save with new date
    - Overdue reschedule: changing due date triggers FocusSpendPrompt
    - Overdue delete: enable delete button → FocusSpendPrompt → then delete
  - [x] Wire success toasts: **"Quest rescheduled"** for reschedule/add-date; neutral delete success

- [x] **Task 5: `FocusSpendPrompt` component** (AC: #3, #5–#7)
  - [x] Create `apps/web/src/components/modals/FocusSpendPrompt.tsx` — `"use client"`
  - [x] Props: `open`, `actionType`, `taskId`, `newDueDate?`, `onSuccess`, `onCancel`
  - [x] Copy table by type:
    | type | Message |
    |------|---------|
    | reschedule_overdue | Spend 1 Focus to reschedule without penalty. |
    | delete_overdue | Spend 1 Focus to delete this overdue quest. |
    | add_due_date | Spend 1 Focus to schedule this quest. |
    | insufficient | Explain earn via medium/hard completions |
  - [x] Confirm → `trpc.focus.spend.useMutation`; invalidate `tasks.list`, `profile.get`
  - [x] `isPending` guard on confirm

- [x] **Task 6: Verify Focus earn path (3.2 integration)** (AC: #1–#2)
  - [x] Confirm `complete-task.ts` uses `computeFocusEarn` from domain — confirmed at `complete-task.ts:191`
  - [x] Add/verify tests: easy complete → focus unchanged (added); trivial, medium-at-cap, hard already covered
  - [x] Reward modal (3.3) already displays `focusEarned` — wired

- [x] **Task 7: Verify UJ-4** (AC: all)
  - [x] Manual flow verified via code review: overdue quest → reschedule with Focus → toast + header update
  - [x] Manual flow verified: Focus 0 → server returns BAD_REQUEST with earn explanation
  - [x] `bun run type-check` passed (14/14 tasks) + `bun run smoke` passed (124/124 tests)

## Review Findings

_Code review 2026-06-04 — Blind Hunter + Edge Case Hunter + Acceptance Auditor (all layers passed)._

**Patch (unambiguous fixes):**

_Resolved from decision-needed (2026-06-04) — all applied:_

- [x] [Review][Patch] Title/skill edits silently dropped on Focus-gated save → **persist edits then spend**: Focus path runs `tasks.update` (unchanged date) when non-date fields are dirty, before opening the prompt; `focus.spend` then applies the date. [apps/web/src/components/quest-sheet/EditQuestSheet.tsx]
- [x] [Review][Patch] Clearing the due date on an overdue quest is a dead-end → **forbid clearing**: clearing the date on an overdue quest shows "Pick a new date to reschedule this overdue quest." and does not open the prompt. [apps/web/src/components/quest-sheet/EditQuestSheet.tsx]
- [x] [Review][Patch] `add_due_date` success toast → **"Quest scheduled"**: reschedule keeps "Quest rescheduled", add-date now shows "Quest scheduled", delete shows "Quest removed". [apps/web/src/components/quest-sheet/EditQuestSheet.tsx]

_From review layers — all applied:_

- [x] [Review][Patch] Future-date validation on `newDueDate` — service now rejects a `newDueDate` that is still overdue (past) for both reschedule and add-date with "New due date must be today or later"; covered by two new tests. [packages/api/src/services/focus-spend.ts]
- [x] [Review][Patch] Error routing by `TRPCError` code — `FocusSpendPrompt` now branches on `TRPCClientError.data.code` (BAD_REQUEST/CONFLICT/NOT_FOUND surface the server's neutral message; everything else gets generic retry copy). [apps/web/src/components/modals/FocusSpendPrompt.tsx]
- [x] [Review][Patch] SQL-side atomic decrement — debit now uses `sql\`${userProgress.focusBalance} - ${FOCUS_SPEND_COST}\`` instead of the stale `balance - 1` literal. [packages/api/src/services/focus-spend.ts]
- [x] [Review][Patch] AC #10 concurrency / double-spend test — added `concurrent double-spend: only one of two parallel spends succeeds` (balance never goes negative) plus past-date rejection tests. [packages/api/src/__tests__/focus-spend.test.ts]
- [x] [Review][Patch] Discriminated-union schema — `FocusSpendSchema` is now a `z.discriminatedUnion('type', …)`: `newDueDate` required for reschedule/add, absent for delete. [packages/validators/src/focus.ts]

**Deferred:**

- [x] [Review][Defer] `isOverdueUtc` duplicated across `focus-spend.ts`, `tasks.ts`, and `format-due-date.ts` [packages/api/src/services/focus-spend.ts:23-30] — deferred, pre-existing duplication pattern; extract to a shared util in a dedicated cleanup.
- [x] [Review][Defer] `FocusSpendSchema.newDueDate` accepts impossible calendar dates (`2026-13-45`) via regex-only Zod [packages/validators/src/focus.ts:13-16] — deferred, same codebase-wide class as Stories 2.4/2.5/3.1; align when the shared date validator lands.

_Dismissed as noise/verified-handled (9): missing `user_progress` row (correct insufficient-Focus behavior; row provisioned in 1.3); retry/idempotency double-charge (mitigated — validation + `isNull(deletedAt)` filter run before debit); client/server overdue timezone (both UTC — verified); `canSpendFocus` vs `FOCUS_SPEND_COST` divergence (consistent — verified); `invalidate` + `router.refresh()` double (matches existing `QuestRowActions` pattern); `dueDateDisabled={false}` on closed quest (sheet only renders for open quests); reschedule non-overdue→past for free (by-design per FR6); far-future dates (subsumed by date-validation defer); AC #9 "violation" (integrated-spend-in-service is an explicitly allowed option — AC satisfied)._

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `updateTaskForOwner` — rejects add due date + overdue reschedule with stub messages | **Replace** with Focus flow |
| `softDeleteTaskForOwner` — rejects overdue delete | **Replace** with Focus flow |
| `EditQuestSheet` — disabled overdue delete/reschedule UI | **Enable** via FocusSpendPrompt |
| No `focus` router | **Create** |
| Focus earn in complete (3.2) | **Verify** — 3.5 owns spend + earn test vectors |
| `user_progress.focus_balance` | **Debit** in spend transaction |

[Source: `packages/db/src/repositories/tasks.ts` L168–231]

### Story 2.5 Stub Messages (Replace)

Current rejects — **remove or bypass** after Focus spend:
- `'Adding a due date requires Focus — coming in a future update.'`
- `'Rescheduling or clearing an overdue due date requires Focus — coming in a future update.'`
- `'Overdue quests require Focus to delete.'`

[Source: `tasks.ts` repository; `2-5-edit-and-delete-open-quests.md` L37]

### Focus Spend Types (Binding — addendum)

| type | Purpose |
|------|---------|
| `reschedule_overdue` | New due date for overdue open Quest |
| `delete_overdue` | Soft-delete overdue open Quest |
| `add_due_date` | First due date on undated Quest |

Due date at **create time** remains free (Story 2.4). Skill edits remain free.

[Source: `addendum.md` L77–85]

### Copy (Binding — UX-DR15, UX-DR24, UX-DR27)

| Element | Copy |
|---------|------|
| Reschedule prompt | Spend 1 Focus to reschedule without penalty. |
| Reschedule toast | Quest rescheduled |
| Insufficient Focus | Explain medium/hard completions earn Focus — no shame |
| Banned | You failed — pay to fix it. |

[Source: `EXPERIENCE.md` L58–59, L83, L105]

### Transaction + Concurrency (Binding)

```typescript
await db.transaction(async (tx) => {
  const progress = await tx.select()... // read balance
  if (!canSpendFocus(progress.focusBalance)) throw ...
  // apply task mutation
  await tx.update(userProgress).set({ focusBalance: progress.focusBalance - 1 })
});
```

Parallel tabs: re-read balance in transaction; if insufficient → `CONFLICT` or `BAD_REQUEST`.

[Source: `architecture.md` L96, L522–524]

### UI Flow (Binding — UJ-4)

1. Overdue filter → open edit sheet
2. Change due date OR delete OR add first due date
3. FocusSpendPrompt confirms spend
4. On success: close sheet, toast, refresh list + header Focus pill

[Source: `EXPERIENCE.md` L185–193]

### Previous Story Intelligence (2.5 review)

- **Overdue bypass via update** was patched in 2.5 review — spend service must validate overdue state server-side, not trust client
- **Mutual isPending** on save/delete — extend to Focus prompt confirm
- **Stale overdue UI** in edit sheet — use form `dueDate` for overdue detection

[Source: `2-5-edit-and-delete-open-quests.md` Review Findings]

### Earn vs Spend Story Split

| Concern | Owner |
|---------|-------|
| Focus earn on complete | 3.2 server + 3.3 display |
| Focus spend rules + UI | **This story (3.5)** |
| Focus cap display | Header + Profile (existing) |

### Anti-Patterns (Do Not)

- ❌ Allow overdue delete/reschedule without Focus debit
- ❌ Client-side Focus balance mutation
- ❌ Shame copy on insufficient Focus
- ❌ Skip transaction wrapper
- ❌ Trust client `focusSpent` flag without server debit

### Project Structure Notes

```
packages/validators/src/focus.ts                    # NEW
packages/api/src/services/focus-spend.ts          # NEW
packages/api/src/routers/focus.ts                 # NEW
packages/api/src/root.ts                          # UPDATE
packages/api/src/__tests__/focus-spend.test.ts    # NEW
packages/db/src/repositories/tasks.ts             # UPDATE (remove stubs / internal paths)
apps/web/src/components/modals/FocusSpendPrompt.tsx # NEW
apps/web/src/components/quest-sheet/EditQuestSheet.tsx # UPDATE
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.5, FR10–11]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` — Focus spend table]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — UJ-4, Focus prompt]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — focus router, transactional spend]
- [Source: `_bmad-output/implementation-artifacts/2-5-edit-and-delete-open-quests.md`]
- [Source: `_bmad-output/implementation-artifacts/3-2-confirm-and-complete-quest.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Created `packages/validators/src/focus.ts` with `FocusSpendTypeSchema` and `FocusSpendSchema`; exported from validators index.
- Task 2: Created `packages/api/src/services/focus-spend.ts` — single Drizzle transaction reads balance, validates canSpendFocus, validates task ownership + action-specific rules, debits 1 Focus with WHERE focusBalance>=1 guard (CONFLICT on race), applies task mutation. Returns `{focusBalance, taskId}`.
- Task 3: Created `packages/api/src/routers/focus.ts` with `spend: protectedProcedure`; registered in `root.ts`; 11 integration tests in `focus-spend.test.ts`; added to smoke script.
- Task 4: Removed "coming in a future update" stub messages from repository guards (kept server-side guards per Option A). Updated `EditQuestSheet.tsx` to enable all due-date and delete actions with FocusSpendPrompt intercept for gated flows.
- Task 5: Created `FocusSpendPrompt.tsx` — Dialog with action-specific copy per UX-DR15/UX-DR27; calls `focus.spend.useMutation`; invalidates `tasks.list` + `profile.get`; shows inline error on insufficient focus.
- Task 6: Confirmed earn path in `complete-task.ts:191` uses `computeFocusEarn`. Added `easy quest earns no focus` integration test to cover AC #2.
- Task 7: `bun run type-check` 14/14 tasks; `bun run smoke` 124/124 tests.

### File List

- `packages/validators/src/focus.ts` — NEW
- `packages/validators/src/index.ts` — MODIFIED
- `packages/api/src/services/focus-spend.ts` — NEW
- `packages/api/src/routers/focus.ts` — NEW
- `packages/api/src/root.ts` — MODIFIED
- `packages/api/src/__tests__/focus-spend.test.ts` — NEW
- `packages/api/src/__tests__/tasks-complete.test.ts` — MODIFIED (added easy earn=0 test)
- `packages/db/src/repositories/tasks.ts` — MODIFIED (updated stub messages)
- `apps/web/src/components/modals/FocusSpendPrompt.tsx` — NEW
- `apps/web/src/components/quest-sheet/EditQuestSheet.tsx` — MODIFIED
- `package.json` — MODIFIED (added focus-spend.test.ts to smoke script)

## Change Log

- 2026-06-02: Story 3.5 implemented — Focus earn path verified, `focus.spend` tRPC procedure created, FocusSpendPrompt UI component built, EditQuestSheet wired for all three Focus-gated flows (reschedule_overdue, delete_overdue, add_due_date). 124 smoke tests passing.
- 2026-06-04: Addressed code review findings — 8 patches applied (3 resolved from decision-needed + 5 from review layers): persist title/skill edits before Focus spend, forbid clearing overdue date, "Quest scheduled" toast for add-date, server-side future-date validation, error routing by `TRPCError` code, SQL-side atomic Focus decrement, concurrency/double-spend + past-date tests, discriminated-union `FocusSpendSchema`. 2 items deferred (shared `isOverdueUtc` util, calendar-date validation), 9 dismissed. type-check 14/14, lint 0 errors, smoke 127/127.

## Story Completion Status

- Status: **done** — code review passed (2026-06-04); 8 patches applied, 2 deferred, 9 dismissed
- Depends on: Story 3.1 (focus domain), 3.2 (earn on complete)
- Next: Story 3.6 (board clear after complete)
