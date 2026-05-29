---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-29'
storyId: SC.1-6
storyKey: mvp-success-criteria
storyFile: docs/success_criteria.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-mvp-success-criteria.md
tddPhase: RED
generatedTestFiles:
  - tests/e2e/auth-gate.spec.ts
  - tests/e2e/quest-create.spec.ts
  - tests/e2e/quest-complete-reward.spec.ts
  - tests/e2e/profile-refresh.spec.ts
  - tests/e2e/focus-reschedule.spec.ts
  - tests/e2e/accessibility.spec.ts
  - tests/api/tasks-list.spec.ts
  - tests/api/tasks-create.spec.ts
  - tests/api/tasks-mutate.spec.ts
  - tests/api/tasks-complete.spec.ts
  - tests/unit/domain/freshness.test.ts
  - tests/unit/domain/focus.test.ts
  - tests/unit/domain/xp.test.ts
  - tests/gates/coverage-threshold.test.ts
  - tests/gates/documentation.test.ts
  - tests/smoke/docker-compose.test.ts
inputDocuments:
  - docs/success_criteria.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/test-design-qa.md
  - _bmad-output/test-artifacts/test-design/rpg-life-handoff.md
---

# ATDD Checklist: MVP Success Criteria

**Story:** `docs/success_criteria.md` (SC1–SC6 ship gates)  
**Mode:** AI generation (sequential) — greenfield scaffold  
**TDD Phase:** RED — all tests use `test.skip()`

---

## Success Criteria Coverage

| Criterion | Requirement | Test files | Level |
|-----------|-------------|------------|-------|
| **SC1** | Working app with full Quest CRUD | `tests/api/tasks-*.spec.ts`, E2E create/complete/profile/focus | API + E2E |
| **SC2** | ≥70% meaningful coverage | `tests/unit/domain/*.test.ts`, `tests/gates/coverage-threshold.test.ts` | Unit + gate |
| **SC3** | ≥5 passing Playwright tests | 5 core E2E specs (+ a11y) | E2E |
| **SC4** | `docker compose up` works | `tests/smoke/docker-compose.test.ts` | Smoke |
| **SC5** | Zero critical WCAG violations | `tests/e2e/accessibility.spec.ts` | E2E + axe |
| **SC6** | README + AI integration log | `tests/gates/documentation.test.ts` | Gate |

---

## TDD Red Phase Summary

| Suite | Files | Tests (skipped) |
|-------|-------|-----------------|
| E2E (Playwright) | 6 | 8 |
| API (Playwright request) | 4 | 7 |
| Domain unit (bun test) | 3 | 6 |
| Gates + smoke (bun test) | 3 | 5 |
| **Total** | **16** | **26** |

All tests assert **expected** behavior and remain skipped until the matching epic/story is implemented.

---

## SC3 — Minimum 5 E2E Specs (NFR10)

| # | Spec file | Journey |
|---|-----------|---------|
| 1 | `auth-gate.spec.ts` | Unauthenticated redirect |
| 2 | `quest-create.spec.ts` | UJ-1 create quest |
| 3 | `quest-complete-reward.spec.ts` | UJ-2 complete + reward ≤1s |
| 4 | `profile-refresh.spec.ts` | UJ-3 profile stats |
| 5 | `focus-reschedule.spec.ts` | UJ-4 Focus spend |

Bonus: `accessibility.spec.ts` (SC5 gate)

---

## Activation Order (recommended)

1. **Epic 1** — Remove skip from `auth-gate.spec.ts` after B-001 harness
2. **Epic 2** — Activate `tasks-create`, `tasks-list`, `tasks-mutate`, `quest-create`
3. **Epic 3** — Activate domain unit tests, `tasks-complete`, `quest-complete-reward`, `profile-refresh`, `focus-reschedule`
4. **Epic 4** — Activate gates (coverage, docs, docker smoke, a11y)

### Per-task workflow

1. Remove `test.skip()` from the current test(s)
2. Run: `bun test` and/or `bun run test:e2e`
3. Confirm **FAIL** before implementation, **PASS** after
4. Commit green tests with the feature

---

## Blockers (from test design)

| ID | Blocks |
|----|--------|
| B-001 | All authenticated E2E |
| B-002 | `tasks-complete` idempotency tests |
| B-003 | Parallel integration (future) |
| B-004 | Domain freshness unit tests |

---

## Commands

```bash
bun install
bun test              # unit + gates + smoke (all skipped → 0 fail)
bun run test:e2e      # Playwright E2E (all skipped → 0 fail)
bun run test:api      # Playwright API tests
```

---

## Validation (Step 5)

- [x] Prerequisites: success criteria + test design loaded
- [x] Playwright config created (`playwright.config.ts`, `playwright.api.config.ts`)
- [x] All tests use `test.skip()` (RED phase)
- [x] No placeholder `expect(true).toBe(true)` assertions
- [x] SC1–SC6 each mapped to ≥1 test file
- [x] Minimum 5 E2E spec files for SC3

**Next workflow:** Implement Epic 1 Story 1.1 scaffold, then activate tests task-by-task (`dev-story`).
