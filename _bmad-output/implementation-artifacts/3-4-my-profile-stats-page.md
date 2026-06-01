---
baseline_commit: b810eb0
---

# Story 3.4: My Profile Stats Page

Status: ready-for-dev

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

- [ ] **Task 1: Extend `ProfileSummary` type + repository** (AC: #1–#2)
  - [ ] Extend return type:
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
  - [ ] Update `getProfileSummary` in `packages/db/src/repositories/profile.ts`:
    - Join `skills` catalog (7 rows) LEFT JOIN `user_skills` on user
    - Always return 7 skills; `xp: 0`, `level: 0` when no row
    - Use `@rpg-life/domain` for `computeSkillLevel`, skill xp progress helper (add `skillXpProgress` to domain if needed — mirror hero pattern)
    - Sort by `skills.sort_order`

- [ ] **Task 2: Update `profile.get` router** (AC: #2)
  - [ ] No router logic change if repository returns extended shape — ensure exported from `@rpg-life/api`

- [ ] **Task 3: `ProfileStats` RSC components** (AC: #1, #5–#6)
  - [ ] Create `apps/web/src/components/profile/ProfileStats.tsx` — server component
  - [ ] Hero block: `text-hero-level` "Hero Lv {n}", `XpBar`, `FocusPill`
  - [ ] Skills section heading: **"Skills"** or **"Your constellation"** (muted section label)
  - [ ] Create `apps/web/src/components/profile/SkillXpBar.tsx` — server component
    - Skill icon (Lucide via `iconKey` from seed) + display name + level + `XpBar`
  - [ ] Grid: `grid-cols-1 lg:grid-cols-2 gap-4` at large breakpoint

- [ ] **Task 4: Profile page RSC** (AC: #3–#4)
  - [ ] Update `apps/web/src/app/(app)/profile/page.tsx`:
    - Remove placeholder copy
    - `await trpc.profile.get()` via server caller (mirror quest-board page)
    - Wrap in `<Suspense fallback={<ProfileSkeleton />}>`
  - [ ] Create `apps/web/src/app/(app)/profile/loading.tsx` — skeleton Hero bar + 7 skill bar placeholders
  - [ ] Keep `profile/error.tsx` if exists or add retry boundary

- [ ] **Task 5: Skill icons** (AC: #1)
  - [ ] Create `apps/web/src/lib/skill-icons.ts` OR `packages/ui/src/skill-icons.ts` — map `iconKey` → Lucide component (Story 2.1 seed: Target, HeartPulse, BookOpen, Users, LayoutList, Shield, Hammer)
  - [ ] Follow architecture: icon map in ui package if reusable

- [ ] **Task 6: Tests** (AC: #7)
  - [ ] Extend `packages/api/src/__tests__/profile-get.test.ts`:
    - New user → 7 skills all xp 0, level 0
    - User with one skill xp → that skill non-zero, others zero
    - Skills ordered by sort_order
  - [ ] Update test expectations for extended `ProfileSummary`

- [ ] **Task 7: Verify** (AC: all)
  - [ ] Manual UJ-3: complete quest → sidebar → Profile → see updated XP
  - [ ] `bun run type-check` + `bun run smoke` green

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Story Completion Status

- Status: **ready-for-dev** — Ultimate context engine analysis completed - comprehensive developer guide created
- Depends on: Story 3.1 (domain levels); benefits from 3.2 (XP data exists for manual QA)
- Next: Story 3.5 (Focus spend); 3.6 optional Profile link
