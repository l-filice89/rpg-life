---
baseline_commit: b810eb0
---

# Story 3.5: Focus Earn and Spend Actions

Status: ready-for-dev

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

- [ ] **Task 1: Validators — `FocusSpendSchema`** (AC: #8)
  - [ ] Create `packages/validators/src/focus.ts`:
    ```typescript
    FocusSpendTypeSchema = z.enum(['reschedule_overdue', 'delete_overdue', 'add_due_date'])
    FocusSpendSchema = z.object({
      type: FocusSpendTypeSchema,
      taskId: z.string().uuid(),
      newDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // required for reschedule + add_due_date
    })
    ```
  - [ ] Export from validators index

- [ ] **Task 2: Service — `spendFocusForOwner`** (AC: #3–#8)
  - [ ] Create `packages/api/src/services/focus-spend.ts`
  - [ ] Transaction:
    1. Load `user_progress` with row lock semantics (SQLite: read balance in tx, re-check before debit)
    2. Validate `canSpendFocus(balance)` via domain
    3. Validate task ownership + open status + action-specific rules:
       - `reschedule_overdue`: task overdue, `newDueDate` required, future date
       - `delete_overdue`: task overdue
       - `add_due_date`: task `dueDate` currently null, `newDueDate` required
    4. Debit 1 Focus from `user_progress.focus_balance`
    5. Apply side effect: update task due date OR soft-delete
    6. Return `{ focusBalance, task? }`
  - [ ] On insufficient balance → throw domain error → `BAD_REQUEST` with earn-path message
  - [ ] On parallel double-spend → `CONFLICT` if balance changed between read/write

- [ ] **Task 3: tRPC — `focus` router** (AC: #8, #10)
  - [ ] Create `packages/api/src/routers/focus.ts`:
    ```typescript
    spend: protectedProcedure.input(FocusSpendSchema).mutation(...)
    ```
  - [ ] Register in `packages/api/src/root.ts` as `focus: focusRouter`
  - [ ] Create `packages/api/src/__tests__/focus-spend.test.ts` — auth, spend types, insufficient focus, successful reschedule/delete/add-date
  - [ ] Add to root `smoke` script

- [ ] **Task 4: Refactor task mutations for Focus gates** (AC: #5–#6, #9)
  - [ ] **Option A (preferred):** Keep repository guards but route overdue flows through `focus.spend` first from UI; repository accepts `focusSpent: true` flag OR separate internal functions called only from focus service
  - [ ] **Option B:** Remove BAD_REQUEST stubs from `updateTaskForOwner`/`softDeleteTaskForOwner` for overdue/add-date; UI always calls `focus.spend` then plain update
  - [ ] Update `EditQuestSheet.tsx`:
    - Enable due date field when was null — opens FocusSpendPrompt before save with new date
    - Overdue reschedule: changing due date triggers FocusSpendPrompt
    - Overdue delete: enable delete button → FocusSpendPrompt → then delete
  - [ ] Wire success toasts: **"Quest rescheduled"** for reschedule/add-date; neutral delete success

- [ ] **Task 5: `FocusSpendPrompt` component** (AC: #3, #5–#7)
  - [ ] Create `apps/web/src/components/modals/FocusSpendPrompt.tsx` — `"use client"`
  - [ ] Props: `open`, `actionType`, `taskId`, `newDueDate?`, `onSuccess`, `onCancel`
  - [ ] Copy table by type:
    | type | Message |
    |------|---------|
    | reschedule_overdue | Spend 1 Focus to reschedule without penalty. |
    | delete_overdue | Spend 1 Focus to delete this overdue quest. |
    | add_due_date | Spend 1 Focus to schedule this quest. |
    | insufficient | Explain earn via medium/hard completions |
  - [ ] Confirm → `trpc.focus.spend.useMutation`; invalidate `tasks.list`, `profile.get`
  - [ ] `isPending` guard on confirm

- [ ] **Task 6: Verify Focus earn path (3.2 integration)** (AC: #1–#2)
  - [ ] Confirm `complete-task.ts` uses `computeFocusEarn` from domain
  - [ ] Add/verify tests: trivial complete → focus unchanged; medium at cap → no earn
  - [ ] Reward modal (3.3) already displays `focusEarned` — no change if wired

- [ ] **Task 7: Verify UJ-4** (AC: all)
  - [ ] Manual: overdue quest → reschedule with Focus → toast + header update
  - [ ] Manual: Focus 0 → blocked with earn explanation
  - [ ] `bun run type-check` + `bun run smoke` green

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Story Completion Status

- Status: **ready-for-dev** — Ultimate context engine analysis completed - comprehensive developer guide created
- Depends on: Story 3.1 (focus domain), 3.2 (earn on complete)
- Next: Story 3.6 (board clear after complete)
