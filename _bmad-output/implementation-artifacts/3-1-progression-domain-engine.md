---
baseline_commit: b810eb0
---

# Story 3.1: Progression Domain Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **builder**,
I want all XP, freshness, level, and Focus logic in a pure tested domain package,
So that progression is correct, secure, and never client-trusted.

## Acceptance Criteria

1. **Given** MVP progression constants from `addendum.md` **When** domain functions are implemented in `packages/domain` **Then** `computeFreshness`, `splitXpAcrossSkills`, `computeHeroLevel`, `computeSkillLevel`, and Focus cap/earn/spend rules exist as pure functions (FR8 foundation, SC2).

2. **And** co-located unit tests cover dated/undated freshness, overdue decay, minFreshness floor (0.5), idempotency inputs, and Focus cap formula `3 + floor(heroLevel / 3)` with test vectors from addendum.

3. **And** timezone-aware freshness uses **local calendar dates** per architecture contract — not server UTC midnight for day boundaries.

4. **And** domain package has **zero** imports from `@rpg-life/db`, tRPC, React, or Hono — pure TypeScript only.

5. **And** constants match addendum locked rates: `baseXp` (trivial 5, easy 10, medium 25, hard 50), `a_skill` 25, `a_user` 50, `minFreshness` 0.5, `undatedDecayPerDay` 0.02, `overdueDecayPerDay` 0.05.

6. **And** `bun test packages/domain` passes; new tests wired into root `smoke` script.

7. **And** test coverage for `packages/domain` contributes toward the 70% project gate (SC2).

## Tasks / Subtasks

- [x] **Task 1: Package structure + constants** (AC: #1, #4–#5)
  - [x] Create `packages/domain/src/constants.ts` — export `BASE_XP`, `A_SKILL`, `A_USER`, `MIN_FRESHNESS`, `UNDATED_DECAY_PER_DAY`, `OVERDUE_DECAY_PER_DAY`, `MAX_SKILLS_PER_TASK`
  - [x] Create `packages/domain/src/types.ts` — `Difficulty`, `SkillCode` (import type from validators or duplicate const union — prefer re-export from `@rpg-life/validators`), `LocalDate` as `string` (`YYYY-MM-DD`), `TaskDates`, `FreshnessResult`, `XpAwardResult`, `FocusEarnResult`
  - [x] Update `packages/domain/src/index.ts` — re-export all public API
  - [x] Add `"test": "bun test src"` to `packages/domain/package.json` if missing

- [x] **Task 2: Freshness engine** (AC: #1–#3, #5)
  - [x] Create `packages/domain/src/freshness.ts`:
    - `computeFreshness(input: { dueDate: LocalDate | null; createdAtUtc: string; completedLocalDate: LocalDate }): FreshnessResult`
    - Dated: full XP (`multiplier = 1.0`) when `completedLocalDate <= dueDate`; else overdue decay
    - Undated: decay from creation local date
    - Floor at `MIN_FRESHNESS` (0.5)
    - Return `{ multiplier, reason: 'undated_age' | 'overdue' | 'on_time', daysApplied, baseXp?, finalXp? }` — baseXp/finalXp optional here (computed in xp module)
  - [x] Create `packages/domain/src/local-date.ts` — pure helpers:
    - `utcToLocalDate(isoUtc: string, timezone: string): LocalDate`
    - `daysBetweenLocalDates(from: LocalDate, to: LocalDate): number` — calendar day diff, not 24h
  - [x] Use `Intl` or minimal date math — **no** external date library unless already in monorepo

- [x] **Task 3: XP award + split** (AC: #1, #5)
  - [x] Create `packages/domain/src/xp-award.ts`:
    - `computeXpAward(difficulty, freshnessMultiplier): number` — `max(1, floor(baseXp[difficulty] * multiplier))`
  - [x] Create `packages/domain/src/xp-split.ts`:
    - `splitXpAcrossSkills(xpAward: number, skillCodes: readonly string[]): Record<string, number>` — floor division; remainder drops (document behavior)

- [x] **Task 4: Level calculations** (AC: #1, #5)
  - [x] Create `packages/domain/src/levels.ts`:
    - `computeSkillLevel(skillXp: number): number` — `floor(sqrt(skillXp / A_SKILL))`
    - `computeHeroLevel(totalXp: number): number` — `floor(sqrt(totalXp / A_USER))`
    - `heroXpProgress(totalXp: number, heroLevel: number): number` — 0–1 fraction within current level (extract from `packages/db/src/repositories/profile.ts` logic — single source of truth moves here)
    - `xpAtHeroLevel(level: number): number` — helper for progress calc

- [x] **Task 5: Focus rules** (AC: #1–#2, #5)
  - [x] Create `packages/domain/src/focus.ts`:
    - `computeFocusCap(heroLevel: number): number` — `3 + floor(heroLevel / 3)`
    - `computeFocusEarn(difficulty, currentBalance, cap): FocusEarnResult` — +1 for medium/hard only; 0 if at cap; trivial/easy → 0
    - `canSpendFocus(balance: number, cost?: number): boolean` — cost defaults to 1
    - `FOCUS_SPEND_COST = 1` constant

- [x] **Task 6: Unit tests with test vectors** (AC: #2–#3, #6–#7)
  - [x] `freshness.test.ts` — vectors:
    - Dated, complete on due date → multiplier 1.0
    - Dated, 1 day overdue → 0.95; 10 days → floor 0.5
    - Undated, same-day complete → 1.0; day 7 → ~0.86 at 2%/day
    - minFreshness floor never below 0.5
  - [x] `levels.test.ts` — hero level 0 at 0 XP; level 4 at 800 XP; progress fraction
  - [x] `focus.test.ts` — cap at hero 0 → 3; hero 6 → 5; earn blocked at cap; medium earns +1
  - [x] `xp-split.test.ts` — 25 XP / 2 skills → 12 each; odd remainder documented
  - [x] `local-date.test.ts` — timezone boundary: UTC 23:00 vs local date in `Europe/Ljubljana`
  - [x] Wire `packages/domain/src/**/*.test.ts` into root `package.json` `smoke` script

- [x] **Task 7: Refactor profile repository to consume domain** (AC: #4)
  - [x] Update `packages/db/src/repositories/profile.ts` — import `computeHeroLevel`, `heroXpProgress`, `computeFocusCap` from `@rpg-life/domain`; remove inline `A_USER` duplicate
  - [x] Verify existing `profile-get.test.ts` still passes unchanged outputs

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 3.1 uncommitted diff vs baseline `b810eb0`._

- [x] [Review][Defer] `parseLocalDateUtc` accepts invalid calendar dates (e.g. `2026-02-31`) via JS Date.UTC rollover [`packages/domain/src/local-date.ts`:41] — deferred; align with shared date validator tracked in Epic 2 deferred-work when added

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `packages/domain/src/index.ts` — stub `export {}` | **Replace** with full domain API |
| `packages/db/src/repositories/profile.ts` — inline level/focus math | **Refactor** to import `@rpg-life/domain` |
| `tasks` schema idempotency columns (`completed_at`, `xp_awarded`, `freshness_multiplier`) | **Reuse** — Story 2.1 forward-provisioned |
| No `tasks.complete` procedure | **Defer** — Story 3.2 consumes domain |
| No `focus` router | **Defer** — Story 3.5 |

[Source: codebase read 2026-06-01; `epic-2-retro-2026-06-01.md` L148–150]

### Binding Constants (addendum.md — locked MVP)

| Constant | Value |
|----------|-------|
| `baseXp.trivial` | 5 |
| `baseXp.easy` | 10 |
| `baseXp.medium` | 25 |
| `baseXp.hard` | 50 |
| `a_skill` | 25 |
| `a_user` | 50 |
| `minFreshness` | 0.5 |
| `undatedDecayPerDay` | 0.02 |
| `overdueDecayPerDay` | 0.05 |
| Focus cap | `3 + floor(heroLevel / 3)` |
| Focus earn | +1 on medium/hard completion, capped |

[Source: `addendum.md` L7–15, L72–75]

### Freshness Algorithm (Binding)

**Dated quest** (`due_date` set):
```
daysOverdue = max(0, completedLocalDate - due_date)  // calendar days
if daysOverdue == 0: multiplier = 1.0
else: multiplier = max(minFreshness, 1 - overdueDecayPerDay * daysOverdue)
```

**Undated quest**:
```
daysSinceCreation = max(0, completedLocalDate - createdLocalDate)
multiplier = max(minFreshness, 1 - undatedDecayPerDay * daysSinceCreation)
```

**Critical:** `completedLocalDate` derived from `completed_at` UTC + client IANA `timezone` on complete (Story 3.2). Domain accepts pre-computed local dates — does not fetch timezone itself.

[Source: `addendum.md` L28–54; `architecture.md` L91–92, L286]

### Timezone Contract (Binding)

- Client sends `timezone: string` (IANA) on `tasks.complete` — Story 3.2
- Domain `local-date.ts` converts UTC ISO → local calendar date for freshness
- Test with explicit vectors — e.g. complete at `2026-06-01T23:30:00Z` in `America/Los_Angeles` → local date `2026-06-01`

[Source: `architecture.md` L233, L440–441]

### Domain Purity (Non-Negotiable)

```
packages/domain/  → NO imports from db, api, web, trpc, react
packages/api/services/  → imports domain + db
apps/web/  → NEVER imports domain directly (server services only)
```

Anti-patterns from architecture:
- ❌ XP calculation in `RewardModal.tsx`
- ❌ Freshness in tRPC router inline
- ❌ Duplicate level math in profile repo after this story

[Source: `architecture.md` L528–536, L561–568; `project-context.md`]

### File Layout (Target)

```
packages/domain/src/
  constants.ts
  types.ts
  local-date.ts
  freshness.ts
  freshness.test.ts
  xp-award.ts
  xp-split.ts
  xp-split.test.ts
  levels.ts
  levels.test.ts
  focus.ts
  focus.test.ts
  local-date.test.ts
  index.ts
```

[Source: `architecture.md` L703–714]

### Previous Story Intelligence (Epic 2 Retro)

- **Domain first gate:** Epic 3 must not start complete/reward UI until 3.1 lands — blocks 3.2 XP math
- **Idempotency columns exist** in schema — domain computes; persistence is 3.2
- **Profile.get duplicate math** — refactor in Task 7 prevents drift
- **Shared date validator** deferred from 2.4/2.5 — optional in 3.1 `local-date.ts` if calendar validation fits naturally

[Source: `epic-2-retro-2026-06-01.md` L105–109, L148–150]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `b810eb0` | Epic 2 retro — baseline for Epic 3 |
| `5c9b9e9` | Empty state — unrelated to domain |
| Story 2.1 | Idempotency columns in `tasks` schema |

### Testing Requirements

- Co-located `*.test.ts` beside source — `bun test` runner
- Deterministic — no `Date.now()` without injection; pass explicit dates in tests
- Add domain tests to root `smoke` script (Epic 2 pattern — every new test file wired)
- Target: comprehensive vectors covering edge cases (floor, cap, timezone boundary)

### Anti-Patterns (Do Not)

- ❌ Import Drizzle or SQLite in domain
- ❌ Use server UTC date for freshness day boundaries
- ❌ Hardcode constants outside `constants.ts`
- ❌ Skip profile repo refactor (duplicate math will drift)
- ❌ Add `"use client"` anywhere in domain

### Project Structure Notes

- Repo uses `packages/domain/src/` not `packages/domain/` flat — follow existing stub
- `@rpg-life/domain` workspace package — ensure `apps/api` and `packages/db` declare dependency in `package.json`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.1]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` — constants, freshness, levels, Focus]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — domain package, reward payload, enforcement]
- [Source: `_bmad-output/project-context.md` — TDD, strict TS]
- [Source: `packages/domain/src/index.ts`, `packages/db/src/repositories/profile.ts`]
- [Source: `_bmad-output/implementation-artifacts/epic-2-retro-2026-06-01.md`]

## Dev Agent Record

### Agent Model Used

Claude (Cursor Agent)

### Debug Log References

- `computeFreshness` accepts `createdLocalDate` + `completedLocalDate` (pre-computed local dates per architecture contract); `utcToLocalDate` provided for Story 3.2 service layer
- Added `skillXpProgress` helper in `levels.ts` for Story 3.4 reuse (not required by AC but zero-cost)

### Completion Notes List

- Implemented pure `@rpg-life/domain` package: constants, freshness, local-date, xp-award, xp-split, levels, focus
- 34 domain unit tests covering addendum test vectors (freshness, levels, focus, split, timezone boundaries)
- Wired 6 domain test files into root `smoke` (97 total tests passing)
- Refactored `getProfileSummary` to import hero/focus math from domain — `profile-get.test.ts` unchanged outputs
- Added `@rpg-life/domain` dependency to `packages/domain` (validators) and `packages/db`
- `bun run type-check` + `bun run smoke` green

### File List

- `packages/domain/src/constants.ts` (NEW)
- `packages/domain/src/types.ts` (NEW)
- `packages/domain/src/local-date.ts` (NEW)
- `packages/domain/src/local-date.test.ts` (NEW)
- `packages/domain/src/freshness.ts` (NEW)
- `packages/domain/src/freshness.test.ts` (NEW)
- `packages/domain/src/xp-award.ts` (NEW)
- `packages/domain/src/xp-award.test.ts` (NEW)
- `packages/domain/src/xp-split.ts` (NEW)
- `packages/domain/src/xp-split.test.ts` (NEW)
- `packages/domain/src/levels.ts` (NEW)
- `packages/domain/src/levels.test.ts` (NEW)
- `packages/domain/src/focus.ts` (NEW)
- `packages/domain/src/focus.test.ts` (NEW)
- `packages/domain/src/index.ts` (UPDATED)
- `packages/domain/package.json` (UPDATED)
- `packages/db/package.json` (UPDATED)
- `packages/db/src/repositories/profile.ts` (UPDATED)
- `package.json` (UPDATED — smoke script)
- `bun.lock` (UPDATED)

## Change Log

- 2026-06-01: Story 3.1 — progression domain engine with 34 unit tests; profile repo refactored to consume domain

- 2026-06-01: Code review — clean pass; 1 defer (calendar date validation aligns with Epic 2 deferred-work)

## Story Completion Status

- Status: **done** — code review passed (2026-06-01), all ACs verified
- Next: Story 3.2 (`tasks.complete`)
