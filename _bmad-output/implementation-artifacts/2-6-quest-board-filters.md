---
baseline_commit: 3e60adf
---

# Story 2.6: Quest Board Filters

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to filter overdue Quests and limit upcoming Quests by day range,
So that I can orient my week without overwhelm.

## Acceptance Criteria

1. **Given** Quests with mixed due dates on Quest Board **When** Ben toggles the **Overdue** filter on **Then** only open Quests with `due_date` strictly before today (UTC) display (FR2, UX-DR21).

2. **And** filtered view shows a neutral section label **"Overdue"** (not shame copy — UX-DR27).

3. **And** when the Overdue filter is on and zero Quests match, the overdue section is hidden or shows neutral empty copy (no FR4 first-time empty state).

4. **When** Ben toggles the **Next 7 days** upcoming filter on **Then** Quests with `due_date` more than 7 calendar days after today (UTC) are hidden (FR3).

5. **And** undated Quests (`dueDate === null`) **always** remain visible when the upcoming filter is active.

6. **And** overdue Quests remain visible when only the upcoming filter is active (they are not "beyond" the range).

7. **And** when both filters are off, the board shows the full open Quest list sorted as today (Story 2.2 — nearest due date, undated last).

8. **And** filter state persists for the **browser tab session** via `sessionStorage` (survives in-app navigation; clears when tab closes) — **not** URL search params (FR3, architecture session-only).

9. **And** filter UI sits **below** `QuestBoardHeader` and **above** the quest list per UX-DR9 header stack.

10. **And** filter controls are keyboard-accessible toggles with visible focus rings and `aria-pressed` (NFR4).

11. **And** unit tests cover pure filter logic (`isBeyondUpcomingRange`, combined filters, undated always visible, overdue-only mode).

12. **And** `bun run smoke` and `bun run type-check` remain green; no server/API changes required (client-side filter on existing `tasks.list` payload).

## Tasks / Subtasks

- [x] **Task 1: Pure filter helpers** (AC: #1, #4–#7, #11)
  - [x] Create `apps/web/src/lib/quest-board-filters.ts`:
    - Reuse or import `isOverdue` from `@/lib/format-due-date` (do not duplicate UTC logic)
    - `isBeyondUpcomingRange(dueDate: string, days: number): boolean` — true when due date > today + days (UTC calendar math)
    - `filterQuests(tasks: TaskListItem[], filters: QuestBoardFilterState): TaskListItem[]`
    - `QuestBoardFilterState`: `{ overdueOnly: boolean; upcomingRangeEnabled: boolean; upcomingDays: number }` (default `upcomingDays: 7`)
  - [x] Create `apps/web/src/lib/quest-board-filters.test.ts` — vectors: undated always pass upcoming filter; overdue passes upcoming filter; due in 8 days hidden when 7-day filter on; overdue-only hides non-overdue; both off returns all

- [x] **Task 2: Session persistence** (AC: #8)
  - [x] Add `loadQuestBoardFilters(): QuestBoardFilterState` and `saveQuestBoardFilters(state)` using `sessionStorage` key `rpg-life:quest-board-filters`
  - [x] Guard `typeof window !== 'undefined'`; default `{ overdueOnly: false, upcomingRangeEnabled: false, upcomingDays: 7 }`
  - [x] Parse JSON safely; fall back to defaults on corrupt data

- [x] **Task 3: `QuestBoardFilters` client component** (AC: #1–#6, #9–#10)
  - [x] Create `apps/web/src/components/quest-board/QuestBoardFilters.tsx` — `"use client"`
  - [x] Two toggle chips using `@rpg-life/ui` `Button` (`variant="outline"`, `size="sm"`, `aria-pressed`):
    - **Overdue** — toggles `overdueOnly`
    - **Next 7 days** — toggles `upcomingRangeEnabled` (fixed 7 days when active; no day-picker in MVP)
  - [x] Active chip: `bg-primary/10 border-primary` or equivalent; inactive: muted outline
  - [x] `flex flex-wrap gap-2 mb-4` below header
  - [x] On change: update state + `saveQuestBoardFilters`

- [x] **Task 4: Client task list island** (AC: #1–#7, #3)
  - [x] Create `apps/web/src/components/quest-board/QuestBoardTaskList.tsx` — `"use client"`
  - [x] Props: `tasks: TaskListItem[]`
  - [x] Filter state via `QuestBoardFilterProvider` in app shell (sessionStorage load/save); TaskList consumes `useQuestBoardFilters`
  - [x] Renders `QuestBoardFilters` + filtered `<ul role="list">` of `QuestRow` (same gap-5 as today)
  - [x] When `overdueOnly` and matches > 0: optional `<h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Overdue</h2>` above list
  - [x] When filters active and filtered list empty (but `tasks.length > 0`): `<p className="text-muted-foreground">No quests match your filters.</p>` — **not** first-time empty
  - [x] When filters off: flat list (preserve server sort order from props)

- [x] **Task 5: Wire `QuestBoard.tsx`** (AC: #9, #12)
  - [x] Keep `QuestBoard` as RSC shell: `QuestBoardHeader` + conditional body + `QuestBoardFab`
  - [x] Replace inline `<ul>` with `<QuestBoardTaskList tasks={tasks} />` when `tasks.length > 0`
  - [x] Do **not** convert `QuestBoard` or `QuestBoardHeader` to client components (`QuestRow` requires `"use client"` when rendered from client TaskList)

- [x] **Task 6: Verify** (AC: all)
  - [x] `bun run type-check` + `bun run smoke` green
  - [x] Manual: toggle Overdue → only past-due rows; toggle Next 7 days → hide far-future dated; undated stay
  - [x] Manual: navigate to Profile and back → filter state restored
  - [x] Manual: new tab → filters reset to defaults

### Review Findings

- [x] [Review][Patch] Mutually exclusive filter toggles [`QuestBoardFilters.tsx:18-34`] — When both Overdue and Next 7 days are active, binding logic applies overdue-only (`filterQuests` early-returns on `overdueOnly`) but both chips render pressed, which misleads users about active filters.
- [x] [Review][Patch] Story file missing filter-context implementation [`2-6-quest-board-filters.md`] — `QuestBoardFilterProvider` in `app-shell.tsx` and `quest-board-filter-context.tsx` satisfy AC #8 (nav persistence) but are absent from File List and Task 4 notes still say TaskList owns filter state locally.
- [x] [Review][Defer] Hydration flash on hard refresh [`quest-board-filter-context.tsx:27-31`] — Provider initializes defaults, then `useEffect` loads sessionStorage; brief unfiltered flash on first paint. Common client-hydration pattern; defer.

## Dev Notes

### Brownfield Starting Point (Post Story 2.5)

| Exists today | Action |
|---|---|
| `QuestBoard.tsx` RSC — header + flat list + placeholder empty | **Update** — task list → client island |
| `QuestBoardHeader.tsx` | **Keep** RSC — hero zone unchanged |
| `QuestRow.tsx` + overdue border via `isOverdue` | **Reuse** — no row changes |
| `format-due-date.ts` — `isOverdue`, UTC date math | **Reuse** for filter helpers |
| `tasks.list` — full open list, server sort | **Reuse** — no new tRPC procedures |
| Placeholder empty `"Your quests will appear here."` | **Replace in Story 2.7** — not this story |
| `QuestBoardFilters.tsx` | **Create** |

[Source: codebase read 2026-06-01; `2-5-edit-and-delete-open-quests.md`]

### Filter Logic (Binding)

```typescript
type QuestBoardFilterState = {
  overdueOnly: boolean;
  upcomingRangeEnabled: boolean;
  upcomingDays: number; // default 7 when upcomingRangeEnabled
};

function filterQuests(tasks: TaskListItem[], filters: QuestBoardFilterState): TaskListItem[] {
  return tasks.filter((task) => {
    if (filters.overdueOnly) {
      return task.dueDate != null && isOverdue(task.dueDate);
    }
    if (filters.upcomingRangeEnabled && task.dueDate != null) {
      if (isOverdue(task.dueDate)) return true;
      if (isBeyondUpcomingRange(task.dueDate, filters.upcomingDays)) return false;
    }
    return true;
  });
}
```

**`isBeyondUpcomingRange`:** due date strictly after `(todayUTC + upcomingDays)` calendar days. Use same UTC parsing as `isOverdue`.

**Order:** preserve input array order (already sorted by server).

[Source: `epics.md` Story 2.6; `prd.md` FR-2, FR-3; `addendum.md` undated rule]

### Client vs Server Filtering (Binding)

Architecture allows API query params (`overdue`, `upcomingDays`) **or** client-side session filters. **Story 2.6 uses client-side only:**

- RSC page already fetches full `tasks.list`
- Filters are session-only UI state — no shareable URLs
- Avoids API churn and matches `QuestBoardFilters` as client island

Do **not** add query params to `tasks.list` in this story.

[Source: `architecture.md` L33, L299, L629; `reconcile-architecture.md`]

### Header Stack (Binding — UX-DR9)

```
QuestBoardHeader     ← RSC (Hero Lv + XpBar + FocusPill)
QuestBoardFilters    ← client (this story)
QuestBoardTaskList   ← client (filtered rows)
QuestBoardFab        ← client (unchanged)
```

[Source: `2-3-quest-board-header-and-brand-components.md`; `DESIGN.md` L168]

### Session Persistence (Binding)

| Storage | Key | When |
|---------|-----|------|
| `sessionStorage` | `rpg-life:quest-board-filters` | On every filter toggle |

**Not** `localStorage` (cross-session), **not** URL params, **not** server session.

Initialize client state from storage on mount; write on change.

[Source: `epics.md` AC; `architecture.md` L299]

### Filter Empty vs First-Time Empty (Critical)

| Condition | UI |
|-----------|-----|
| `tasks.length === 0` (server) | Story **2.7** `QuestBoardEmptyFirst` — not implemented here |
| `tasks.length > 0` but filter matches 0 | `"No quests match your filters."` muted text |
| Overdue filter on, zero overdue | Hide section or neutral inline empty — **not** FR4 empty |

[Source: `EXPERIENCE.md` State Patterns — fetch fail vs empty distinction]

### Copy (Binding — UX-DR27)

| Element | Approved | Banned |
|---------|----------|--------|
| Section label | **Overdue** | Failed quests, Missed, Late penalty |
| Filter chip labels | **Overdue**, **Next 7 days** | Alarm/red styling |
| Filtered empty | No quests match your filters. | Shame framing |

Mockup uses "Replan when ready" — **UX-DR21 / EXPERIENCE voice table wins: use "Overdue".**

[Source: `EXPERIENCE.md` Voice table L62; `mockups/quest-board.html` vs UX-DR21]

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.6):**
- `quest-board-filters.ts` + unit tests
- `QuestBoardFilters.tsx`, `QuestBoardTaskList.tsx`
- `sessionStorage` persistence
- Wire into `QuestBoard.tsx`

**Out of scope — do NOT implement:**
- FR4 / first-time empty state (Story 2.7)
- Board-clear celebratory empty (Story 3.6 / UX-DR20)
- Adjustable day range selector (14/30) — fixed 7-day toggle only unless time permits
- Server-side `tasks.list` query params
- URL-synced filters
- Checkbox complete / Epic 3 features
- Visual grouping of overdue in default (unfiltered) view — optional nice-to-have, not required by AC

### Previous Story Intelligence (2.5)

- Keep RSC + client leaf pattern — do not clientify `QuestBoard` entirely
- UTC date helpers live in `format-due-date.ts` — single source for web display + filters
- `QuestRow` stays RSC; list re-render in client island is fine (same pattern as edit sheets)

[Source: `2-5-edit-and-delete-open-quests.md`]

### Previous Story Intelligence (2.2–2.3)

- Server sort order must be preserved when filters off
- `role="list"` on `<ul>` — maintain for a11y
- Overdue row border already on `QuestRow` — filters do not change row styling

[Source: `2-2-list-open-quests-on-quest-board.md`]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `3e60adf` chore: scaffold cleaning | Latest baseline — CI fixed |
| `99e7c35` feat: quest editing and deletion | QuestRow edit trigger pattern |
| `2252f15` feat: task visualization | `tasks.list`, Quest Board RSC |

### Anti-Patterns (Do Not)

- ❌ Add `overdue` / `upcomingDays` to `tasks.list` API in this story
- ❌ Use `localStorage` or URL search params for filter state
- ❌ Show FR4 "No quests yet" when filters hide all rows
- ❌ Duplicate UTC date logic in a third file — extend/reuse `format-due-date.ts`
- ❌ Convert `QuestBoard` or `QuestRow` to `"use client"` root
- ❌ Shame copy or red alarm styling on filter chips
- ❌ Hide undated Quests when upcoming filter active
- ❌ Implement board-clear empty (Epic 3)

### Project Structure Notes

```
apps/web/src/lib/quest-board-filters.ts
apps/web/src/lib/quest-board-filters.test.ts
apps/web/src/components/quest-board/QuestBoardFilters.tsx
apps/web/src/components/quest-board/QuestBoardTaskList.tsx
apps/web/src/components/quest-board/QuestBoard.tsx          # UPDATE
```

Add filter tests to root `smoke` script if using `bun test` path, or rely on `bun test apps/web/src/lib/quest-board-filters.test.ts` in verify step.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.6, FR2, FR3, UX-DR21]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-2, FR-3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — QuestBoardFilters, session filters]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — filters, voice, state patterns]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — header stack]
- [Source: `_bmad-output/implementation-artifacts/2-5-edit-and-delete-open-quests.md`]
- [Source: `apps/web/src/components/quest-board/QuestBoard.tsx`]
- [Source: `apps/web/src/lib/format-due-date.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Added `"use client"` to `QuestRow.tsx` — required because `QuestBoardTaskList` (client) renders rows; Next.js forbids client→server imports
- Session helpers use `globalThis.sessionStorage` for SSR-safe + testable access

### Completion Notes List

- ✅ Pure filter helpers: `isBeyondUpcomingRange`, `filterQuests`, `hasActiveQuestBoardFilters`
- ✅ Session persistence via `rpg-life:quest-board-filters` in `sessionStorage`
- ✅ `QuestBoardFilters` toggle chips (Overdue, Next 7 days) with `aria-pressed`
- ✅ `QuestBoardTaskList` client island: filters + filtered list + empty-filter copy
- ✅ `QuestBoard.tsx` wired; header/FAB remain RSC shell
- ✅ `QuestBoardFilterProvider` in app shell — filter state survives Quest Board ↔ Profile navigation
- ✅ Filter toggles mutually exclusive (Overdue vs Next 7 days)
- ✅ 10 unit tests; smoke script updated (63 pass total)
- ✅ `bun turbo type-check lint --filter=@rpg-life/web` green

### File List

- `apps/web/src/lib/quest-board-filters.ts`
- `apps/web/src/lib/quest-board-filters.test.ts`
- `apps/web/src/components/quest-board/quest-board-filter-context.tsx`
- `apps/web/src/components/quest-board/QuestBoardFilters.tsx`
- `apps/web/src/components/quest-board/QuestBoardTaskList.tsx`
- `apps/web/src/components/quest-board/QuestBoard.tsx`
- `apps/web/src/components/quest-board/QuestRow.tsx`
- `apps/web/src/components/sidebar/app-shell.tsx`
- `package.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-01: Code review — mutually exclusive filter toggles; story file synced with filter-context implementation
- 2026-06-01: Story 2.6 — Quest Board filters (client-side), session persistence, filter unit tests

## Story Completion Status

- Status: **done** — all ACs satisfied; review patches applied; smoke + type-check green
- Next: `dev-story` 2.7
