---
baseline_commit: b810eb0
---

# Story 3.2: Confirm and Complete Quest

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to confirm before marking a Quest complete,
So that I don't accidentally award XP for unfinished work.

## Acceptance Criteria

1. **Given** an open Quest with ≥1 Skill on Quest Board **When** Ben taps the checkbox **Then** Confirm complete modal appears: **"Mark this quest complete?"** with Yes/No (FR7, UX-DR11, UX-DR30).

2. **When** Ben taps **No** **Then** modal dismisses and Quest stays open.

3. **When** Ben taps **Yes** **Then** `tasks.complete` runs with client IANA `timezone`, computes `xpAward` via `@rpg-life/domain`, persists idempotency fields (`completed_at`, `xp_awarded`, `freshness_multiplier`), splits XP across Skills in `user_skills`, sets `status = 'completed'` (FR8 partial).

4. **And** row is disabled during request; no double-submit (UX-DR25).

5. **When** complete is retried on an already-completed Quest **Then** response is idempotent with identical reward payload, no double XP (FR7).

6. **When** network fails **Then** error toast with retry hint appears (NFR2, UX-DR23).

7. **And** Focus earn (+1 medium/hard, capped) persisted to `user_progress.focus_balance` on first complete — payload includes `focusEarned` for Story 3.3 reward modal.

8. **And** integration tests cover auth, owner scoping, idempotency, XP split, focus earn, completed exclusion from `tasks.list`.

9. **And** `CompleteTaskSchema` in validators requires `taskId` + `timezone` (IANA string).

10. **And** confirm modal **replaces** — not stacked with reward (reward UI is Story 3.3; this story returns payload to caller or stores for next story handoff).

## Tasks / Subtasks

- [x] **Task 1: Validators — `CompleteTaskSchema`** (AC: #9)
  - [x] Create `packages/validators/src/complete.ts`:
    ```typescript
    CompleteTaskSchema = z.object({
      taskId: z.string().uuid(),
      timezone: z.string().min(1), // IANA e.g. Europe/Ljubljana
    })
    ```
  - [x] Export `CompleteTaskInput`, `RewardPayload` type shape (mirror architecture reward payload)
  - [x] Export from `packages/validators/src/index.ts`

- [x] **Task 2: Service — `completeTaskForOwner`** (AC: #3, #5, #7)
  - [x] Create `packages/api/src/services/complete-task.ts` (or `packages/db/src/repositories/complete-task.ts` per architecture — prefer `packages/api/src/services/complete-task.ts` orchestrating domain + repo)
  - [x] Flow in Drizzle **transaction**:
    1. Load task + task_skills + owner guard (`open`, not deleted)
    2. If `completed_at` already set → return stored reward payload from `xp_awarded`, `freshness_multiplier`, persisted skill split (reconstruct from DB or store JSON — prefer recompute from stored fields for idempotency)
    3. Else: call domain `computeFreshness`, `computeXpAward`, `splitXpAcrossSkills`, `computeFocusEarn`
    4. Upsert `user_skills` rows (+xp per skill)
    5. Update `user_progress.focus_balance` if focus earned
    6. Update task: `status='completed'`, `completed_at`, `xp_awarded`, `freshness_multiplier`
    7. Return `RewardPayload` including `heroLevelBefore`, `heroLevelAfter`, `leveledUp`, `focusEarned`, optional `freshness` breakdown when multiplier < 1
  - [x] Import all math from `@rpg-life/domain` — zero inline XP/focus formulas

- [x] **Task 3: tRPC — `tasks.complete`** (AC: #3, #5, #8)
  - [x] Add to `packages/api/src/routers/tasks.ts`:
    ```typescript
    complete: protectedProcedure
      .input(CompleteTaskSchema)
      .mutation(({ ctx, input }) => completeTaskForOwner(ctx.db, ctx.user.id, input))
    ```
  - [x] Map errors: `NOT_FOUND` (wrong owner/open), `BAD_REQUEST` (no skills, invalid timezone)
  - [x] Export `RewardPayload` from `@rpg-life/api`

- [x] **Task 4: `ConfirmCompleteModal` client component** (AC: #1–#2, #4, #10)
  - [x] Create `apps/web/src/components/modals/ConfirmCompleteModal.tsx` — `"use client"`
  - [x] shadcn `Dialog`; title **"Mark this quest complete?"**; Yes / No buttons
  - [x] Yes triggers mutation; `isPending` disables both buttons + checkbox
  - [x] On success: close confirm; invoke `onCompleteSuccess(rewardPayload)` callback prop — Story 3.3 wires reward modal
  - [x] On error: toast with retry (mirror create/edit pattern from `CreateQuestSheet.tsx`)
  - [x] Focus trap + Esc dismiss (No)

- [x] **Task 5: Wire `QuestRowActions`** (AC: #1, #4, #6)
  - [x] Update `apps/web/src/components/quest-board/QuestRowActions.tsx`:
    - Props: `taskId`, `taskTitle` (add `taskId`)
    - Remove `disabled` stub; enable checkbox
    - Local state: confirm open, `isCompleting`
    - `trpc.tasks.complete.useMutation` with `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
    - On success: `utils.tasks.list.invalidate()` + `utils.profile.get.invalidate()`; call parent/onSuccess with payload
  - [x] Update `QuestRow.tsx` to pass `task.id`

- [x] **Task 6: Integration tests** (AC: #5, #8)
  - [x] Create `packages/api/src/__tests__/tasks-complete.test.ts`:
    - unauthenticated → `UNAUTHORIZED`
    - not owner / deleted / already wrong status → `NOT_FOUND`
    - valid complete → task excluded from `tasks.list`; `user_skills` xp increased
    - idempotent re-complete → same `xpAward`, no double XP increment
    - medium quest → focus +1 (if under cap)
    - trivial → focus 0
  - [x] Add to root `smoke` script

- [x] **Task 7: Verify** (AC: all)
  - [x] `bun run type-check` + `bun run smoke` green
  - [x] Manual: checkbox → confirm → Yes → row disappears from list; profile header would refresh on invalidate

### Review Findings

- [x] [Review][Decision] **Idempotent `focusEarned` reconstruction is unreliable** — resolved: added `focus_earned` column (migration 0002), persist on first complete, read on idempotent retry.

- [x] [Review][Decision] **AC4 "row disabled" scope ambiguous** — resolved: bubble `isCompleting` to `QuestRow`, dim row + disable edit trigger during complete.

- [x] [Review][Patch] **Concurrent complete can double-award XP** [`packages/api/src/services/complete-task.ts`] — fixed: task UPDATE uses `.returning()`; throws if 0 rows (transaction rolls back).

- [x] [Review][Patch] **Null `xpAwarded` on idempotent path crashes silently** [`packages/api/src/services/complete-task.ts`] — fixed: explicit null guard → BAD_REQUEST.

- [x] [Review][Patch] **Double-click Yes can fire duplicate mutations** [`ConfirmCompleteModal.tsx`] — fixed: local `confirmFired` latch.

- [x] [Review][Patch] **`Intl` timezone may be undefined on client** [`QuestRowActions.tsx`] — fixed: `?? 'UTC'` fallback.

- [x] [Review][Patch] **`CompleteTaskSchema` does not validate IANA at schema layer** [`complete.ts`] — fixed: `.refine(isValidIanaTimezone)`.

- [x] [Review][Patch] **Missing integration tests** [`tasks-complete.test.ts`] — fixed: unknown id, zero skills, focus-at-cap, hard difficulty.

- [x] [Review][Patch] **No guard when all skill XP splits to zero** [`complete-task.ts`] — fixed: throws BAD_REQUEST before transaction.

- [x] [Review][Defer] **XP split floor drops remainder** [`packages/domain/src/xp-split.ts`] — deferred, pre-existing domain behavior from Story 3.1.

- [x] [Review][Defer] **Idempotent freshness recompute with different timezone** [`complete-task.ts`] — deferred, pre-existing edge case.

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `QuestRowActions.tsx` — disabled checkbox stub | **Replace** with confirm + complete flow |
| `tasks` router — list/create/update/delete only | **Add** `complete` |
| `packages/domain` — stub until 3.1 | **Depends on 3.1** — implement 3.1 first |
| Idempotency columns on `tasks` | **Use** — Story 2.1 |
| `user_skills` table empty until first complete | **Upsert on complete** |
| No reward modal yet | **Defer UI** — pass payload via callback; 3.3 renders modal |

[Source: `QuestRowActions.tsx`; `tasks.ts` router]

### Reward Payload Shape (Binding — architecture)

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

[Source: `architecture.md` L450–467]

### Idempotency (Binding)

- First complete: compute, persist `xp_awarded`, `freshness_multiplier`, `completed_at`, update skills
- Retry: if `completed_at` set → return **identical** payload without mutating XP again
- Store enough to reconstruct payload OR recompute from stored fields + original skill codes

[Source: `architecture.md` L90–91, L262; `addendum.md` L89–91]

### Modal Orchestration (Binding — partial this story)

- This story: confirm modal only
- Story 3.3: confirm **replaced by** reward modal (not stacked)
- `QuestRowActions` owns state machine: `idle → confirming → completing → (3.3: rewarding)`

[Source: `architecture.md` L1036–1039; `EXPERIENCE.md` L41]

### Copy (Binding)

| Element | Copy |
|---------|------|
| Confirm title | Mark this quest complete? |
| Yes | Primary — completes quest |
| No | Dismiss — quest stays open |
| Error toast | Network failure + retry hint (neutral) |

[Source: `EXPERIENCE.md` L75; `epics.md` Story 3.2]

### Timezone (Binding)

```typescript
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
```

Send on every complete mutation. Server validates non-empty IANA string; domain converts UTC `completed_at` to local date for freshness.

[Source: `architecture.md` L286; `project-context.md`]

### Transaction Boundaries (Binding)

`tasks.complete` must wrap in Drizzle transaction:
- Task status update
- user_skills upserts
- user_progress focus update
- All succeed or rollback

[Source: `architecture.md` L522–524]

### Previous Story Intelligence (2.5, Epic 2 Retro)

- **In-flight guards:** Epic 2 review caught double-submit on sheets — apply `isPending` on checkbox + modal buttons
- **Auth tests:** Always assert `UNAUTHORIZED` code explicitly
- **Checkbox separate from edit:** `QuestRowEditTrigger` wraps body; `QuestRowActions` owns checkbox only — preserve from 2.5
- **Domain first:** Do not ship until 3.1 tests green

[Source: `2-5-edit-and-delete-open-quests.md`; `epic-2-retro-2026-06-01.md`]

### UI Scope Boundaries

**In scope:** Confirm modal, complete mutation, server persistence, invalidate caches

**Out of scope (Story 3.3):** Reward modal UI, XP bar animation, hero level-up overlay

**Out of scope (Story 3.5):** Focus spend prompts on edit/delete

### Anti-Patterns (Do Not)

- ❌ XP math in router or React component
- ❌ Skip idempotency check on retry
- ❌ Stack confirm + reward dialogs in this story
- ❌ Pass `userId` from client in input
- ❌ Allow complete without ≥1 skill (server guard)

### Project Structure Notes

```
packages/validators/src/complete.ts                    # NEW
packages/api/src/services/complete-task.ts             # NEW
packages/api/src/routers/tasks.ts                      # UPDATE
packages/api/src/__tests__/tasks-complete.test.ts      # NEW
apps/web/src/components/modals/ConfirmCompleteModal.tsx # NEW
apps/web/src/components/quest-board/QuestRowActions.tsx # UPDATE
apps/web/src/components/quest-board/QuestRow.tsx       # UPDATE (pass taskId)
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — complete flow, idempotency, payload]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — confirm modal, complete in flight]
- [Source: `_bmad-output/implementation-artifacts/3-1-progression-domain-engine.md`]
- [Source: `_bmad-output/implementation-artifacts/2-5-edit-and-delete-open-quests.md`]
- [Source: `apps/web/src/components/quest-board/QuestRowActions.tsx`]

## Dev Agent Record

### Agent Model Used

Claude (Cursor Agent)

### Debug Log References

### Implementation Plan

- Added `CompleteTaskSchema` + `RewardPayload` in validators
- Implemented `completeTaskForOwner` service with Drizzle transaction, domain math, idempotent retry path
- Wired `tasks.complete` tRPC mutation with error mapping
- Built `ConfirmCompleteModal` and enabled checkbox flow in `QuestRowActions`
- Added 8 integration tests; smoke + type-check green

### Completion Notes List

- ✅ Confirm modal with Yes/No, in-flight guards on checkbox and buttons
- ✅ Complete mutation persists XP split, focus earn, idempotency fields in transaction
- ✅ Idempotent re-complete returns same `xpAward` without double XP
- ✅ Cache invalidation for `tasks.list` and `profile.get` on success
- ✅ `onCompleteSuccess` callback passes `RewardPayload` for Story 3.3 handoff
- ✅ All 109 smoke tests pass; type-check clean (post-review)

### Change Log

- 2026-06-01: Implemented quest confirm-and-complete flow (Story 3.2) — server persistence, idempotency, UI modal, integration tests
- 2026-06-01: Code review fixes — focus_earned column, race guard, row disable, test coverage, schema IANA validation

### File List

- packages/validators/src/complete.ts (new)
- packages/validators/src/index.ts (modified)
- packages/api/package.json (modified)
- packages/api/src/services/complete-task.ts (new)
- packages/api/src/routers/tasks.ts (modified)
- packages/api/src/index.ts (modified)
- packages/api/src/__tests__/tasks-complete.test.ts (new)
- packages/api/src/__tests__/tasks-create.test.ts (modified — migration 0002)
- packages/api/src/__tests__/tasks-delete.test.ts (modified — migration 0002)
- packages/api/src/__tests__/tasks-update.test.ts (modified — migration 0002)
- packages/api/src/__tests__/tasks-list.test.ts (modified — migration 0002)
- packages/api/src/__tests__/profile-get.test.ts (modified — migration 0002)
- packages/db/migrations/0002_task_focus_earned.sql (new)
- packages/db/src/schema/tasks.ts (modified)
- packages/db/src/__tests__/quest-schema.test.ts (modified)
- apps/web/src/components/modals/ConfirmCompleteModal.tsx (new)
- apps/web/src/components/quest-board/QuestRowActions.tsx (modified)
- apps/web/src/components/quest-board/QuestRow.tsx (modified)
- apps/web/src/components/quest-board/QuestRowEditTrigger.tsx (modified)
- package.json (modified — smoke script)
- bun.lock (modified)

## Story Completion Status

- Status: **done** — code review patches applied; 109 smoke tests green
- Depends on: Story 3.1 (domain engine)
- Next: Story 3.3 (reward modal consumes `RewardPayload`)
