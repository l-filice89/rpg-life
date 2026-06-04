---
baseline_commit: c664fe0
---

# Story 4.3: Accessibility Audit Gate

Status: ready-for-dev

## Story

As a **builder**,
I want automated accessibility checks on core flows,
So that the MVP ships with zero critical WCAG violations.

## Acceptance Criteria

1. **Given** auth, Quest Board, complete/reward, and Profile flows implemented **When** automated a11y scan runs (axe-core in Playwright) **Then** **zero critical WCAG violations** are reported (SC5, UX-DR26).

2. **And** audited surfaces include: sign-in page, Quest Board (with quests), confirm complete modal, reward modal, Profile page, and sidebar navigation.

3. **And** failures block merge until resolved (enforced by CI job from Story 4.2).

4. **And** `bun run type-check` remains green after adding test utilities.

## Tasks / Subtasks

- [ ] **Task 1: Install axe-core Playwright integration** (AC: #1)
  - [ ] `cd apps/web && bun add -d @axe-core/playwright`
  - [ ] Verify `@axe-core/playwright` is listed in `apps/web/package.json` devDependencies
  - [ ] No changes to `playwright.config.ts` needed — axe runs within existing spec files

- [ ] **Task 2: Shared a11y helper** (AC: #1–#2)
  - [ ] Create `apps/web/e2e/helpers/axe.ts` — thin wrapper around `@axe-core/playwright`
  - [ ] Helper: `checkA11y(page, context?)` — runs `AxeBuilder({ page }).analyze()`, filters to `violations` with impact `critical`, throws if any critical violations found with human-readable message listing violation ids + help URLs
  - [ ] Critical-only filter: `violations.filter(v => v.impact === 'critical')`
  - [ ] Print full violation details on failure (id, description, nodes, help URL)

- [ ] **Task 3: A11y spec — Auth page** (AC: #2)
  - [ ] Create `apps/web/e2e/a11y.spec.ts`
  - [ ] Test: navigate to `/sign-in` → `checkA11y(page, 'sign-in page')`
  - [ ] Audits: email input label, button accessible name, heading hierarchy, color contrast (via axe)

- [ ] **Task 4: A11y spec — Quest Board** (AC: #2)
  - [ ] In `a11y.spec.ts`, use authenticated fixture from Story 4.1
  - [ ] Seed ≥1 open Quest before audit
  - [ ] Navigate to `/quest-board` → `checkA11y(page, 'quest board with quests')`
  - [ ] Audits: landmark structure, checkbox aria-labels ("Complete quest: {title}"), FAB accessible name, focus pill, XP bar role, list semantics on quest rows

- [ ] **Task 5: A11y spec — Confirm complete modal** (AC: #2)
  - [ ] Extend `a11y.spec.ts` authenticated flow
  - [ ] Click quest checkbox → wait for confirm modal → `checkA11y(page, 'confirm complete modal')`
  - [ ] Audits: dialog role, focus trap, Yes/No button labels, modal heading

- [ ] **Task 6: A11y spec — Reward modal** (AC: #2)
  - [ ] Click Yes in confirm modal → wait for reward modal visible → `checkA11y(page, 'reward modal')`
  - [ ] Audits: modal role, screen-reader-readable XP values, Focus pill label, Continue button label
  - [ ] Click Continue to dismiss and return to Quest Board

- [ ] **Task 7: A11y spec — Profile page** (AC: #2)
  - [ ] Navigate to `/profile` → `checkA11y(page, 'profile page')`
  - [ ] Audits: heading hierarchy, XP bar roles, Skill XP bars labeled, Focus balance label

- [ ] **Task 8: A11y spec — Sidebar navigation** (AC: #2)
  - [ ] On Quest Board, open sidebar (hamburger) → wait for sidebar visible → `checkA11y(page, 'sidebar navigation open')`
  - [ ] Audits: sidebar dialog role, focus trap, nav link labels (Quest Board, My Profile, Tutorial), Esc close behavior
  - [ ] Close sidebar before continuing

- [ ] **Task 9: Fix any critical violations found** (AC: #1, #3)
  - [ ] Run `checkA11y` locally during development; fix all `critical` violations before marking story done
  - [ ] Common expected issues to pre-check:
    - Missing `aria-label` on XpBar/FocusPill SVG/div elements
    - Missing `role="dialog"` or `aria-labelledby` on shadcn Sheet/Dialog
    - Quest checkbox missing associated label
    - Color contrast failures on muted text (if any — check with axe)
  - [ ] Reference UX-DR26 for the full a11y checklist (semantic HTML, focus rings, ARIA labels, reduced motion)
  - [ ] Do NOT downgrade violations to `serious` to pass — fix the root cause

- [ ] **Task 10: Verify no regressions in existing Playwright specs** (AC: #4)
  - [ ] Run full Playwright suite: `cd apps/web && bunx playwright test`
  - [ ] All existing specs from Story 4.1 + new a11y specs must pass

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `apps/web/e2e/auth.spec.ts` | **Keep** — add a11y check as additional test within it |
| E2E fixtures from Story 4.1 | **Use** — authenticated fixture required |
| `@axe-core/playwright` | **Install** — not yet present |
| UX-DR26 a11y requirements | **Validate** — this story closes the a11y gate |

[Source: `_bmad-output/planning-artifacts/epics.md` UX-DR26, SC5]

### A11y Helper Pattern

```typescript
// apps/web/e2e/helpers/axe.ts
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function checkA11y(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter(v => v.impact === 'critical');

  if (critical.length > 0) {
    const details = critical.map(v => `
  [${v.id}] ${v.description}
  Help: ${v.helpUrl}
  Nodes: ${v.nodes.map(n => n.target.join(', ')).join(' | ')}`
    ).join('\n');

    throw new Error(
      `${critical.length} critical a11y violation(s) on "${context}":\n${details}`
    );
  }
}
```

Usage in spec:
```typescript
import { checkA11y } from './helpers/axe';

test('quest board has no critical a11y violations', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/quest-board');
  await authenticatedPage.waitForLoadState('networkidle');
  await checkA11y(authenticatedPage, 'quest board');
});
```

### Known A11y Requirements (UX-DR26 Checklist)

From UX-DR26 and Epic 3 retro deferred items:

| Surface | Requirement | Status |
|---------|-------------|--------|
| Quest Board | Semantic list for quest rows | Implemented (Story 2.2) |
| Checkbox | `aria-label="Complete quest: {title}"` | Implemented (Story 3.2) |
| Reward modal | Screen reader announces content | Implemented (Story 3.3) |
| Sidebar | Focus trap while open + Esc close | Implemented (Story 1.4) |
| Sheets/Modals | Focus trap | Implemented via shadcn |
| Forms | Visible labels on Create/Edit + auth | Implemented (Stories 1.3, 2.4) |
| Level-up overlay | Focus trapping | ⚠️ Deferred T3 — fix in this story |
| Animation | `prefers-reduced-motion` disables fill + confetti | Implemented (Story 3.3) |
| FAB | Accessible name | Check: may need `aria-label="Create quest"` |
| XP bars | Role/label | Check: may need `role="progressbar"` + `aria-label` |
| Focus pill | Label | Check: may need `aria-label="Focus balance: {n}"` |

**Priority fixes** (likely to surface as axe critical violations):
1. XpBar `<div>` elements without `role="progressbar"` and `aria-valuenow`/`aria-valuemax`/`aria-label`
2. FAB button without explicit `aria-label` (icon-only button)
3. Level-up overlay focus trap (deferred T3 from Epic 3 retro)

[Source: `_bmad-output/planning-artifacts/epics.md` UX-DR26; `epic-3-retro-2026-06-04.md` T3]

### Axe Impact Levels

Only `critical` violations block merge per AC. Axe impact levels:
- `critical` — blocks AC (e.g., missing form labels, images without alt, empty buttons)
- `serious` — strongly recommended fixes but don't block this story
- `moderate` / `minor` — informational only

Record any `serious` violations in Dev Notes for future sprint.

### Spec File Structure

All a11y tests consolidated in one file for clarity:
```
apps/web/e2e/
  a11y.spec.ts          # NEW — full a11y audit suite
  helpers/
    axe.ts              # NEW — checkA11y helper
```

`a11y.spec.ts` outline:
```typescript
test.describe('Accessibility audit — unauthenticated', () => {
  test('sign-in page — zero critical violations');
});

test.describe('Accessibility audit — authenticated', () => {
  test.use({ storageState: 'e2e/.auth/user.json' }); // from Story 4.1 fixture
  test('quest board — zero critical violations');
  test('confirm complete modal — zero critical violations');
  test('reward modal — zero critical violations');
  test('profile page — zero critical violations');
  test('sidebar navigation — zero critical violations');
});
```

### Anti-Patterns (Do Not)

- ❌ Do NOT filter out violations by rule ID to make tests pass — fix the root cause
- ❌ Do NOT run axe with `disableRules(['color-contrast'])` unless color contrast is genuinely exempt (dark/light mode — if axe false-positives on theme tokens, exclude specific selector, not entire rule)
- ❌ Do NOT wait for full page network idle before axe if it causes timeout — `waitForLoadState('domcontentloaded')` is sufficient
- ❌ Do NOT audit pages mid-animation — wait for transitions to settle before running axe

### Project Structure

```
apps/web/
  e2e/
    a11y.spec.ts          # NEW
    helpers/
      axe.ts              # NEW
  package.json            # UPDATE — add @axe-core/playwright devDependency
```

UI component fixes (likely):
```
apps/web/src/components/
  quest-board/XpBar.tsx                   # UPDATE — add progressbar role/aria attrs
  quest-board/QuestBoardFab.tsx          # UPDATE — add aria-label if missing
  quest-board/QuestBoardHeader.tsx       # UPDATE — add FocusPill aria-label
  reward-modal/RewardModal.tsx           # VERIFY — screen reader flow
  hero-levelup/HeroLevelUpOverlay.tsx    # UPDATE — close focus trap deferred item
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.3, SC5, UX-DR26, NFR4]
- [Source: `_bmad-output/implementation-artifacts/epic-3-retro-2026-06-04.md` — T3 level-up a11y deferred]
- [Source: `_bmad-output/implementation-artifacts/4-1-playwright-e2e-test-suite.md` — auth fixture]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-06-04: Story 4.3 — accessibility audit gate context created

## Story Completion Status

- Status: **ready-for-dev**
- Depends on: Story 4.1 (authenticated fixture), Story 4.2 (CI wiring for gate enforcement)
- Next: Story 4.4 (Docker deployment verification)
