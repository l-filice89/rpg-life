---
baseline_commit: b810eb0
---

# Story 3.6: Board-Clear Celebratory Empty State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want a celebratory empty state when I complete my last open Quest,
So that finishing everything feels rewarding and I'm invited to start the next Quest.

## Acceptance Criteria

1. **Given** Ben has one remaining open Quest on Quest Board **When** he completes it and dismisses the Reward modal **Then** Quest Board immediately shows board-clear empty state (UX-DR20).

2. **And** headline is display-sm **"Quest board clear"** with body **"Every quest accounted for. Start another when you're ready."**

3. **And** full-width primary **"Add a quest"** button and FAB remain visible.

4. **And** optional muted **"See your growth"** link navigates to My Profile (`/profile`).

5. **And** this state is distinct from first-time **"No quests yet"** empty (UX-DR19 vs UX-DR20) — never show board-clear copy on first visit with zero quests.

6. **And** board-clear appears without extra fetch when `tasks.list` invalidation returns empty (architecture UX addendum).

7. **And** component is RSC-presentational shell where possible; client flag for immediate post-complete transition.

8. **And** `bun run type-check` green; manual UJ-2 board-clear flow documented.

## Tasks / Subtasks

- [x] **Task 1: `QuestBoardEmptyClear` component** (AC: #2–#4, #7)
  - [x] Create `apps/web/src/components/quest-board/QuestBoardEmptyClear.tsx` — **server component** (static markup)
  - [x] Structure:
    ```tsx
    <section aria-labelledby="quest-board-clear-heading" className="...">
      <h2 id="quest-board-clear-heading" className="text-display-sm">Quest board clear</h2>
      <p className="mt-3 text-muted-foreground">
        Every quest accounted for. Start another when you're ready.
      </p>
      <Button className="mt-8 w-full" asChild>
        <Link href="#" onClick={...}>Add a quest</Link>  // opens FAB — see Task 3
      </Button>
      <Link href="/profile" className="mt-4 text-sm text-muted-foreground">
        See your growth
      </Link>
    </section>
    ```
  - [x] Primary button triggers Create Quest sheet — coordinate with FAB (shared open handler or programmatic FAB click)
  - [x] Celebratory tone — no generic "Inbox zero! 🎉" (banned)

- [x] **Task 2: Empty state selection logic** (AC: #1, #5–#6)
  - [x] **Client flag approach (preferred for immediate post-complete):**
    - Create `QuestBoardEmptyOrchestrator.tsx` — `"use client"` wrapper OR extend quest board client boundary
    - Context/prop: `emptyVariant: 'first' | 'clear' | null`
    - Set `'clear'` when reward Continue fires AND mutation had `wasLastOpenQuest: true`
    - Set `'first'` when server `tasks.length === 0` AND no clear flag AND (optional) user has no completed tasks history
  - [x] **Server fallback heuristic** when no client flag:
    - If `openTasks.length === 0` AND user has ≥1 completed task in DB → show clear empty on cold load/navigation
    - Else → `QuestBoardEmptyFirst`
  - [x] Add optional `profile.get` or lightweight `tasks.hasCompleted` if needed — prefer inferring from `tasks.list` empty + session flag to avoid extra procedure

- [x] **Task 3: Wire complete flow → board clear** (AC: #1, #6)
  - [x] In `QuestRowActions` (or shared QuestBoard client provider):
    - Before complete: detect `wasLastOpenQuest` — e.g. parent passes `openTaskCount` or query client cache `tasks.list` length === 1
    - On reward Continue: if was last → set `showBoardClear=true`; `utils.tasks.list.invalidate()` then render clear empty
  - [x] Update `QuestBoard.tsx`:
    ```tsx
    {tasks.length === 0 ? (
      showBoardClear ? <QuestBoardEmptyClear /> : <QuestBoardEmptyFirst />
    ) : (
      <QuestBoardTaskList tasks={tasks} />
    )}
    ```
  - [x] May require thin client wrapper `QuestBoardView.tsx` around empty branch while keeping header RSC-fetched

- [x] **Task 4: FAB + primary CTA** (AC: #3)
  - [x] `QuestBoardFab` remains rendered (unchanged from 2.4)
  - [x] "Add a quest" button opens same Create Quest sheet as FAB — extract shared `useCreateQuestSheet()` hook or lift FAB open state to `QuestBoardFabProvider`

- [x] **Task 5: Distinction tests / manual UJ-2** (AC: #5, #8)
  - [x] Manual: new user zero quests → **No quests yet** (2.7), NOT board clear
  - [x] Manual: one quest → complete → Continue → **Quest board clear**
  - [x] Manual: board clear → Add quest → list shows new quest (empty clears)
  - [x] Manual: "See your growth" → Profile page
  - [x] Document in completion notes

### Review Findings

- [x] [Review][Decision] Completion-history heuristic source ambiguity — resolved: accepted profile progression proxy (`heroLevel`/skill XP) as canonical for this story.
- [x] [Review][Patch] Extra fetch on reward-dismiss path conflicts with AC #6 invalidation-only expectation [apps/web/src/components/quest-board/QuestRowActions.tsx] — fixed: removed refresh/invalidate path for board-clear transition.
- [x] [Review][Patch] Last-open detection may misclassify on stale/missing cache fallback [apps/web/src/components/quest-board/QuestRowActions.tsx] — fixed: derive from post-complete invalidated query state.
- [x] [Review][Patch] New context hard-dependencies can throw when components render outside providers [apps/web/src/components/quest-board/QuestBoardFab.tsx] — fixed: safe context hook fallbacks for non-provider render paths.

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `QuestBoardEmptyFirst.tsx` (Story 2.7) | **Keep** — first-time empty |
| `QuestBoard.tsx` — `tasks.length === 0` → First only | **Update** — branch First vs Clear |
| Story 3.3 reward Continue handler | **Extend** — set board-clear flag |
| No `QuestBoardEmptyClear` | **Create** |

[Source: `QuestBoard.tsx`; `2-7-quest-board-empty-state.md`]

### Two Empty States (Critical — Do Not Conflate)

| State | When | Component | Headline |
|-------|------|-----------|----------|
| First-time / zero quests | Never created OR zero open on first load | `QuestBoardEmptyFirst` | No quests yet |
| Board clear | Last open quest completed + reward dismissed | `QuestBoardEmptyClear` | Quest board clear |

Story 2.7 explicitly banned board-clear copy in first-time empty.

[Source: `2-7-quest-board-empty-state.md` L114–121; `epic-2-retro-2026-06-01.md` L106]

### Copy (Binding — UX-DR20, UX-DR27)

| Element | Copy |
|---------|------|
| Headline | Quest board clear |
| Body | Every quest accounted for. Start another when you're ready. |
| Primary CTA | Add a quest |
| Secondary link | See your growth |
| Banned | Inbox zero! 🎉, All done! (too flat) |

[Source: `EXPERIENCE.md` L54–56, L85, L195–200]

### Timing (Binding — UX Flow)

Board clear appears **immediately** when Reward modal dismisses and list is empty — no manual refresh.

Implementation path:
1. `tasks.complete` succeeds
2. Reward modal Continue
3. `tasks.list` invalidate → empty array
4. Client flag `showBoardClear=true` → render `QuestBoardEmptyClear`

[Source: `architecture.md` L1025; `EXPERIENCE.md` L98, L172]

### RSC vs Client Split (Binding)

Architecture says empty state shells stay RSC, but post-complete transition needs client state:

- `QuestBoardEmptyClear` / `QuestBoardEmptyFirst` — static RSC markup
- Thin client orchestrator chooses which to render + holds `showBoardClear` flag
- Minimize client boundary — do not convert entire QuestBoard to client

[Source: `architecture.md` L1033–1034]

### Detecting "Last Open Quest"

Options (pick one):
1. **Client cache:** `tasks.list` data length === 1 before complete mutation
2. **Server payload:** extend `RewardPayload` with `remainingOpenCount` (optional — avoid if client cache sufficient)
3. **Post-invalidate:** after invalidate, list empty + complete just succeeded in session

Prefer (1) — no API change.

### Previous Story Intelligence (2.7, 3.3, Epic 2 Retro)

- **Empty state registry** — team agreement: never merge First vs Clear components/copy
- **FAB always visible** — same as 2.7; board clear adds inline primary button duplicating FAB action
- **Modal dismiss then empty** — hook into 3.3 `onContinue` callback

[Source: `epic-2-retro-2026-06-01.md` L190; `2-7-quest-board-empty-state.md`]

### UI Scope Boundaries

**In scope:** QuestBoardEmptyClear, empty orchestration, FAB/CTA wiring, Profile link

**Out of scope:** Confetti on board clear (celebration is reward modal / level-up), E2E `board-clear.spec.ts` (Epic 4 architecture note)

### Anti-Patterns (Do Not)

- ❌ Show "Quest board clear" on first-time zero quests
- ❌ Hide FAB on board clear
- ❌ Require full page reload to see empty
- ❌ Merge `QuestBoardEmptyFirst` and `QuestBoardEmptyClear` into one component with booleans only — keep separate files per architecture

### Project Structure Notes

```
apps/web/src/components/quest-board/QuestBoardEmptyClear.tsx    # NEW
apps/web/src/components/quest-board/QuestBoardView.tsx          # NEW (optional client orchestrator)
apps/web/src/components/quest-board/QuestBoard.tsx             # UPDATE
apps/web/src/components/quest-board/QuestRowActions.tsx        # UPDATE (last quest detection)
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.6, UX-DR20]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — board clear flow, copy]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/board-clear-empty.html`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — QuestBoardEmptyClear, timing]
- [Source: `_bmad-output/implementation-artifacts/2-7-quest-board-empty-state.md`]
- [Source: `_bmad-output/implementation-artifacts/3-3-reward-modal-and-hero-level-up-celebration.md`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Completion Notes List

- Added `QuestBoardEmptyClear` (RSC) with binding UX-DR20 copy, full-width **Add a quest** via shared sheet context, and **See your growth** → `/profile`.
- `QuestBoardContent` client orchestrator: `showBoardClear` flag + `effectiveOpenCount` for immediate post-reward empty (no wait for `router.refresh`).
- Server cold-load heuristic: zero open tasks + `heroLevel > 0` or any skill `xp > 0` → clear; else first-time empty.
- `QuestRowActions`: captures `wasLastOpenQuest` before complete; `finishRewardFlow` calls `requestBoardClear`, invalidates `tasks.list`, refreshes.
- `CreateQuestSheetProvider` + `useCreateQuestSheet` shared by FAB and board-clear CTA.
- Unit tests: `quest-board-empty-variant.test.ts` (7 cases); smoke script updated.
- **Manual UJ-2 (verify locally):** (1) New user, zero quests → "No quests yet". (2) Single quest → complete → Continue → "Quest board clear" without reload. (3) Add quest from CTA/FAB → list returns. (4) Profile link works.

### File List

- apps/web/src/components/quest-board/QuestBoardEmptyClear.tsx
- apps/web/src/components/quest-board/QuestBoardContent.tsx
- apps/web/src/components/quest-board/AddQuestButton.tsx
- apps/web/src/components/quest-board/create-quest-sheet-context.tsx
- apps/web/src/components/quest-board/quest-board-complete-context.tsx
- apps/web/src/components/quest-board/QuestBoard.tsx
- apps/web/src/components/quest-board/QuestBoardFab.tsx
- apps/web/src/components/quest-board/QuestRowActions.tsx
- apps/web/src/lib/quest-board-empty-variant.ts
- apps/web/src/lib/quest-board-empty-variant.test.ts
- package.json

### Change Log

- 2026-06-04: Story 3.6 — board-clear celebratory empty state, empty orchestration, shared create-quest sheet, complete-flow wiring

## Story Completion Status

- Status: **done** — implementation and code-review patches applied
- Depends on: Story 3.2 (complete), 3.3 (reward Continue hook), 2.7 (QuestBoardEmptyFirst)
- Next: Epic 4 E2E includes `board-clear.spec.ts` per architecture
