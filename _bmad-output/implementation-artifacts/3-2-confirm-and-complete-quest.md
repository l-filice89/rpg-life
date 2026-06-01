---
baseline_commit: b810eb0
---

# Story 3.2: Confirm and Complete Quest

Status: ready-for-dev

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

- [ ] **Task 1: Validators — `CompleteTaskSchema`** (AC: #9)
  - [ ] Create `packages/validators/src/complete.ts`:
    ```typescript
    CompleteTaskSchema = z.object({
      taskId: z.string().uuid(),
      timezone: z.string().min(1), // IANA e.g. Europe/Ljubljana
    })
    ```
  - [ ] Export `CompleteTaskInput`, `RewardPayload` type shape (mirror architecture reward payload)
  - [ ] Export from `packages/validators/src/index.ts`

- [ ] **Task 2: Service — `completeTaskForOwner`** (AC: #3, #5, #7)
  - [ ] Create `packages/api/src/services/complete-task.ts` (or `packages/db/src/repositories/complete-task.ts` per architecture — prefer `packages/api/src/services/complete-task.ts` orchestrating domain + repo)
  - [ ] Flow in Drizzle **transaction**:
    1. Load task + task_skills + owner guard (`open`, not deleted)
    2. If `completed_at` already set → return stored reward payload from `xp_awarded`, `freshness_multiplier`, persisted skill split (reconstruct from DB or store JSON — prefer recompute from stored fields for idempotency)
    3. Else: call domain `computeFreshness`, `computeXpAward`, `splitXpAcrossSkills`, `computeFocusEarn`
    4. Upsert `user_skills` rows (+xp per skill)
    5. Update `user_progress.focus_balance` if focus earned
    6. Update task: `status='completed'`, `completed_at`, `xp_awarded`, `freshness_multiplier`
    7. Return `RewardPayload` including `heroLevelBefore`, `heroLevelAfter`, `leveledUp`, `focusEarned`, optional `freshness` breakdown when multiplier < 1
  - [ ] Import all math from `@rpg-life/domain` — zero inline XP/focus formulas

- [ ] **Task 3: tRPC — `tasks.complete`** (AC: #3, #5, #8)
  - [ ] Add to `packages/api/src/routers/tasks.ts`:
    ```typescript
    complete: protectedProcedure
      .input(CompleteTaskSchema)
      .mutation(({ ctx, input }) => completeTaskForOwner(ctx.db, ctx.user.id, input))
    ```
  - [ ] Map errors: `NOT_FOUND` (wrong owner/open), `BAD_REQUEST` (no skills, invalid timezone)
  - [ ] Export `RewardPayload` from `@rpg-life/api`

- [ ] **Task 4: `ConfirmCompleteModal` client component** (AC: #1–#2, #4, #10)
  - [ ] Create `apps/web/src/components/modals/ConfirmCompleteModal.tsx` — `"use client"`
  - [ ] shadcn `Dialog`; title **"Mark this quest complete?"**; Yes / No buttons
  - [ ] Yes triggers mutation; `isPending` disables both buttons + checkbox
  - [ ] On success: close confirm; invoke `onCompleteSuccess(rewardPayload)` callback prop — Story 3.3 wires reward modal
  - [ ] On error: toast with retry (mirror create/edit pattern from `CreateQuestSheet.tsx`)
  - [ ] Focus trap + Esc dismiss (No)

- [ ] **Task 5: Wire `QuestRowActions`** (AC: #1, #4, #6)
  - [ ] Update `apps/web/src/components/quest-board/QuestRowActions.tsx`:
    - Props: `taskId`, `taskTitle` (add `taskId`)
    - Remove `disabled` stub; enable checkbox
    - Local state: confirm open, `isCompleting`
    - `trpc.tasks.complete.useMutation` with `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
    - On success: `utils.tasks.list.invalidate()` + `utils.profile.get.invalidate()`; call parent/onSuccess with payload
  - [ ] Update `QuestRow.tsx` to pass `task.id`

- [ ] **Task 6: Integration tests** (AC: #5, #8)
  - [ ] Create `packages/api/src/__tests__/tasks-complete.test.ts`:
    - unauthenticated → `UNAUTHORIZED`
    - not owner / deleted / already wrong status → `NOT_FOUND`
    - valid complete → task excluded from `tasks.list`; `user_skills` xp increased
    - idempotent re-complete → same `xpAward`, no double XP increment
    - medium quest → focus +1 (if under cap)
    - trivial → focus 0
  - [ ] Add to root `smoke` script

- [ ] **Task 7: Verify** (AC: all)
  - [ ] `bun run type-check` + `bun run smoke` green
  - [ ] Manual: checkbox → confirm → Yes → row disappears from list; profile header would refresh on invalidate

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Story Completion Status

- Status: **ready-for-dev** — Ultimate context engine analysis completed - comprehensive developer guide created
- Depends on: Story 3.1 (domain engine)
- Next: Story 3.3 (reward modal consumes `RewardPayload`)
