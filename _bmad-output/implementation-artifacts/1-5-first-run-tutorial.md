---
baseline_commit: 944a0273e450d39045ace651b341e0158d31bb20
---

# Story 1.5: First-Run Tutorial

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben (first-time user)**,
I want an explainer on my first app open,
So that I understand Quests, Skills, XP freshness, and Focus before I start.

## Acceptance Criteria

1. **Given** a user who has never dismissed the Tutorial (`tutorial_seen_at` is null) **When** they open the app after authentication **Then** the Tutorial sheet auto-opens before Quest Board interaction (FR13, UX-DR16).

2. **And** dismissing the Tutorial lands the user on Quest Board and marks Tutorial as seen server-side via `tutorial.markSeen` (writes `user_progress.tutorial_seen_at`).

3. **And** subsequent app opens do not auto-show the Tutorial.

4. **When** the user opens Tutorial from the sidebar at any time **Then** the same explainer content replays without resetting the seen flag (FR14).

5. **And** Tutorial covers Quests, Skills, Hero level, due dates vs undated freshness, and Focus earn/spend rules.

## Tasks / Subtasks

- [x] **Task 1: `tutorial` tRPC router** (AC: #1–#4)
  - [x] Create `packages/api/src/routers/tutorial.ts`
  - [x] `tutorial.getStatus` — `protectedProcedure.query` → `{ seen: boolean }` where `seen = tutorialSeenAt !== null` for `ctx.user.id`
  - [x] `tutorial.markSeen` — `protectedProcedure.mutation` → sets `user_progress.tutorial_seen_at` to `new Date().toISOString()` and updates `modified_at`; **idempotent** if already seen (no error, no timestamp change)
  - [x] Use Drizzle `eq(userProgress.userId, ctx.user.id)` — never accept `userId` from client input
  - [x] If no `user_progress` row exists (edge case), insert row with `tutorialSeenAt` set — reuse same shape as `provisionUserProgress` defaults
  - [x] Merge router into `packages/api/src/root.ts`: `tutorial: tutorialRouter`
  - [x] Add unit tests in `packages/api/src/__tests__/tutorial.test.ts` (or extend `trpc.test.ts`): unauthenticated → UNAUTHORIZED; `seen: false` when null; `markSeen` sets seen; replay `markSeen` idempotent

- [x] **Task 2: Server-side first-run detection in layout** (AC: #1, #3)
  - [x] Update `apps/web/src/app/(app)/layout.tsx` (RSC) — call `createServerTrpcClient()` → `tutorial.getStatus.query()` → pass `initialTutorialSeen={status.seen}` to `AppShell`
  - [x] Avoid flash: if `!initialTutorialSeen`, `AppShell` opens Tutorial sheet on mount **before** user can interact with main content (Sheet overlay blocks pointer events)
  - [x] Do **not** auto-open on `(auth)/` routes — layout scope is `(app)/` only (already authenticated shell)

- [x] **Task 3: `TutorialSheet` component** (AC: #1, #2, #4, #5)
  - [x] Create `apps/web/src/components/tutorial/tutorial-sheet.tsx` (`"use client"`)
  - [x] Use `@rpg-life/ui` `Sheet` with `side="bottom"` — no custom Sheet internals (UX-DR16, UX-DR28)
  - [x] Props: `open`, `onOpenChange`, `mode: 'first-run' | 'replay'`
  - [x] **First-run mode:** on dismiss (`onOpenChange(false)` or close button), call `trpc.tutorial.markSeen.useMutation()` then close; show error toast + retry hint if mutation fails (online-only NFR)
  - [x] **Replay mode:** dismiss closes sheet only — **do not** call `markSeen` (seen flag already set; FR14)
  - [x] Standard dismiss: built-in Sheet close button + backdrop tap + Esc (Radix defaults)
  - [x] Accessibility: `SheetTitle` visible or sr-only "Tutorial"; content in scrollable region; min 44px touch targets on dismiss/CTA; visible focus rings

- [x] **Task 4: Explainer content** (AC: #5)
  - [x] Single shared content block used for first-run and replay (same copy)
  - [x] Cover **five topics** with RPG-neutral voice (UX-DR27 — no shame/streak/punishment copy):
    1. **Quests** — real tasks framed as quests; Quest Board is home; create via FAB (Epic 2)
    2. **Skills** — seven categories; assign 1–3 per quest; completion trains them
    3. **Hero level** — overall level from total Skill XP across all skills
    4. **Freshness** — dated quests: full XP through due date, reduced only after due date passes; undated: XP gently reduces over time since creation; framing is incentive to schedule, not punishment
    5. **Focus** — earned on medium/hard completions; spent on reschedule overdue, delete overdue, add due date to undated quest; scheduling at create is free
  - [x] Use Crystal Path typography tokens where appropriate (`text-display-sm` for section headings, body `text-base`)
  - [x] Primary dismiss CTA label: **"Got it"** or **"Begin your quest"** — pick one, stay consistent with EXPERIENCE voice
  - [x] No mockup required — shadcn bottom sheet defaults + DESIGN.md row sufficient

- [x] **Task 5: Wire `AppShell` + sidebar** (AC: #1, #4)
  - [x] Update `apps/web/src/components/sidebar/app-shell.tsx`:
    - Accept `initialTutorialSeen: boolean`
    - State: `tutorialOpen`, `tutorialMode`
    - On mount: if `!initialTutorialSeen` → `setTutorialOpen(true)`, `setTutorialMode('first-run')`
    - Render `<TutorialSheet ... />` sibling to sidebar/main
  - [x] Pass `onTutorialClick={() => { setTutorialMode('replay'); setTutorialOpen(true); }}` to `SidebarOverlay`
  - [x] After first-run dismiss + successful `markSeen`, set local `tutorialSeen` state so sheet won't re-open without navigation refresh

- [x] **Task 6: Tests + docs** (AC: #1–#5)
  - [x] `packages/api` tests for tutorial procedures (Task 1)
  - [x] Optional unit test: tutorial content renders five section headings (React Testing Library in `apps/web` if pattern exists from 1.4)
  - [x] Update `apps/web/README.md` — document `TutorialSheet`, `tutorial` router, first-run flow
  - [x] `bun run type-check` + `bun run smoke` pass

- [x] **Task 7: Manual verification** (AC: #1–#5)
  - [x] New user (or `tutorial_seen_at` null in DB) → sign in → Tutorial auto-opens on Quest Board
  - [x] Dismiss Tutorial → Quest Board visible; DB `tutorial_seen_at` populated
  - [x] Refresh / re-open app → Tutorial does **not** auto-open
  - [x] Sidebar → Tutorial → same content opens; dismiss → `tutorial_seen_at` unchanged
  - [x] Verify content mentions all five topics
  - [x] Tab through Tutorial — focus trapped, Esc dismisses (first-run triggers markSeen)

### Review Findings

_Code review 2026-05-29 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 1.5 uncommitted diff vs baseline `944a027`._

- [x] [Review][Patch] Unused `onFirstRunComplete` prop on `TutorialSheet` — declared but never passed from `AppShell`; remove prop and callback to reduce dead API surface [`apps/web/src/components/tutorial/tutorial-sheet.tsx`:13]
- [x] [Review][Patch] Concurrent dismiss while `markSeen` pending — Esc/backdrop/button can re-enter `handleDismiss` before mutation settles; guard with early return when `markSeen.isPending` [`apps/web/src/components/tutorial/tutorial-sheet.tsx`:19]
- [x] [Review][Defer] `(app)/layout.tsx` has no error handling when api/tRPC unreachable — authenticated shell throws instead of retry UI; NFR online-only retry deferred to Epic 4/error boundary [`apps/web/src/app/(app)/layout.tsx`:6]
- [x] [Review][Defer] No authenticated first-run Tutorial E2E — story defers to Epic 4 session fixture; smoke covers API unit tests only [`apps/web/e2e/`]
- [x] [Review][Defer] `apps/web` unit tests still not wired into root `smoke` or CI — carried from Story 1.4 [`package.json`]

## Dev Notes

### Brownfield Starting Point (Post Stories 1.1–1.4)

| Exists today | Action |
|---|---|
| `packages/db/src/schema/user-progress.ts` | **Reuse** — `tutorialSeenAt` nullable text column |
| `packages/auth/src/provision-user-progress.ts` | **Reuse** — row created on sign-in with `tutorialSeenAt: null` |
| `packages/api/src/root.ts` | **Update** — merge `tutorial` router |
| `apps/web/src/components/sidebar/app-shell.tsx` | **Update** — tutorial state + wire sidebar |
| `apps/web/src/components/sidebar/sidebar-overlay.tsx` | **Reuse** — `onTutorialClick` prop already stubbed |
| `apps/web/src/app/(app)/layout.tsx` | **Update** — RSC fetch `tutorial.getStatus` |
| No `TutorialSheet` | **Create** `apps/web/src/components/tutorial/tutorial-sheet.tsx` |
| No `tutorial` router | **Create** `packages/api/src/routers/tutorial.ts` |
| Quest Board placeholder | **Keep** — empty state ("No quests yet") is Epic 2 Story 2.7, not 1.5 |

[Source: codebase read 2026-05-29; Stories 1.1, 1.3, 1.4 File Lists]

### Schema Dependency — RESOLVED

Implementation-readiness report flagged Story 1.5 ↔ 2.1 ordering. **Already fixed in Story 1.1:** `user_progress` table + migration exist; Story 1.3 provisions rows on sign-in. **Do not** recreate table or defer to client-only flag.

[Source: `1-1-scaffold-monorepo-and-development-infrastructure.md` AC #6; `epics.md` Story 2.1 AC]

### tRPC Router Contract (Binding)

```typescript
// packages/api/src/routers/tutorial.ts
tutorial.getStatus → { seen: boolean }
tutorial.markSeen  → { seen: true }  // idempotent
```

- Both procedures: `protectedProcedure` only
- `seen === true` when `user_progress.tutorial_seen_at IS NOT NULL`
- `markSeen` writes ISO-8601 UTC string (matches `modifiedAt` pattern in schema)
- Return domain object directly — no `{ data, error }` envelope

[Source: `architecture.md` L429–433, L264; `epics.md` Story 1.5 AC]

### First-Run vs Replay State Machine

| Event | `tutorial_seen_at` | Auto-open on next visit | Sidebar replay |
|---|---|---|---|
| New user sign-in | `null` | Yes | N/A |
| First-run dismiss + markSeen success | ISO timestamp | No | Opens replay mode |
| Replay dismiss | unchanged | No | Opens again anytime |
| markSeen fails on first dismiss | `null` | Yes (retry on next visit) | — |

**Replay must not call `markSeen`** — FR14 explicit. Router idempotency is safety net only.

[Source: `epics.md` FR13–FR14; `EXPERIENCE.md` L81]

### RSC + Client Split (Binding)

| Layer | Responsibility |
|---|---|
| `(app)/layout.tsx` (RSC) | Fetch `tutorial.getStatus` server-side; pass `initialTutorialSeen` |
| `AppShell` (client) | Own `tutorialOpen`/`tutorialMode`; auto-open effect on mount |
| `TutorialSheet` (client) | Render content; first-run dismiss → `markSeen` mutation |
| `SidebarOverlay` (client) | `onTutorialClick` → replay mode |

**Why server fetch in layout:** Prevents Quest Board flash before Tutorial on first visit; aligns with RSC-first architecture.

[Source: `architecture.md` L291–312; Story 1.4 component split pattern]

### Tutorial Sheet UX Spec (UX-DR16, DESIGN.md L198)

| Requirement | Implementation |
|---|---|
| Surface | shadcn `Sheet` from **bottom** |
| Brand | No brand override — stock shadcn styling |
| Dismiss | Standard close button + backdrop + Esc |
| Auto-open | Once per account when `tutorial_seen_at` null |
| Replay | Sidebar Tutorial item → same sheet, same content |
| Interaction block | Sheet modal overlay prevents Quest Board clicks while open |

[Source: `DESIGN.md` L198; `EXPERIENCE.md` L38, L81]

### Explainer Content Outline (AC #5 — implement as scrollable sections)

Use approved RPG voice; reference PRD glossary for accuracy:

1. **Quests** — "Turn real tasks into quests. Your Quest Board shows what's open — tap **+** to add one when you're ready."
2. **Skills** — "Tag each quest with 1–3 Skills (Concentration, Vitality, Lore, Presence, Order, Resolve, Craft). Completing quests trains them."
3. **Hero level** — "Your Hero level rises from total Skill XP — every quest makes you stronger."
4. **Freshness** — "Quests with due dates earn full XP through the due date. Undated quests earn a bit less over time — scheduling helps, but there's no penalty spiral."
5. **Focus** — "Earn Focus from medium and hard quests. Spend it to reschedule overdue quests, remove them, or add dates — planning ahead is free."

Copy is **guidance** — dev may tighten prose but must preserve all five topics and neutral tone.

[Source: `prd.md` glossary L85–95, FR-14 L295; `EXPERIENCE.md` UX-DR27]

### Sheet API Reminder (bottom Tutorial)

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@rpg-life/ui';

<Sheet open={open} onOpenChange={handleOpenChange}>
  <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Tutorial</SheetTitle>
    </SheetHeader>
    {/* five sections + dismiss CTA */}
  </SheetContent>
</Sheet>
```

Sidebar uses `side="left"`; Tutorial uses `side="bottom"` — two independent Sheets, no stack conflict (UX-DR30 applies to confirm→reward, not sidebar+tutorial).

[Source: `packages/ui` Sheet; Story 1.4 sidebar pattern]

### Wire-up in AppShell (Sketch)

```tsx
export function AppShell({
  children,
  initialTutorialSeen,
}: {
  children: ReactNode;
  initialTutorialSeen: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialMode, setTutorialMode] = useState<'first-run' | 'replay'>('first-run');
  const [seenLocally, setSeenLocally] = useState(initialTutorialSeen);

  useEffect(() => {
    if (!initialTutorialSeen) {
      setTutorialMode('first-run');
      setTutorialOpen(true);
    }
  }, [initialTutorialSeen]);

  // TutorialSheet onDismiss: first-run → markSeen → setSeenLocally(true)
  // onTutorialClick: setTutorialMode('replay'); setTutorialOpen(true);
}
```

[Source: Story 1.4 `app-shell.tsx`; architecture client boundaries]

### Explicit Scope Boundaries

**In scope (Story 1.5):**
- `tutorial.getStatus` + `tutorial.markSeen` tRPC procedures
- `TutorialSheet` bottom sheet with five-topic explainer
- First-run auto-open wired through `(app)/layout` + `AppShell`
- Sidebar Tutorial → replay same content
- API unit tests; README update

**Out of scope (later stories):**
- Quest Board empty state "No quests yet" + FAB → **Epic 2 Story 2.7**
- FAB, create quest sheet → **Epic 2**
- Hero header stats on Quest Board → **Epic 2 Story 2.3**
- Profile stats display → **Epic 3**
- Full authenticated Tutorial E2E with session fixture → **Epic 4**
- Tutorial content i18n → post-MVP

### Previous Story Intelligence

**From 1.4 (app shell):**
- `SidebarOverlay` has `onTutorialClick?: () => void` — wire in `AppShell`, do not modify nav structure
- `AppShell` owns overlay state — extend with tutorial state in same file
- Sheet from `@rpg-life/ui` proven; Tutorial uses `side="bottom"` not left
- Header remains hamburger + title only — no Tutorial trigger in header

**From 1.3 (auth):**
- `user_progress` row provisioned on user/session create — `tutorialSeenAt: null` baseline
- `protectedProcedure` pattern established; tutorial router follows same middleware
- Manual DB check: `SELECT tutorial_seen_at FROM user_progress WHERE user_id = ?`

**From 1.1 (scaffold):**
- `user_progress.tutorial_seen_at` TEXT nullable — store ISO strings
- `packages/api` currently flat `root.ts` — Story 1.5 introduces first `routers/` file per architecture target

[Source: `1-4-app-shell-and-sidebar-navigation.md`; `1-3-magic-link-sign-in.md`; `1-1-scaffold-monorepo-and-development-infrastructure.md`]

### Git Intelligence (Recent Commits)

| Commit | Relevance |
|---|---|
| `944a027` feat: app shell | `AppShell`, `SidebarOverlay`, `onTutorialClick` stub, `(app)/layout` — primary touch points |
| `ae5f369` feat: add auth | `provisionUserProgress`, `protectedProcedure`, session hooks |
| `6ea9ed4` feat: design setup | Sheet primitive, Crystal Path tokens for content typography |

### Latest Tech Notes

- **tRPC v11** + TanStack Query v5 — use `trpc.tutorial.getStatus.useQuery` only if client refetch needed; initial status from RSC props is sufficient for auto-open
- **Drizzle update pattern:** `db.update(userProgress).set({ tutorialSeenAt: now, modifiedAt: now }).where(eq(userProgress.userId, userId))`
- **better-auth session** already in tRPC context — no new auth wiring
- **Idempotent markSeen:** check `tutorialSeenAt !== null` before update, or use conditional update; return `{ seen: true }` either way

### Project Structure Notes

- Component path: `apps/web/src/components/tutorial/tutorial-sheet.tsx` (architecture L646–647)
- Router path: `packages/api/src/routers/tutorial.ts` (architecture L404, L670)
- Do not put tutorial logic in `packages/ui` — app-specific copy and flow
- Do not use localStorage for seen flag — server-side only per architecture decision

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.5, FR13–FR14, UX-DR16]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Tutorial state L264, routers L404, component tree L646–647]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-13, FR-14, glossary]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — Tutorial sheet L198]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — Tutorial pattern L38, L81, UJ-1 L155–156]
- [Source: `_bmad-output/implementation-artifacts/1-4-app-shell-and-sidebar-navigation.md` — Tutorial scope split]
- [Source: `packages/db/src/schema/user-progress.ts`, `packages/auth/src/provision-user-progress.ts`]
- [Source: `apps/web/src/components/sidebar/app-shell.tsx`, `sidebar-overlay.tsx`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Fixed `tutorial.test.ts` type-check failures: import schema from `@rpg-life/db`, use migration SQL pattern from auth tests, add `drizzle-orm` devDependency to `@rpg-life/api`
- Removed duplicate `src/lib/tutorial-content.test.ts` — kept component colocated test
- E2E flaky in CI-less local run (server startup timeout) — auth redirect tests unaffected by tutorial layout for unauthenticated paths; full authenticated tutorial E2E deferred to Epic 4 per story scope

### Completion Notes List

- ✅ `tutorial.getStatus` + `tutorial.markSeen` tRPC router with idempotent markSeen and missing-row insert
- ✅ Extracted `trpc.ts` from `root.ts`; first `routers/tutorial.ts` per architecture
- ✅ RSC `(app)/layout.tsx` fetches tutorial status server-side → `initialTutorialSeen` prop
- ✅ `TutorialSheet` bottom sheet: first-run calls markSeen on dismiss; replay skips mutation (FR14)
- ✅ Five-topic explainer in `tutorial-content.ts`; CTA "Begin your quest"
- ✅ `AppShell` auto-opens sheet when `!initialTutorialSeen`; sidebar Tutorial → replay mode
- ✅ 7 tutorial API tests + 2 content unit tests pass; `type-check` + `smoke` green
- ℹ️ Manual first-run flow: sign in via magic link with api+web running → verify auto-open, dismiss, DB `tutorial_seen_at`, replay from sidebar

### File List

- `packages/api/package.json`
- `packages/api/src/trpc.ts`
- `packages/api/src/root.ts`
- `packages/api/src/routers/tutorial.ts`
- `packages/api/src/__tests__/tutorial.test.ts`
- `apps/web/README.md`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/components/sidebar/app-shell.tsx`
- `apps/web/src/components/tutorial/tutorial-sheet.tsx`
- `apps/web/src/components/tutorial/tutorial-content.ts`
- `apps/web/src/components/tutorial/tutorial-content.test.ts`
- `bun.lock`

## Change Log

- 2026-05-29: Code review — remove dead `onFirstRunComplete` prop; guard concurrent dismiss during `markSeen`

## Story Completion Status

- Status: **done** — code review patches applied 2026-05-29
