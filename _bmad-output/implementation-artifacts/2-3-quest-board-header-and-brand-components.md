---
baseline_commit: 2252f15
---

# Story 2.3: Quest Board Header and Brand Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to see my Hero level, XP progress, and Focus at a glance on the Quest Board,
So that I feel my overall progression while planning Quests.

## Acceptance Criteria

1. **Given** an authenticated user on Quest Board **When** the page renders **Then** the view shows hamburger + title (AppShell), Hero level label, XpBar, and FocusPill per mockup stack (UX-DR4, UX-DR5, UX-DR9).

2. **And** XpBar uses 8px height, full radius, teal→violet gradient fill (`--xp-fill-start` → `--xp-fill-end`), optional violet glow `0 0 12px rgba(124, 58, 237, 0.35)` (UX-DR4).

3. **And** FocusPill displays current balance read-only as `{balance}/{cap}` with focus-pill tokens; no tap action in MVP (UX-DR5).

4. **And** `SkillChip` renders unified neutral palette + Lucide icon 14px per skill map in `packages/ui/src/skill-icons.ts` (UX-DR6).

5. **And** `QuestRow` renders elevated card (`bg-card`, `border`, `rounded-md`, `px-5 py-4`) with checkbox leading, title 16px medium, difficulty chip, 1–3 skill chips, due date when set; overdue uses `border-overdue-border` only — never alarm red (UX-DR7).

6. **And** layout follows responsive breakpoints: content `max-w-lg` (md–lg) / `max-w-2xl` (≥ lg) already in AppShell; hero zone and rows remain single-column (UX-DR10).

7. **And** `profile.get` tRPC returns header progression data scoped to authenticated user; new users with no XP show Hero Lv 0, empty XP bar, Focus 0/cap 3.

8. **And** Quest Board page remains RSC-first — fetches `tasks.list` + `profile.get` via server tRPC caller; brand components in `@rpg-life/ui` are presentational (no `"use client"` unless required).

9. **And** loading skeleton matches hero zone + branded row shape (UX-DR22); existing error boundary unchanged (UX-DR23).

## Tasks / Subtasks

- [x] **Task 1: Skill icon map + brand components in `@rpg-life/ui`** (AC: #2–#4)
  - [x] Create `packages/ui/src/skill-icons.ts` — map `SkillCode` → Lucide component per `SKILL_CATALOG.iconKey`: Target, HeartPulse, BookOpen, Users, LayoutList, Shield, Hammer
  - [x] Create `packages/ui/src/components/brand/xp-bar.tsx` — props: `value` (0–1), `className?`; track `bg-xp-track`, fill gradient + optional glow
  - [x] Create `packages/ui/src/components/brand/focus-pill.tsx` — props: `balance`, `cap`; tokens `bg-focus-pill-bg text-focus-pill-fg border-border`
  - [x] Create `packages/ui/src/components/brand/skill-chip.tsx` — props: `skillCode`, `label?` (default from catalog displayName)
  - [x] Export brand components + `getSkillIcon` from `packages/ui/src/index.ts`
  - [x] Add unit tests in `packages/ui/src/components/brand/` or co-located `*.test.tsx` for render smoke (icon map resolves all 7 codes)

- [x] **Task 2: Minimal `profile.get` read path** (AC: #3, #7)
  - [x] Create `packages/db/src/repositories/profile.ts` — `getProfileSummary(db, userId)` returning camelCase DTO
  - [x] Sum `user_skills.xp` for user; read `user_progress.focus_balance` (default 0 if row missing)
  - [x] Compute read-time (inline OK for 2.3; Story 3.1 extracts to `packages/domain`):
    - `totalXp = sum(skillXp)`
    - `heroLevel = floor(sqrt(totalXp / 50))` — `A_USER = 50` from addendum
    - `xpAtLevel(L) = L * L * 50`; `heroXpProgress = clamp((totalXp - xpAtLevel(heroLevel)) / (xpAtLevel(heroLevel + 1) - xpAtLevel(heroLevel)), 0, 1)`
    - `focusCap = 3 + floor(heroLevel / 3)`
  - [x] Create `packages/api/src/routers/profile.ts` — replace stub `ping` with `get: protectedProcedure.query(...)` **or** add `get` alongside `ping` (prefer `get` as primary; keep `ping` if tests depend on it)
  - [x] Export `ProfileSummary` type from `@rpg-life/api`
  - [x] Integration tests in `packages/api/src/__tests__/profile-get.test.ts`: unauthenticated rejects; new user → level 0, progress 0, focus 0/3; user with skill xp → correct level/progress/cap

- [x] **Task 3: Quest Board header zone** (AC: #1, #3, #6)
  - [x] Create `apps/web/src/components/quest-board/QuestBoardHeader.tsx` — RSC; props: `profile: ProfileSummary`
  - [x] Layout per mockup `hero-zone`: row with `text-hero-level` "Hero Lv {n}" + `FocusPill`; below, full-width `XpBar`
  - [x] Render at top of `QuestBoard.tsx` (below AppShell hamburger/title — hero zone is quest-board content, not global AppHeader)
  - [x] Update `quest-board/page.tsx` — parallel fetch: `Promise.all([trpc.tasks.list.query(), trpc.profile.get.query()])`

- [x] **Task 4: QuestRow replaces minimal list item** (AC: #5, #6)
  - [x] Create `apps/web/src/components/quest-board/QuestRow.tsx` — RSC shell composing brand chips + meta
  - [x] Create `apps/web/src/components/quest-board/QuestRowActions.tsx` — `"use client"`; leading `@rpg-life/ui` `Checkbox` **disabled** (decorative until Epic 3); min 44×44 touch target wrapper
  - [x] Reuse `formatDueDate` logic from `QuestBoardListItem.tsx` (extract to `apps/web/src/lib/format-due-date.ts` if shared)
  - [x] Overdue: `dueDate < todayUTC` (date-only compare) → `border-overdue-border`; due copy "Due {date}" or short date for overdue per mockup rhythm
  - [x] Difficulty: neutral `Badge` with capitalized label (`easy` → "Easy")
  - [x] Skill chips: map `task.skillCodes` → `SkillChip` (catalog sort order already on DTO)
  - [x] **A11y:** remove per-row `<h2>` — title as `<p className="text-base font-medium">` inside row; page keeps single `<h1>` in AppHeader
  - [x] Replace `QuestBoardListItem` usage in `QuestBoard.tsx`; delete `QuestBoardListItem.tsx`
  - [x] Row body is **not** tappable in 2.3 (edit sheet = Story 2.5)

- [x] **Task 5: Skeleton refresh** (AC: #9)
  - [x] Update `QuestBoardSkeleton.tsx` — hero zone: label skeleton + pill skeleton + xp bar skeleton; row skeletons: checkbox circle + card height ~72px matching QuestRow padding

- [x] **Task 6: Verification** (AC: all)
  - [x] `bun run type-check` green
  - [x] `bun run smoke` green (add profile-get tests to smoke script)
  - [x] Manual: signed-in user sees Hero Lv 0, 0/3 Focus, empty XP bar, branded rows with checkbox
  - [x] Manual: insert `user_skills` xp rows → header updates level/bar; toggle OS dark mode → tokens correct
  - [x] Manual: overdue task (due_date in past) shows muted overdue border only

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 2.3 uncommitted diff vs baseline `2252f15`._

- [x] [Review][Patch] Duplicate checkbox `aria-label` on every quest row [`apps/web/src/components/quest-board/QuestRowActions.tsx`:10]
- [x] [Review][Patch] `profile.get` auth test does not assert `UNAUTHORIZED` code [`packages/api/src/__tests__/profile-get.test.ts`:81]
- [x] [Review][Patch] No test for partial `heroXpProgress` within a level [`packages/api/src/__tests__/profile-get.test.ts`]
- [x] [Review][Patch] `XpBar` progressbar lacks accessible name for Hero XP [`packages/ui/src/components/brand/xp-bar.tsx`:13]
- [x] [Review][Defer] `dev.ts` / `next.config.ts` dev startup changes exceed story file list — deferred, beneficial DX fix discovered during manual QA
- [x] [Review][Defer] Quest Board page fails entirely if either `tasks.list` or `profile.get` throws — deferred, matches Story 2.2 RSC fetch pattern; partial failure is Epic 4/error-boundary hardening

## Dev Notes

### Brownfield Starting Point (Post Story 2.2)

| Exists today | Action |
|---|---|
| `QuestBoard.tsx` + minimal list rows | **Update** — add header zone; swap to QuestRow |
| `QuestBoardListItem.tsx` | **Replace** → QuestRow; extract date helper |
| `QuestBoardSkeleton.tsx` | **Update** — branded skeleton shapes |
| `AppHeader` (hamburger + title only) | **Keep** — hero zone lives in QuestBoard, not shell |
| `AppShell` max-width breakpoints | **Reuse** — already `max-w-lg lg:max-w-2xl` |
| Crystal Path tokens in `globals.css` | **Reuse** — `--xp-*`, `--focus-pill-*`, `--skill-chip-*`, `--overdue-border`, `text-hero-level` |
| `@rpg-life/ui` Checkbox, Badge, Skeleton | **Reuse** — brand layer wraps tokens |
| `profile.ping` stub | **Extend** — add `profile.get` |
| `packages/domain` empty stub | **Do not implement** — inline read math OK; 3.1 owns formulas |
| FAB, filters, empty states, checkbox complete | **Defer** — Stories 2.4–2.7, Epic 3 |

[Source: codebase read 2026-06-01; `2-2-list-open-quests-on-quest-board.md`]

### Binding: `profile.get` Contract (Header Subset — Story 2.3)

**Procedure:** `profile.get` — `protectedProcedure.query`, **no input**.

**Response:** `ProfileSummary`

```typescript
type ProfileSummary = {
  heroLevel: number;       // floor(sqrt(totalXp / 50))
  heroXpProgress: number;  // 0–1 fraction within current hero level
  focusBalance: number;    // from user_progress.focus_balance
  focusCap: number;        // 3 + floor(heroLevel / 3)
};
```

**Query rules:**

| Rule | Implementation |
|------|----------------|
| Scope | `ctx.user.id` only |
| XP source | `SUM(user_skills.xp)` — missing rows = 0 |
| Focus | `user_progress.focus_balance`; if no row, 0 |
| No client input | Never accept userId from client |

**Story 3.4 extension:** Same procedure later adds `skills: SkillProgress[]` (all 7 codes). Design repository signature so extending the DTO does not break header callers.

[Source: `addendum.md` Hero/Skill levels; `implementation-readiness-report` item 5]

### Hero XP Progress Formula (Binding)

Constants: `A_USER = 50` (from epics/addendum).

```typescript
function xpAtHeroLevel(level: number): number {
  return level * level * A_USER;
}

function heroLevelFromTotalXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / A_USER));
}

function heroXpProgress(totalXp: number, heroLevel: number): number {
  const current = xpAtHeroLevel(heroLevel);
  const next = xpAtHeroLevel(heroLevel + 1);
  if (next === current) return 0;
  return Math.min(1, Math.max(0, (totalXp - current) / (next - current)));
}
```

New user: `totalXp = 0` → `heroLevel = 0`, `heroXpProgress = 0`, `focusCap = 3`.

[Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` L72–74]

### Brand Components (Binding — UX-DR4–6)

**Location:** `packages/ui/src/components/brand/` (new folder — brand layer per Story 1.2 deferral note).

| Component | Key props | Token / style |
|-----------|-----------|---------------|
| `XpBar` | `value: number` (0–1) | h-2 (8px), `rounded-full`, track `bg-xp-track`, fill `bg-gradient-to-r from-xp-fill-start to-xp-fill-end`, optional `shadow-[0_0_12px_rgba(124,58,237,0.35)]` |
| `FocusPill` | `balance`, `cap` | `text-hero-level` sizing ok for pill text; display `⚡ {balance}/{cap}` or icon + numbers per mockup |
| `SkillChip` | `skillCode: SkillCode` | `bg-skill-chip-bg text-skill-chip-fg rounded-sm text-[11px] font-medium px-2.5 py-1`, Lucide 14px |

**skill-icons.ts:**

```typescript
import type { SkillCode } from '@rpg-life/validators';
// Map each SkillCode → Lucide icon component
// iconKey from SKILL_CATALOG: Target, HeartPulse, BookOpen, Users, LayoutList, Shield, Hammer
```

Import icons from `lucide-react` (already dep in `@rpg-life/ui`). `@rpg-life/ui` may depend on `@rpg-life/validators` for `SkillCode` — add workspace dep if missing.

[Source: `epics.md` UX-DR4–6; `DESIGN.md` components block; Story 1.2 token map]

### QuestRow Layout (Binding — UX-DR7)

```
┌─────────────────────────────────────────┐
│ [○ checkbox]  Title (16px medium)       │
│               [Easy] [SkillChip×n] Due… │
└─────────────────────────────────────────┘
```

- Flex row, `gap-3.5` (14px mockup), `items-start`
- Card: `rounded-md border bg-card px-5 py-4` — overdue adds `border-overdue-border`
- Checkbox: `QuestRowActions` client leaf — **disabled**, `aria-label="Complete quest (coming soon)"` or similar
- Title: not a heading element (fix 2.2 deferred a11y)
- Meta row: `flex flex-wrap gap-2 items-center` — difficulty Badge, SkillChips, due text `text-[11px] text-muted-foreground`
- **No** row click handler (Story 2.5)

[Source: `mockups/quest-board.html` L93–118; `deferred-work.md` Story 2.2 item]

### Header Stack Placement (Critical)

UX-DR9 full stack: `hamburger + title → hero zone → filter chips → quest list`.

| Zone | Component | Story |
|------|-----------|-------|
| Hamburger + title | `AppHeader` in AppShell | 1.4 ✅ |
| Hero zone | `QuestBoardHeader` in QuestBoard | **2.3** |
| Filter chips | `QuestBoardFilters` | 2.6 |
| Quest list | `QuestRow` list | **2.3** (rows); 2.2 had minimal rows |

Do **not** move hero zone into global `AppHeader` — Profile page header differs (Story 3.4).

[Source: Story 2.2 Dev Notes; UX-DR9; `app-shell.tsx` L41 max-width]

### RSC Page Pattern (Binding)

```typescript
// apps/web/src/app/(app)/quest-board/page.tsx
export default async function QuestBoardPage() {
  const trpc = await createServerTrpcClient();
  const [tasks, profile] = await Promise.all([
    trpc.tasks.list.query(),
    trpc.profile.get.query(),
  ]);
  return <QuestBoard tasks={tasks} profile={profile} />;
}
```

Pass serializable props only. `QuestBoard`, `QuestBoardHeader`, `QuestRow` stay server components; only `QuestRowActions` is client.

[Source: Story 2.2 RSC pattern; `architecture.md` L420–425]

### Overdue Detection (Binding)

Date-only `dueDate` (`YYYY-MM-DD`). Compare to **today UTC** (consistent with Story 2.2 `formatDueDate` UTC parsing):

```typescript
function isOverdue(dueDate: string): boolean {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return false;
  const dueUtc = Date.UTC(+match[1], +match[2] - 1, +match[3]);
  return dueUtc < todayUtc;
}
```

Display: overdue still shows date; border uses `--overdue-border`. No red/destructive styling.

[Source: Story 2.2 review fix UTC dates; UX anti-shame overdue rule]

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.3):**
- Brand components: XpBar, FocusPill, SkillChip, skill-icons
- QuestBoardHeader + profile.get read path
- QuestRow + disabled checkbox shell
- Skeleton refresh
- Replace minimal list item

**Out of scope — do NOT implement:**
- Checkbox complete / confirm modal (Epic 3)
- Row tap → edit sheet (Story 2.5)
- FAB + Create Quest (Story 2.4)
- Filter chips (Story 2.6)
- FR4 / board-clear empty states (Stories 2.7 / 3.6)
- Full `profile.get` with 7 skill bars (Story 3.4)
- Domain package extraction (Story 3.1) — but use same formulas
- Focus earn/spend (Story 3.5)
- Animated XP fill on reward (Epic 3)

**Zero quests UX:** Keep Story 2.2 placeholder text; header still renders with Hero/Focus defaults.

### Difficulty Labels

Map DB values to display (neutral Badge):

| `difficulty` | Label |
|--------------|-------|
| trivial | Trivial |
| easy | Easy |
| medium | Medium |
| hard | Hard |

No color coding per difficulty in MVP (mock uses neutral badge for dates; difficulty chip same neutral family).

### Previous Story Intelligence (2.2)

- `TaskListItem` exported from `@rpg-life/api` — QuestRow consumes same shape
- UTC date formatting + malformed guard in list item — **preserve** when extracting helper
- Repository pattern established in `packages/db/src/repositories/tasks.ts` — mirror for profile
- Integration test pattern: in-memory SQLite, both migrations, split on `--> statement-breakpoint`
- Review deferred: per-row h2 → fix in QuestRow (this story)
- `AppHeader` unchanged in 2.2 — hero zone intentionally in QuestBoard skeleton

[Source: `2-2-list-open-quests-on-quest-board.md` Dev Agent Record + Review Findings]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `2252f15` feat: task visualization | Story 2.2 landed — direct baseline for 2.3 |
| `af73294` feat: tasks and skills | Schema + user_skills table for profile.get |
| `6ea9ed4` feat: design setup | Crystal Path tokens ready for brand components |

### Latest Tech Notes

- **Lucide React** — already in `@rpg-life/ui`; import named icons matching `SKILL_CATALOG.iconKey`
- **Tailwind v4** — brand colors via CSS vars already in `@theme` (`bg-xp-track`, etc.)
- **shadcn Checkbox** — Radix; use `disabled` + `pointer-events-none` for decorative state
- **@rpg-life/validators** — `SKILL_CATALOG` has `displayName` + `iconKey`; single source for SkillChip labels

### Anti-Patterns (Do Not)

- ❌ Import `@rpg-life/db` in `apps/web`
- ❌ Put progression math in React components — compute in repository/API layer
- ❌ Implement checkbox complete or row edit navigation
- ❌ Store hero level in DB as source of truth (read-time compute only)
- ❌ Per-skill hue on SkillChip (unified neutral palette only)
- ❌ Alarm red for overdue rows
- ❌ Move hero zone into global AppHeader (breaks Profile layout)
- ❌ Break `tasks.list` contract or sorting from Story 2.2
- ❌ Implement full domain engine in `packages/domain` (Story 3.1 scope)

### Project Structure Notes

Architecture shows `AppHeader` with Hero level — aspirational; actual split: shell header vs `QuestBoardHeader`. Follow repo paths under `apps/web/src/`.

Brand components belong in `packages/ui/src/components/brand/` per architecture L1010–1012. QuestRow stays in `apps/web/src/components/quest-board/` (app-specific composition).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.3, UX-DR4–7, UX-DR9–10]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — components, typography, breakpoints]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/quest-board.html` — header + row composition]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` — level formulas, focus cap]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — RSC split, brand layer, profile.get invalidation]
- [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-29.md` — empty-state defaults for 2.3]
- [Source: `_bmad-output/implementation-artifacts/2-2-list-open-quests-on-quest-board.md`]
- [Source: `_bmad-output/implementation-artifacts/1-2-crystal-path-design-tokens-and-shadcn-foundation.md`]
- [Source: `packages/validators/src/skill-codes.ts`, `apps/web/src/components/sidebar/app-shell.tsx`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Agent environment lacked `bun` CLI — run `bun install && bun run type-check && bun run smoke` locally to verify

### Completion Notes List

- ✅ Brand layer: `XpBar`, `FocusPill`, `SkillChip`, `skill-icons.ts` + unit tests for all 7 skill codes
- ✅ `getProfileSummary` repository + `profile.get` tRPC (kept `profile.ping` for existing tests)
- ✅ `ProfileSummary` exported from `@rpg-life/api`
- ✅ 4 integration tests in `profile-get.test.ts`; added to root smoke script
- ✅ `QuestBoardHeader` hero zone; page parallel-fetches `tasks.list` + `profile.get`
- ✅ `QuestRow` + `QuestRowActions` (disabled checkbox); deleted `QuestBoardListItem`
- ✅ Extracted `format-due-date.ts` + `difficulty-label.ts`; overdue muted border
- ✅ Branded skeleton refresh
- ✅ Code review 2026-06-01: 4 patches applied (a11y labels, partial XP test)

### File List

- `packages/ui/src/skill-icons.ts`
- `packages/ui/src/skill-icons.test.ts`
- `packages/ui/src/components/brand/xp-bar.tsx`
- `packages/ui/src/components/brand/focus-pill.tsx`
- `packages/ui/src/components/brand/skill-chip.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/package.json`
- `packages/db/src/repositories/profile.ts`
- `packages/db/src/index.ts`
- `packages/api/src/routers/profile.ts`
- `packages/api/src/root.ts`
- `packages/api/src/index.ts`
- `packages/api/src/__tests__/profile-get.test.ts`
- `apps/web/src/lib/format-due-date.ts`
- `apps/web/src/lib/difficulty-label.ts`
- `apps/web/src/components/quest-board/QuestBoardHeader.tsx`
- `apps/web/src/components/quest-board/QuestRow.tsx`
- `apps/web/src/components/quest-board/QuestRowActions.tsx`
- `apps/web/src/components/quest-board/QuestBoard.tsx`
- `apps/web/src/components/quest-board/QuestBoardSkeleton.tsx`
- `apps/web/src/app/(app)/quest-board/page.tsx`
- `package.json`
- `apps/web/src/components/quest-board/QuestBoardListItem.tsx` (deleted)

## Change Log

- 2026-06-01: Story 2.3 — brand components, profile.get, Quest Board header, QuestRow, skeleton refresh
- 2026-06-01: Code review patches — unique checkbox aria-labels, XpBar aria-label, partial heroXpProgress test

## Story Completion Status

- Status: **done** — all ACs satisfied; code review patches applied 2026-06-01
- Next: `create-story` 2.4 (Create Quest via FAB)
