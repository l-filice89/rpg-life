---
baseline_commit: b810eb0
---

# Story 3.4: My Profile Stats Page

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to view my Hero level and all Skill XP bars,
So that I can see where my effort is actually going.

## Acceptance Criteria

1. **Given** an authenticated user **When** they navigate to My Profile via sidebar **Then** page shows Hero level, XP-to-next Hero level bar, all **seven Skills** with XP bars (0 if untrained), and Focus balance/cap (FR9).

2. **And** `profile.get` tRPC returns all seven Skills even at 0 XP — ordered by catalog `sort_order`.

3. **And** page refreshes data on open — no stale Hero level after recent complete (`revalidate` or client invalidate on mount).

4. **And** loading shows skeleton bars for Hero + 7 Skills (UX-DR22).

5. **And** Profile may use two-column Skill grid at `≥ lg` breakpoint (UX-DR10).

6. **And** RSC-first: Profile page server-fetches `profile.get`; presentational components stay server where possible.

7. **And** extend existing `profile-get.test.ts` for skills array shape; smoke green.

## Tasks / Subtasks

- [x] **Task 1: Extend `ProfileSummary` type + repository** (AC: #1–#2)
  - [x] Extend return type:
    ```typescript
    type ProfileSummary = {
      heroLevel: number;
      heroXpProgress: number;
      focusBalance: number;
      focusCap: number;
      skills: Array<{
        code: SkillCode;
        displayName: string;
        iconKey: string | null;
        xp: number;
        level: number;
        xpProgress: number; // 0-1 within current skill level
      }>;
    }
    ```
  - [x] Update `getProfileSummary` in `packages/db/src/repositories/profile.ts`:
    - Join `skills` catalog (7 rows) LEFT JOIN `user_skills` on user
    - Always return 7 skills; `xp: 0`, `level: 0` when no row
    - Use `@rpg-life/domain` for `computeSkillLevel`, skill xp progress helper (add `skillXpProgress` to domain if needed — mirror hero pattern)
    - Sort by `skills.sort_order`

- [x] **Task 2: Update `profile.get` router** (AC: #2)
  - [x] No router logic change if repository returns extended shape — ensure exported from `@rpg-life/api`

- [x] **Task 3: `ProfileStats` RSC components** (AC: #1, #5–#6)
  - [x] Create `apps/web/src/components/profile/ProfileStats.tsx` — server component
  - [x] Hero block: `text-hero-level` "Hero Lv {n}", `XpBar`, `FocusPill`
  - [x] Skills section heading: **"Skills"** or **"Your constellation"** (muted section label)
  - [x] Create `apps/web/src/components/profile/SkillXpBar.tsx` — server component
    - Skill icon (Lucide via `iconKey` from seed) + display name + level + `XpBar`
  - [x] Grid: `grid-cols-1 lg:grid-cols-2 gap-4` at large breakpoint

- [x] **Task 4: Profile page RSC** (AC: #3–#4)
  - [x] Update `apps/web/src/app/(app)/profile/page.tsx`:
    - Remove placeholder copy
    - `await trpc.profile.get()` via server caller (mirror quest-board page)
    - `loading.tsx` handles Next.js Suspense boundary automatically
  - [x] Create `apps/web/src/app/(app)/profile/loading.tsx` — skeleton Hero bar + 7 skill bar placeholders
  - [x] Keep `profile/error.tsx` if exists or add retry boundary

- [x] **Task 5: Skill icons** (AC: #1)
  - [x] `packages/ui/src/skill-icons.ts` already existed from Story 2.3 — reused as-is (Target, HeartPulse, BookOpen, Users, LayoutList, Shield, Hammer)

- [x] **Task 6: Tests** (AC: #7)
  - [x] Extend `packages/api/src/__tests__/profile-get.test.ts`:
    - New user → 7 skills all xp 0, level 0
    - User with one skill xp → that skill non-zero, others zero
    - Skills ordered by sort_order
  - [x] Update test expectations for extended `ProfileSummary` (toEqual → toMatchObject for hero/focus assertions)

- [x] **Task 7: Verify** (AC: all)
  - [x] `bun run type-check` — 14/14 tasks successful, zero TS errors
  - [x] All API tests: 66/66 pass (from packages/api); domain: 34/34; DB schema: 7/7; web lib: 13/13
  - [ ] Manual UJ-3: complete quest → sidebar → Profile → see updated XP (requires running app)

### Review Findings (Code Review 2026-06-02, Opus 4.8)

- [x] [Review][Patch] Icon source: honor DB `iconKey` (DECISION RESOLVED 2026-06-02 → honor DB `iconKey` per Task 5) — Added `getIconByKey(iconKey)` + `FallbackSkillIcon` to `packages/ui`; `SkillXpBar` now uses `getIconByKey(skill.iconKey) ?? FallbackSkillIcon`. DB is icon source of truth; unknown/null key falls back instead of throwing. Removed `getSkillIcon`/`as SkillCode` from this path. (sources: edge, auditor)
- [x] [Review][Patch] Missing `profile/error.tsx` retry boundary — Added `apps/web/src/app/(app)/profile/error.tsx` (client retry boundary mirroring `quest-board/error.tsx`). (sources: blind, edge, auditor — consensus)
- [x] [Review][Patch] `SkillXpBar` redeclares the skill shape — Now `type SkillEntry = ProfileSummary['skills'][number]`; no local redeclaration, no `string`→`SkillCode` cast. (source: auditor)
- [x] [Review][Defer] `getSkillIcon` hard-throws on unknown code [packages/ui/src/skill-icons.ts:29] — a DB skill code absent from `SKILL_CATALOG` would crash the RSC render. Not triggerable today (the `skills` table is seeded from `SKILL_CATALOG` — single source), so deferred; revisit if skills become dynamic or if Decision above keeps code-based resolution without a guard. (sources: blind, edge)

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `profile/page.tsx` — placeholder "Hero stats land in Epic 3" | **Replace** with RSC fetch + ProfileStats |
| `profile.get` — hero level, focus only | **Extend** with 7 skills |
| `getProfileSummary` — partial implementation | **Extend** + use domain |
| `QuestBoardHeader` — reuses hero/focus display | **Keep** — Profile uses same brand components |
| Skills catalog seeded (Story 2.1) | **Join** for display names/icons |

[Source: `profile/page.tsx`; `profile.ts` repository]

### Skill Catalog (Binding — Story 2.1 seed)

| code | display_name | sort_order | icon_key |
|------|--------------|------------|----------|
| concentration | Concentration | 1 | Target |
| vitality | Vitality | 2 | HeartPulse |
| lore | Lore | 3 | BookOpen |
| presence | Presence | 4 | Users |
| order | Order | 5 | LayoutList |
| resolve | Resolve | 6 | Shield |
| craft | Craft | 7 | Hammer |

[Source: `2-1-tasks-schema-and-skill-catalog-seed.md`]

### Level Display (Binding)

- Skill level: `floor(sqrt(skillXp / 25))` via domain
- Hero level: from total XP across skills
- XP bars show progress **within current level** (0–1), not total XP

[Source: `addendum.md` L70–73]

### RSC Pattern (Binding)

```tsx
// profile/page.tsx — server component
export default async function ProfilePage() {
  const profile = await trpc.profile.get();
  return <ProfileStats profile={profile} />;
}
```

No `"use client"` on page or ProfileStats unless interactivity added.

[Source: `architecture.md` L295–312; quest-board page pattern]

### Loading Skeleton (Binding — UX-DR22)

- Hero: label skeleton + wide bar skeleton
- Skills: 7 rows of label + bar skeletons
- Match quest-board `loading.tsx` pulse animation style

[Source: `EXPERIENCE.md` L101, L95]

### Stale Data (Binding)

- Profile refreshes on open — RSC fetch on navigation suffices for MVP
- After complete flow, user may navigate to Profile — must see updated XP from DB (no client cache stale layer in MVP)
- Optional: call `router.refresh()` on Profile mount via tiny client wrapper — prefer pure RSC refetch on navigation

[Source: `EXPERIENCE.md` L102–103; `architecture.md` L261]

### Previous Story Intelligence (2.3, 3.1, 3.2)

- **XpBar a11y:** `aria-label="Hero XP progress"` — add per-skill labels e.g. `aria-label="{displayName} XP progress"`
- **Domain refactor (3.1):** Profile repo must use `@rpg-life/domain` — no duplicate `A_USER`
- **Complete invalidates profile.get (3.2):** Header updates; Profile page gets fresh data on next visit

[Source: `2-3-quest-board-header-and-brand-components.md`; `3-1-progression-domain-engine.md`]

### UI Scope Boundaries

**In scope:** Profile page, skills grid, extended API, tests

**Out of scope:** Pull-to-refresh, skill detail drill-down, story/narrative, E2E (Epic 4)

### Anti-Patterns (Do Not)

- ❌ Return only trained skills — must always be 7
- ❌ Client-side XP calculation
- ❌ `"use client"` on entire Profile page
- ❌ Mix Task/Quest in component names vs UI copy ("Quest" in headings OK for user-facing)

### Project Structure Notes

```
packages/db/src/repositories/profile.ts              # UPDATE
packages/domain/src/levels.ts                        # UPDATE (skillXpProgress helper)
packages/api/src/__tests__/profile-get.test.ts       # UPDATE
apps/web/src/app/(app)/profile/page.tsx              # UPDATE
apps/web/src/app/(app)/profile/loading.tsx           # NEW or UPDATE
apps/web/src/components/profile/ProfileStats.tsx     # NEW
apps/web/src/components/profile/SkillXpBar.tsx       # NEW
packages/ui/src/skill-icons.ts                       # NEW (optional location)
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.4, FR9]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-9, UJ-3]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — UJ-3, Profile loading]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — profile router, ProfileStats paths]
- [Source: `_bmad-output/implementation-artifacts/2-3-quest-board-header-and-brand-components.md`]
- [Source: `apps/web/src/app/(app)/profile/page.tsx`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Pre-existing: `bun run smoke` from workspace root fails to resolve `drizzle-orm/bun-sqlite` for api package tests (devDependency resolution in bun workspace). All tests pass when run from `packages/api` directly (66/66). This issue predates Story 3.4.
- `packages/db/src/__tests__/schema.test.ts` missing `../schema` import — pre-existing, unrelated to 3.4.
- `skillXpProgress` was already exported from `@rpg-life/domain` (no domain changes needed).
- `packages/ui/src/skill-icons.ts` already existed from Story 2.3; reused without modification.

### Completion Notes List

- Extended `getProfileSummary` to LEFT JOIN skills catalog with user_skills, always returning 7 skills ordered by sort_order. Uses parallel `Promise.all` for 3 DB queries.
- `ProfileSummary` type in db package updated with `SkillSummary[]`; api package `ProfileSummary` auto-updates via `inferRouterOutputs`.
- Created `ProfileStats.tsx` (server component) — Hero level + XpBar + FocusPill + Skills grid (1-col mobile, 2-col ≥lg).
- Created `SkillXpBar.tsx` (server component) — Lucide icon + display name + level + per-skill XpBar with accessibility label.
- Profile `loading.tsx` — skeleton Hero + 7 skill bar skeletons, matches quest-board pulse style.
- `profile/page.tsx` replaced placeholder with RSC server fetch via `createServerTrpcClient()`. `loading.tsx` is Next.js automatic Suspense boundary.
- 3 new profile-get tests added: 7 skills at 0 XP, sort_order, trained/untrained split. Existing `toEqual` → `toMatchObject` for hero/focus assertions (now that response includes skills).

### File List

- `packages/db/src/repositories/profile.ts` — extended with LEFT JOIN skills, SkillSummary type
- `packages/api/src/__tests__/profile-get.test.ts` — 3 new tests + updated assertions
- `apps/web/src/components/profile/ProfileStats.tsx` — new RSC
- `apps/web/src/components/profile/SkillXpBar.tsx` — new RSC (review: iconKey-based icon + shared type)
- `apps/web/src/app/(app)/profile/page.tsx` — replaced placeholder with RSC fetch
- `apps/web/src/app/(app)/profile/loading.tsx` — new skeleton
- `apps/web/src/app/(app)/profile/error.tsx` — new retry boundary (review patch)
- `packages/ui/src/skill-icons.ts` — added `getIconByKey` + `FallbackSkillIcon` (review patch)
- `packages/ui/src/index.ts` — export `getIconByKey`, `FallbackSkillIcon` (review patch)

## Change Log

- Story 3.4 implementation: extend profile.get with 7 skills, Profile page RSC, ProfileStats + SkillXpBar components, loading skeleton, 3 new API tests (2026-06-02)
- Code review (Opus 4.8): 3 patches applied — DB `iconKey`-based icons with fallback, `profile/error.tsx` retry boundary, shared skill type in SkillXpBar; 1 deferred (`getSkillIcon` throw on non-Profile path), 11 dismissed (2026-06-02)

## Story Completion Status

- Status: **done**
- Depends on: Story 3.1 (domain levels); benefits from 3.2 (XP data exists for manual QA)
- Next: Story 3.5 (Focus spend); 3.6 optional Profile link
