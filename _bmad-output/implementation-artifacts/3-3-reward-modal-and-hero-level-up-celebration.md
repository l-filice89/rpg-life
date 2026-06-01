---
baseline_commit: b810eb0
---

# Story 3.3: Reward Modal and Hero Level-Up Celebration

Status: ready-for-dev

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

- [ ] **Task 1: `RewardModal` component** (AC: #1–#4, #6–#9)
  - [ ] Create `apps/web/src/components/modals/RewardModal.tsx` — `"use client"`
  - [ ] Props: `open`, `onOpenChange`, `payload: RewardPayload`, `onContinue`
  - [ ] Layout (standard reward — when `!payload.leveledUp` or as first beat):
    - Headline: **"Quest complete!"**
    - Per-skill rows: `SkillChip` + XP amount + animated mini `XpBar` (~400ms width transition)
    - Focus earned line when `focusEarned > 0`: e.g. **"+1 Focus"**
    - Hero section: `XpBar` with `heroXpProgress` from refreshed profile or computed from payload
    - Freshness note when `payload.freshness` present — neutral copy e.g. **"XP adjusted for timing — still counts toward your path."** (no shame language)
  - [ ] Responsive: `useSheetSide()` → Sheet on mobile, Dialog on desktop (mirror `CreateQuestSheet.tsx`)
  - [ ] Continue button — primary, min 44px touch target
  - [ ] `useReducedMotion()` hook — skip CSS transitions when true

- [ ] **Task 2: `HeroLevelUpOverlay` component** (AC: #5–#6)
  - [ ] Create `apps/web/src/components/modals/HeroLevelUpOverlay.tsx` — `"use client"`
  - [ ] Full-screen overlay when `payload.leveledUp === true`
  - [ ] Display typography: **"Level up!"** (`text-display-sm` or hero-level token)
  - [ ] Show new Hero level number
  - [ ] Subtle confetti — CSS-only or lightweight lib; **skip entirely** when reduced motion
  - [ ] Continue → dismiss overlay + call `onContinue`
  - [ ] **Replaces** standard reward layout when level-up — not stacked modals (architecture UX addendum)

- [ ] **Task 3: Orchestration in `QuestRowActions`** (AC: #4, #7)
  - [ ] Extend state machine: `idle → confirming → completing → rewarding → (levelUp?) → done`
  - [ ] On complete success: close confirm; open `RewardModal` with payload
  - [ ] If `leveledUp`: show `HeroLevelUpOverlay` instead of or after standard reward beat per UX (architecture: **replaces** standard reward layout)
  - [ ] On Continue: close modals; `router.refresh()` optional if invalidation insufficient for RSC header
  - [ ] Pass `taskId` through for potential 3.6 "last quest" detection

- [ ] **Task 4: Animated XP bars** (AC: #1, #6)
  - [ ] Extend or wrap `XpBar` with optional `animateOnMount` prop — start width 0 → target over 400ms
  - [ ] Respect `prefers-reduced-motion` — render final width immediately
  - [ ] Keep accessible `aria-valuenow` updated after animation completes

- [ ] **Task 5: Profile refresh** (AC: #7)
  - [ ] On complete mutation success (already in 3.2): `utils.profile.get.invalidate()`
  - [ ] Reward modal may fetch fresh profile via `utils.profile.get.useQuery` for accurate bar OR use payload `heroLevelAfter` + refetch
  - [ ] Quest Board header (`QuestBoardHeader`) re-renders on RSC refresh after invalidation + navigation

- [ ] **Task 6: Verify** (AC: all)
  - [ ] Manual: complete medium quest → see XP per skill, +1 Focus, hero bar
  - [ ] Manual: complete with enough XP to level → level-up overlay
  - [ ] Manual: reduced motion OS setting → no animation/confetti
  - [ ] `bun run type-check` green

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Story Completion Status

- Status: **ready-for-dev** — Ultimate context engine analysis completed - comprehensive developer guide created
- Depends on: Story 3.2 (complete mutation + RewardPayload)
- Next: Story 3.6 may hook `onContinue` for board-clear detection
