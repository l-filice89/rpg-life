---
baseline_commit: 3e60adf
---

# Story 2.7: Quest Board Empty State

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben (new user with no Quests)**,
I want a welcoming empty state on Quest Board,
So that I know exactly how to plant my first Quest.

## Acceptance Criteria

1. **Given** an authenticated user with **zero open Quests** **When** they view Quest Board (after successful fetch) **Then** the first-time empty state renders instead of the placeholder copy (FR4, UX-DR19).

2. **And** headline reads **"No quests yet"** using display typography (`text-display-sm` or equivalent token from theme).

3. **And** body includes an RPG one-liner encouraging the first Quest (UX-DR27) — approved copy: **"Plant a quest to chart your path."** (subordinate muted text).

4. **And** a visible primary CTA hint points to the FAB: **"Tap + to create your first quest"** (text cue; FAB itself is the action — no duplicate create button required unless design prefers inline `Button`).

5. **And** `QuestBoardFab` remains visible and functional (FR4, UX-DR19) — same FAB as Story 2.4.

6. **And** empty state does **not** render when `tasks.length > 0` (even if client filters hide all rows — that is Story 2.6 filtered-empty copy).

7. **And** empty state does **not** render on fetch failure — `error.tsx` retry banner handles errors (UX-DR23).

8. **And** empty state is distinct from **board-clear** celebratory empty (UX-DR20 / Story 3.6) — do not use "Quest board clear" copy or celebratory headline here.

9. **And** component is an RSC-presentational shell (`QuestBoardEmptyFirst.tsx`) — no client state required.

10. **And** voice/tone follows EXPERIENCE.md banned list — no "Your list is empty — get started!" generic productivity copy.

11. **And** `bun run type-check` green; optional lightweight render test or manual UJ-1 verification documented.

## Tasks / Subtasks

- [ ] **Task 1: `QuestBoardEmptyFirst` component** (AC: #2–#5, #9–#10)
  - [ ] Create `apps/web/src/components/quest-board/QuestBoardEmptyFirst.tsx` — **server component** (no `"use client"`)
  - [ ] Layout: centered column, generous vertical padding (`py-12` or `py-16`), `text-center`, max-width consistent with app shell
  - [ ] Structure:
    ```tsx
    <section aria-labelledby="quest-board-empty-heading" className="...">
      <h2 id="quest-board-empty-heading" className="text-display-sm ...">No quests yet</h2>
      <p className="mt-3 text-muted-foreground">Plant a quest to chart your path.</p>
      <p className="mt-6 text-sm text-muted-foreground">Tap + to create your first quest</p>
    </section>
    ```
  - [ ] Verify `text-display-sm` exists in `globals.css` / theme — if missing, use documented display token from Story 1.2 (`text-hero-level` pattern) or add minimal utility matching DESIGN.md display-sm scale
  - [ ] No shame copy; no red/destructive colors

- [ ] **Task 2: Wire into `QuestBoard.tsx`** (AC: #1, #5–#7)
  - [ ] Replace placeholder:
    ```tsx
    // BEFORE
    <p className="text-muted-foreground">Your quests will appear here.</p>
    // AFTER
    <QuestBoardEmptyFirst />
    ```
  - [ ] Keep structure:
    ```tsx
    <QuestBoardHeader profile={profile} />
    {tasks.length === 0 ? (
      <QuestBoardEmptyFirst />
    ) : (
      <QuestBoardTaskList tasks={tasks} />  // from Story 2.6 — or inline <ul> if 2.7 devs before 2.6
    )}
    <QuestBoardFab />
    ```
  - [ ] **Dependency note:** If Story 2.6 not merged yet, keep inline `<ul>` for non-empty path; swap to `QuestBoardTaskList` when 2.6 lands. Empty path is independent.

- [ ] **Task 3: Typography / theme check** (AC: #2)
  - [ ] Confirm display-sm in `apps/web/src/styles/globals.css` or `packages/ui/src/styles/globals.css`
  - [ ] Match auth gate / tutorial display hierarchy — epic beat typography for headlines only

- [ ] **Task 4: Verify UJ-1 path** (AC: #1, #4–#5, #11)
  - [ ] Manual: new user (or delete all quests) → dismiss Tutorial → see empty state + FAB
  - [ ] Manual: tap FAB → Create Quest sheet opens (Story 2.4 regression)
  - [ ] Manual: create one quest → empty state replaced by list
  - [ ] Manual: simulate fetch error → `error.tsx` shows, not empty state
  - [ ] `bun run type-check` + `bun run smoke` green

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `QuestBoard.tsx` placeholder `"Your quests will appear here."` | **Replace** with `QuestBoardEmptyFirst` |
| `QuestBoardFab` + `CreateQuestSheet` | **Keep** — FAB must stay visible below/overlay empty |
| `quest-board/error.tsx` | **Keep** — errors never show empty |
| `quest-board/loading.tsx` skeleton | **Keep** — cold load skeleton unchanged |
| Story 2.6 `QuestBoardTaskList` | **Coexist** — empty branch unchanged when `tasks.length === 0` |

[Source: `2-2-list-open-quests-on-quest-board.md` L240; codebase read 2026-06-01]

### Copy (Binding — UX-DR27 / UX-DR19)

| Element | Copy | Notes |
|---------|------|-------|
| Headline | **No quests yet** | Exact FR4 / EXPERIENCE approved phrase |
| RPG one-liner | **Plant a quest to chart your path.** | Star Path constellation metaphor; neutral, inviting |
| CTA hint | **Tap + to create your first quest** | Points to existing FAB — UX-DR19 |
| Banned | "Your list is empty — get started!" | EXPERIENCE voice table |
| Banned | "Quest board clear" | Story 3.6 only |

[Source: `EXPERIENCE.md` L54, L84, L97, L156; `epics.md` UX-DR19, UX-DR27]

### Two Empty States (Critical — Do Not Conflate)

| State | When | Component | Headline |
|-------|------|-----------|----------|
| **First-time / zero quests** | `tasks.list` returns `[]` on load | `QuestBoardEmptyFirst` (this story) | No quests yet |
| **Board clear** | Last open quest completed (Epic 3) | `QuestBoardEmptyClear` (Story 3.6) | Quest board clear |

Story 2.7 implements **only** the first row. Do not import celebratory copy, confetti, or Profile link from UX-DR20.

[Source: `architecture.md` L1022; `EXPERIENCE.md` Component Patterns L84–85]

### Tutorial Interaction (Binding)

UJ-1 flow:
1. Tutorial auto-opens on first auth visit (Story 1.5)
2. User dismisses Tutorial → Quest Board with zero quests → **this empty state**

No need to read `tutorial_seen_at` in empty component — if `tasks.length === 0`, show empty. Tutorial sheet may have been open moments before; empty renders underneath when list is empty.

[Source: `EXPERIENCE.md` UJ-1; `epics.md` Story 2.7 AC context]

### RSC Pattern (Binding)

`QuestBoardEmptyFirst` is static markup — **no** `"use client"`, no hooks, no session storage.

`QuestBoard` remains RSC orchestrator:

```tsx
export function QuestBoard({ tasks, profile }: QuestBoardProps) {
  return (
    <div className="py-6">
      <QuestBoardHeader profile={profile} />
      {tasks.length === 0 ? (
        <QuestBoardEmptyFirst />
      ) : (
        <QuestBoardTaskList tasks={tasks} />
      )}
      <QuestBoardFab />
    </div>
  );
}
```

[Source: `architecture.md` L1033 — empty state shells stay RSC]

### FAB Visibility (Binding)

`QuestBoardFab` renders **after** empty/list content — fixed/trailing position unchanged from Story 2.4. Empty state CTA text complements FAB; do not hide FAB when empty.

[Source: `FabCreateQuest.tsx`; UX-DR19]

### Error vs Empty (Binding — UX-DR23)

| Scenario | Surface |
|----------|---------|
| RSC fetch throws | `quest-board/error.tsx` — "Couldn't load your quests" + Retry |
| Fetch succeeds, `tasks = []` | `QuestBoardEmptyFirst` |
| Fetch succeeds, filters hide all | Story 2.6 — "No quests match your filters." |

Never show empty state on error.

[Source: `2-2-list-open-quests-on-quest-board.md`; `EXPERIENCE.md` State Patterns L96]

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.7):**
- `QuestBoardEmptyFirst.tsx`
- Replace placeholder in `QuestBoard.tsx`
- Typography token verification

**Out of scope — do NOT implement:**
- `QuestBoardEmptyClear` / board-clear (Story 3.6, UX-DR20)
- Inline primary Button duplicating FAB (optional enhancement only if UX review asks)
- Constellation SVG motif (optional polish — not in AC; auth page has motif if reused later)
- E2E Playwright UJ-1 (Epic 4)
- Seeding demo quests for empty testing in production code

### Previous Story Intelligence (2.2)

Story 2.2 explicitly deferred FR4 empty to 2.7:

> Zero quests UX in 2.2: Keep simple muted text — Story 2.7 replaces with FR4 empty state.

Placeholder to remove: `"Your quests will appear here."`

[Source: `2-2-list-open-quests-on-quest-board.md` L240]

### Previous Story Intelligence (2.6)

If developing 2.7 before or after 2.6:
- Empty branch (`tasks.length === 0`) is **orthogonal** to filters
- Filters only mount when `tasks.length > 0`
- Order: 2.6 and 2.7 can ship in either sequence; combined `QuestBoard.tsx` wiring shown above

[Source: `2-6-quest-board-filters.md`]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `3e60adf` chore: scaffold cleaning | Latest baseline |
| `0651426` feat: quest creation | FAB + CreateQuestSheet |
| `b48ea0a` feat: tutorial | Tutorial → empty UJ-1 path |

### Anti-Patterns (Do Not)

- ❌ Use generic productivity empty copy
- ❌ Implement board-clear celebratory empty in this story
- ❌ Hide FAB when list empty
- ❌ Show empty state on fetch error
- ❌ Show empty when filters hide rows but server has tasks
- ❌ Add `"use client"` to empty component without reason
- ❌ Break Create Quest FAB flow

### Project Structure Notes

```
apps/web/src/components/quest-board/QuestBoardEmptyFirst.tsx   # NEW
apps/web/src/components/quest-board/QuestBoard.tsx           # UPDATE
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.7, FR4, UX-DR19, UX-DR27]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-4, UJ-1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — QuestBoardEmptyFirst]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — empty state, UJ-1, voice]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — display typography]
- [Source: `_bmad-output/implementation-artifacts/2-2-list-open-quests-on-quest-board.md`]
- [Source: `_bmad-output/implementation-artifacts/2-6-quest-board-filters.md`]
- [Source: `apps/web/src/components/quest-board/QuestBoard.tsx`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

## Story Completion Status

- Status: **ready-for-dev** — Ultimate context engine analysis completed - comprehensive developer guide created
- Next: `dev-story` 2.6 → 2.7 → mark Epic 2 stories done → optional `epic-2-retrospective`
