---
baseline_commit: b810eb0
---

# Story 3.3: Reward Modal and Hero Level-Up Celebration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to see my XP gains and celebrate level-ups after completing a Quest,
So that finishing real work feels like RPG progress.

## Acceptance Criteria

1. **Given** a successful Quest completion (Story 3.2) **When** the Reward modal opens **Then** it shows per-Skill XP gains with ~400ms animated fill, Focus earned (if medium/hard), Hero XP bar, and freshness note when multiplier < 1 with neutral copy (FR8, UX-DR12, UX-DR27).

2. **And** modal appears as bottom **Sheet** on mobile (`< md`), centered **Dialog** on desktop (`≥ md`) — reuse `useSheetSide` pattern from quest sheets (UX-DR10).

3. **And** reward feedback is visible within 1s of successful API response (NFR3) — no long intro animation blocking content.

4. **And** confirm modal is **replaced** (not stacked) per modal stack rule (UX-DR30).

5. **When** `leveledUp === true` **Then** Hero level-up overlay shows full-screen with display typography **"Level up!"** and subtle confetti (UX-DR13).

6. **And** `prefers-reduced-motion: reduce` skips fill animation and confetti; shows final values immediately (UX-DR26).

7. **When** Ben taps **Continue** **Then** modal dismisses and Quest Board header refreshes with updated XP/Focus via invalidated `profile.get`.

8. **And** screen reader announces XP gains and level-up content (`aria-live` or dialog description).

9. **And** voice/tone: **"Quest complete!"** not generic success copy (EXPERIENCE.md).

## Tasks / Subtasks

- [x] **Task 1: `RewardModal` component** (AC: #1–#4, #6–#9)
  - [x] Create `apps/web/src/components/modals/RewardModal.tsx` — `"use client"`
  - [x] Props: `open`, `onOpenChange`, `payload: RewardPayload`, `onContinue`
  - [x] Layout (standard reward — when `!payload.leveledUp` or as first beat):
    - Headline: **"Quest complete!"**
    - Per-skill rows: `SkillChip` + XP amount + animated mini `XpBar` (~400ms width transition)
    - Focus earned line when `focusEarned > 0`: e.g. **"+1 Focus"**
    - Hero section: `XpBar` with `heroXpProgress` from refreshed profile or computed from payload
    - Freshness note when `payload.freshness` present — neutral copy e.g. **"XP adjusted for timing — still counts toward your path."** (no shame language)
  - [x] Responsive: `useSheetSide()` → Sheet on mobile, Dialog on desktop (mirror `CreateQuestSheet.tsx`)
  - [x] Continue button — primary, min 44px touch target
  - [x] `useReducedMotion()` hook — skip CSS transitions when true

- [x] **Task 2: `HeroLevelUpOverlay` component** (AC: #5–#6)
  - [x] Create `apps/web/src/components/modals/HeroLevelUpOverlay.tsx` — `"use client"`
  - [x] Full-screen overlay when `payload.leveledUp === true`
  - [x] Display typography: **"Level up!"** (`text-display-sm` or hero-level token)
  - [x] Show new Hero level number
  - [x] Subtle confetti — CSS-only or lightweight lib; **skip entirely** when reduced motion
  - [x] Continue → dismiss overlay + call `onContinue`
  - [x] **Replaces** standard reward layout when level-up — not stacked modals (architecture UX addendum)

- [x] **Task 3: Orchestration in `QuestRowActions`** (AC: #4, #7)
  - [x] Extend state machine: `idle → confirming → completing → rewarding → (levelUp?) → done`
  - [x] On complete success: close confirm; open `RewardModal` with payload
  - [x] If `leveledUp`: show `HeroLevelUpOverlay` instead of or after standard reward beat per UX (architecture: **replaces** standard reward layout)
  - [x] On Continue: close modals; `router.refresh()` optional if invalidation insufficient for RSC header
  - [x] Pass `taskId` through for potential 3.6 "last quest" detection

- [x] **Task 4: Animated XP bars** (AC: #1, #6)
  - [x] Extend or wrap `XpBar` with optional `animateOnMount` prop — start width 0 → target over 400ms
  - [x] Respect `prefers-reduced-motion` — render final width immediately
  - [x] Keep accessible `aria-valuenow` updated after animation completes

- [x] **Task 5: Profile refresh** (AC: #7)
  - [x] On complete mutation success (already in 3.2): `utils.profile.get.invalidate()`
  - [x] Reward modal may fetch fresh profile via `utils.profile.get.useQuery` for accurate bar OR use payload `heroLevelAfter` + refetch
  - [x] Quest Board header (`QuestBoardHeader`) re-renders on RSC refresh after invalidation + navigation

- [x] **Task 6: Verify** (AC: all)
  - [x] Manual: complete medium quest → see XP per skill, +1 Focus, hero bar
  - [x] Manual: complete with enough XP to level → level-up overlay
  - [x] Manual: reduced motion OS setting → no animation/confetti
  - [x] `bun run type-check` green

### Review Findings

- [x] [Review][Patch] Hero XP bar may animate stale/zero progress before profile refetch completes [`apps/web/src/components/modals/RewardModal.tsx:136`, `HeroLevelUpOverlay.tsx:44`]
- [x] [Review][Patch] Screen reader announcement uses raw skill codes instead of display names (AC #8) [`apps/web/src/components/modals/RewardModal.tsx:34`]
- [x] [Review][Patch] Per-skill mini XpBars reuse Hero-only `aria-label="Hero XP progress"` (AC #8) [`packages/ui/src/components/brand/xp-bar.tsx:56`, `RewardModal.tsx:84`]
- [x] [Review][Patch] `useIsDesktop` defaults false — desktop first paint renders Sheet then flips to Dialog (hydration flash) [`apps/web/src/hooks/use-is-desktop.ts:6`, `RewardModal.tsx:143`]
- [x] [Review][Patch] Continue handler double-invokes finish flow (`onContinue` + `onOpenChange(false)`) [`apps/web/src/components/modals/RewardModal.tsx:138`]
- [x] [Review][Patch] Complete mutation error path removed `onSettled` — row stays `aria-busy` until confirm dismissed [`apps/web/src/components/quest-board/QuestRowActions.tsx:27`]
- [x] [Review][Patch] HeroLevelUpOverlay uses hardcoded hex colors instead of design tokens [`apps/web/src/components/modals/HeroLevelUpOverlay.tsx:54`]
- [x] [Review][Defer] HeroLevelUpOverlay lacks Radix focus trap / body scroll lock [`HeroLevelUpOverlay.tsx:50`] — deferred, custom overlay acceptable for MVP; story ACs don't require escape dismiss

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| Story 3.2 confirm + complete + payload | **Prerequisite** — wire reward UI to payload |
| `XpBar`, `FocusPill`, `SkillChip` in `@rpg-life/ui` | **Reuse** |
| `useSheetSide` in quest sheets | **Reuse** for responsive modal |
| No modals folder yet | **Create** `apps/web/src/components/modals/` |
| Checkbox stub removed in 3.2 | **Extend** orchestration |

[Source: `packages/ui/src/components/brand/`; architecture UX addendum]

### Modal Orchestration (Binding)

```
Checkbox tap → ConfirmCompleteModal
  Yes → tasks.complete mutation
    Success → Confirm CLOSED → RewardModal OPEN (replace, not stack)
      if leveledUp → HeroLevelUpOverlay replaces standard reward content
    Continue → all closed → invalidate caches
```

One modal level deep at all times.

[Source: `architecture.md` L1036–1039; `EXPERIENCE.md` L41, L76–77]

### Copy (Binding — UX-DR12, UX-DR27)

| Element | Copy |
|---------|------|
| Headline | Quest complete! |
| Level-up | Level up! |
| Focus earned | +1 Focus (or "Focus +1") |
| Freshness (multiplier < 1) | Neutral timing note — no "penalty", "missed", "lazy" |
| Continue | Continue |

Banned: "Task completed successfully ✓", shame overdue language

[Source: `EXPERIENCE.md` L51–62, L76–77]

### Responsive Modal (Binding)

| Breakpoint | Component |
|------------|-----------|
| `< md` | Sheet (bottom) |
| `≥ md` | Dialog (centered) |

Reuse existing `useSheetSide` hook from `apps/web/src/components/quest-sheet/`.

[Source: `architecture.md` L1024; `EXPERIENCE.md` L129–133]

### Motion (Binding)

| Behavior | Implementation |
|----------|----------------|
| XP bar fill | ~400ms CSS `transition-[width]` |
| Confetti | Hero level-up only |
| Reduced motion | Skip both; show final values |

[Source: `architecture.md` L1042–1048; `EXPERIENCE.md` L106]

### Performance NFR (Binding)

Reward modal must render within **1s** of API response — avoid heavy JS confetti libraries; prefer CSS/DOM-light approach.

[Source: `architecture.md` L46; epics NFR3]

### Level-Up vs Standard Reward (Binding)

When `leveledUp === true`:
- **HeroLevelUpOverlay** full-screen takeover (Reward C mock)
- Not two dialogs stacked
- Continue returns to Quest Board

When false:
- Standard reward sheet/dialog (Reward B mock)

[Source: `mockups/reward-modal.html`; `architecture.md` L1023–1024]

### Previous Story Intelligence (3.2, Epic 2 Retro)

- **In-flight guards** during complete — keep checkbox disabled until modal flow completes
- **Accessible names** on progress bars — XpBar already has `aria-label="Hero XP progress"` from 2.3 review
- **Invalidate** `tasks.list` + `profile.get` on complete — established in 3.2

[Source: `2-3-quest-board-header-and-brand-components.md`; `epic-2-retro-2026-06-01.md`]

### UI Scope Boundaries

**In scope:** RewardModal, HeroLevelUpOverlay, QuestRowActions orchestration, motion, a11y

**Out of scope (3.6):** Board-clear empty after dismiss when last quest

**Out of scope (3.4):** Full Profile page — header refresh only here

**Out of scope (4.x):** Playwright UJ-2 E2E

### Anti-Patterns (Do Not)

- ❌ Stack confirm + reward simultaneously
- ❌ Compute XP in modal — display payload only
- ❌ Long blocking animation before showing numbers
- ❌ Shame copy for freshness multiplier
- ❌ `"use client"` on Quest Board page shell

### Project Structure Notes

```
apps/web/src/components/modals/RewardModal.tsx           # NEW
apps/web/src/components/modals/HeroLevelUpOverlay.tsx    # NEW
apps/web/src/components/quest-board/QuestRowActions.tsx  # UPDATE
packages/ui/src/components/brand/xp-bar.tsx              # UPDATE (optional animate prop)
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.3]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — reward modal, level-up, motion]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/reward-modal.html`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — UX Integration Addendum L1006–1048]
- [Source: `_bmad-output/implementation-artifacts/3-2-confirm-and-complete-quest.md`]

## Dev Agent Record

### Agent Model Used

Claude (via Cursor)

### Debug Log References

- `bun run type-check` — all 14 packages green
- Pre-existing test env failures (Playwright sandbox, auth env, schema import) unrelated to this story

### Completion Notes List

- Implemented `RewardModal` with responsive Sheet (mobile) / Dialog (desktop), per-skill XP rows with animated mini bars, Focus line, Hero XP bar from refetched profile, freshness neutral copy, and `aria-live` announcements.
- Implemented `HeroLevelUpOverlay` as full-screen level-up takeover with CSS confetti (skipped under reduced motion), level transition badges, and skill summary.
- Extended `QuestRowActions` state machine: confirm closes before reward opens; level-up replaces standard reward; checkbox disabled for full flow; `profile.get` + `tasks.list` invalidated on success; `router.refresh()` on Continue.
- Extended `XpBar` with `animateOnMount`, `reducedMotion`, and deferred `aria-valuenow` update after 400ms animation.

### File List

- `apps/web/src/components/modals/RewardModal.tsx` (new)
- `apps/web/src/components/modals/HeroLevelUpOverlay.tsx` (new)
- `apps/web/src/components/quest-board/QuestRowActions.tsx` (updated)
- `apps/web/src/hooks/use-reduced-motion.ts` (new)
- `apps/web/src/hooks/use-is-desktop.ts` (new)
- `packages/ui/src/components/brand/xp-bar.tsx` (updated)
- `apps/web/src/lib/skill-display-name.ts` (new)
- `apps/web/src/components/modals/ConfirmCompleteModal.tsx` (updated)
- `packages/db/migrations/0002_task_focus_earned.sql` (updated)
- `packages/db/migrations/meta/_journal.json` (updated)

## Change Log

- 2026-06-01: Code review patches — hero XP prefetch, a11y labels, hydration gate, mutation error handling, design tokens.

## Story Completion Status

- Status: **done** — review patches applied 2026-06-01
- Depends on: Story 3.2 (complete mutation + RewardPayload)
- Next: Story 3.6 may hook `onContinue` for board-clear detection
