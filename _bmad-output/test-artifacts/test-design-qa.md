---
workflowStatus: 'completed'
workflowType: 'testarch-test-design'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/test-design-architecture.md
lastSaved: '2026-05-29'
---

# Test Design for QA: rpg-life MVP

**Purpose:** Test execution recipe for the builder/QA. Defines what to test, how to test it, and dependencies on architecture.

**Date:** 2026-05-29  
**Author:** Murat (TEA)  
**Status:** Draft  
**Project:** rpg-life  

**Related:** See `test-design-architecture.md` for blockers B-001–B-004 and high-priority risks.

---

## Executive Summary

**Scope:** Unit (domain), integration (tRPC + SQLite), E2E (Playwright UJ-1–4), CI gates (coverage, a11y), Docker smoke.

**Risk Summary:** 12 risks (6 high ≥6, 4 medium, 2 low). Critical: R-001 idempotency, R-002 timezone freshness.

**Coverage Summary:**

- P0: ~18 (auth scope, progression integrity, idempotency)
- P1: ~22 (core journeys, Focus rules, filters)
- P2: ~15 (edge cases, empty states, tutorial replay)
- P3: ~8 (theme, copy snapshots, exploratory)
- **Total:** ~45–63 tests

> **Note:** P0/P1/P2/P3 = priority and risk level, NOT execution timing. See Execution Strategy.

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| Story/narrative chapters | Post-MVP per PRD | Not in epics |
| Offline sync queue | Explicit non-goal | Online-only error UI tested |
| Multiplayer / shared Quests | Out of scope | N/A |
| k6 load/stress testing | Single-user MVP | E2E timing for reward modal |
| Pact contract testing | Monolithic tRPC | Type-safe routers |
| Production Resend in CI | Cost + flakiness | Mailpit/mail capture |

---

## Dependencies & Test Blockers

### Backend/Architecture Dependencies

1. **B-001 Auth test harness** — Backend — Epic 1 Story 1.3  
   - Session injection or mail capture for Playwright  
   - Blocks all authenticated E2E

2. **B-002 Idempotency columns** — Backend — Epic 3  
   - Blocks complete/reward integration and E2E

3. **B-003 SQLite test DB strategy** — Backend — Epic 1  
   - Blocks parallel integration tests

4. **B-004 Timezone contract + vectors** — Domain — Epic 3 Story 3.1  
   - Blocks signing off progression unit tests

### QA Infrastructure Setup

1. **Test data factories** — Builder  
   - `createTask`, `createUser`, `createUserWithQuests` with faker UUIDs  
   - Auto-cleanup via `afterEach` or fixture teardown

2. **Environments**  
   - Local: `docker compose up` + `bun test` + `bun run e2e`  
   - CI: GitHub Actions job matrix — unit/integration then Playwright against compose stack

**Factory pattern (integration/API):**

```typescript
import { test, expect } from 'bun:test';
import { createTaskInput } from '../factories/task';
import { appRouter } from '../../packages/api';

test('tasks.create persists quest with skills @p0', async () => {
  const caller = appRouter.createCaller(await createTestContext());
  const input = createTaskInput({ skillIds: ['concentration'] });

  const task = await caller.tasks.create(input);

  expect(task.title).toBe(input.title);
  expect(task.skills).toHaveLength(1);
});
```

**Playwright auth pattern (after B-001):**

```typescript
import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('@P0 @E2E auth gate redirects unauthenticated user', async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/board');
  await expect(page).toHaveURL(/sign-in/);
});
```

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Score | QA Test Coverage |
|---------|----------|-------------|-------|------------------|
| **R-001** | DATA | Double XP on retry | **9** | INT: double complete; E2E: complete once |
| **R-002** | DATA | Freshness timezone bugs | **9** | UNIT: 12+ vectors; INT: complete with TZ header |
| **R-003** | SEC | Cross-user access | **6** | INT: user B cannot read/mutate user A task |
| **R-004** | SEC | Client-trusted progression | **6** | INT: forged payload ignored |
| **R-005** | TECH | Auth E2E blocked | **6** | E2E: sign-in smoke with mail capture |
| **R-007** | OPS | Resend CI flakiness | **6** | CI uses Mailpit; no live API in pipeline |
| **R-009** | TECH | No factories | **6** | Factories in Epic 1; all INT/E2E use them |

### Medium/Low-Priority Risks

| Risk ID | Category | Description | Score | QA Test Coverage |
|---------|----------|-------------|-------|------------------|
| R-006 | PERF | Reward modal >1s | 4 | E2E: assert modal visible <1500ms after response |
| R-008 | BUS | Focus exploit | 4 | INT: overdue delete costs Focus |
| R-010 | OPS | SQLite parallel | 4 | CI: per-worker DB file |
| R-011 | BUS | Shame copy | 2 | Snapshot/grep banned terms in error strings |

---

## NFR Test Coverage Plan

| NFR Category | Requirement / Threshold | Planned Validation | Tool / Level | Evidence Artifact | Priority |
|--------------|-------------------------|-------------------|--------------|-------------------|----------|
| Security | Auth gate; user-scoped data | Unauthenticated redirect; cross-user 403/NOT_FOUND | INT + E2E | CI test report | P0 |
| Security | No client XP/Focus writes | API rejects invalid progression payloads | INT | Domain/router tests | P0 |
| Performance | Reward modal ≤1s (NFR3) | Time from complete response to modal visible | E2E Playwright | CI timing log | P1 |
| Reliability | Retry UI on failure (NFR2) | Network abort on mutation | E2E + MSW | Playwright report | P1 |
| Maintainability | ≥70% coverage (NFR9) | Coverage gate on PR | CI `bun test --coverage` | coverage-summary.json | P0 |
| Accessibility | Zero critical WCAG (NFR4) | axe on auth, board, complete, profile | Playwright + axe | a11y-report.json | P0 |
| Deployment | docker compose up (NFR11) | Smoke script post-compose | CI shell | compose-smoke.log | P1 |

**Missing thresholds:** API P95 latency, session expiry — defer to `nfr-assess`.

---

## Entry Criteria

- [ ] Epic 1 scaffold + docker-compose running
- [ ] B-001 auth harness available
- [ ] B-003 test DB helper merged
- [ ] Factories module exists
- [ ] Resend/Mailpit wired for dev and CI

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] P1 tests ≥95% pass or waived with owner
- [ ] Coverage ≥70% meaningful (NFR9)
- [ ] ≥5 Playwright specs passing (NFR10)
- [ ] Zero critical a11y violations (SC5)
- [ ] No open R-001/R-002 mitigations incomplete

---

## Test Coverage Plan

### P0 (Critical)

**Criteria:** Blocks core functionality + high risk (≥6) + no workaround

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P0-001** | Unauthenticated user redirected from app routes | E2E | R-003 | Auth gate |
| **P0-002** | `tasks.list` scoped to authenticated user | INT | R-003 | Negative: other user's ID |
| **P0-003** | Complete with 0 skills rejected | INT | R-004 | BAD_REQUEST |
| **P0-004** | Double complete does not double XP | INT | R-001 | Idempotent payload |
| **P0-005** | Freshness: dated quest full XP through due date | UNIT | R-002 | Vector table |
| **P0-006** | Freshness: undated decay never below minFreshness | UNIT | R-002 | Vector table |
| **P0-007** | XP split evenly across 1–3 skills | UNIT | R-004 | Domain |
| **P0-008** | Focus cap `3 + floor(heroLevel/3)` enforced | UNIT | R-004 | Domain |
| **P0-009** | Focus spend rejected when balance < 1 | INT | R-008 | Actionable error |
| **P0-010** | Magic link sign-in establishes session | E2E | R-005 | UJ-1 prerequisite |
| **P0-011** | Quest create → appears on board | E2E | — | UJ-1 |
| **P0-012** | Quest complete → reward modal | E2E | R-001 | UJ-2 |
| **P0-013** | Profile shows all 7 skills | E2E | — | UJ-3 |
| **P0-014** | Coverage gate ≥70% | CI | NFR9 | Fail build below |
| **P0-015** | axe: zero critical on core flows | E2E | NFR4 | SC5 |

**Total P0:** ~18 tests

### P1 (High)

**Criteria:** Core journeys + medium risk + common workflows

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P1-001** | Overdue filter shows only overdue open quests | E2E | — | FR2 |
| **P1-002** | Upcoming-day filter (default 7) | E2E | — | FR3 |
| **P1-003** | Edit open quest; completed not editable | INT | — | FR6 |
| **P1-004** | Soft delete excludes from list | INT | — | FR6 |
| **P1-005** | Focus earned on medium/hard complete | INT | R-004 | FR10 |
| **P1-006** | Focus reschedule overdue (UJ-4) | E2E | R-008 | FR11 |
| **P1-007** | Tutorial auto once; replay from sidebar | E2E | — | FR13–14 |
| **P1-008** | Sidebar focus trap + Esc dismiss | E2E | NFR4 | UX-DR17 |
| **P1-009** | Reward modal ≤1s | E2E | R-006 | NFR3 |
| **P1-010** | Network failure shows retry toast | E2E | NFR2 | MSW/abort |
| **P1-011** | Hero level-up banner on leveledUp | E2E | — | FR8 |
| **P1-012** | Add due date to undated costs 1 Focus | INT | R-008 | FR11 |

**Total P1:** ~22 tests

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P2-001** | Empty state "No quests yet" | E2E | — | FR4 |
| **P2-002** | Board-clear empty state | E2E | — | UX-DR20 |
| **P2-003** | Confirm complete No keeps quest open | E2E | — | FR7 |
| **P2-004** | Loading skeletons on cold load | E2E | — | UX-DR22 |
| **P2-005** | prefers-color-scheme theme | E2E | — | NFR8 |
| **P2-006** | DST boundary freshness vector | UNIT | R-002 | Extra vector |

**Total P2:** ~15 tests

### P3 (Low)

| Test ID | Requirement | Test Level | Notes |
|---------|-------------|------------|-------|
| **P3-001** | Banned shame copy not in UI strings | UNIT | Grep/snapshot |
| **P3-002** | Skill icon map renders 7 skills | Component | Optional |
| **P3-003** | README setup steps valid | Manual | SC6 |

**Total P3:** ~8 tests

---

## Execution Strategy

**Philosophy:** Run all fast tests on every PR. Defer only expensive suites.

### Every PR (~8–15 min)

- `bun test` — domain unit + API integration (parallel workers with isolated DB)
- Lint + typecheck
- Coverage gate ≥70%
- Playwright E2E (5+ specs) against docker-compose — parallel 2–4 workers
- axe-core step on P0 flows

### Nightly (optional, post-MVP)

- Extended E2E regression (P2/P3 full suite if PR time grows)

### Weekly

- Manual README/docker smoke audit
- Dependency audit (`npm/bun audit`)

**Manual (excluded from automation):** Resend production deliverability, VPS deployment verification.

---

## QA Effort Estimate

| Priority | Count | Effort Range | Notes |
|----------|-------|--------------|-------|
| P0 | ~18 | ~25–40 hours | Domain vectors, auth harness, idempotency |
| P1 | ~22 | ~20–35 hours | E2E journeys, Focus flows |
| P2 | ~15 | ~10–20 hours | Edge states, a11y polish |
| P3 | ~8 | ~2–5 hours | Copy, docs |
| **Total** | ~63 | **~57–100 hours** | Solo builder, ~2–3 weeks part-time |

**Assumptions:** Builder implements tests alongside stories; factories ready Epic 1.

---

## Implementation Planning Handoff

| Work Item | Owner | Target Milestone | Dependencies |
|-----------|-------|------------------|--------------|
| Mailpit + auth test helper | Backend | Epic 1 S1.3 | docker-compose |
| Domain freshness vectors | Domain | Epic 3 S3.1 | B-004 |
| Factory module | Builder | Epic 1 S1.1 | — |
| Playwright 5-spec suite | Builder | Epic 4 S4.1 | Epics 1–3 |
| CI coverage + a11y gate | Builder | Epic 4 S4.2–4.3 | E2E suite |
| axe-core Playwright fixture | Builder | Epic 4 S4.3 | Core flows |

---

## Tooling & Access

| Tool | Purpose | Access | Status |
|------|---------|--------|--------|
| Bun test | Unit + integration | Local/CI | Ready (post-scaffold) |
| Playwright 1.60 | E2E | Local/CI | Pending Epic 1 |
| Mailpit | Magic link capture | docker-compose | Pending B-001 |
| axe-core | A11y gate | npm devDep | Pending Epic 4 |
| GitHub Actions | CI pipeline | Repo | Pending Epic 4 |
| Resend | Dev email only | API key | Dev only |

---

## Interworking & Regression

| Component | Impact | Regression Scope | Validation |
|-----------|--------|------------------|------------|
| `packages/domain` | All progression | Full unit suite on every PR | `bun test packages/domain` |
| tRPC routers | CRUD + complete + focus | Integration suite | API tests |
| better-auth | Session on all routes | Auth E2E smoke | P0-001, P0-010 |
| Next.js rewrites | Cookie same-origin | Auth + tRPC E2E | Sign-in flow |
| Drizzle migrations | Schema changes | Migration test + integration | CI migrate step |

**Regression strategy:** Domain unit tests are the firewall; E2E covers UJ-1–4 on every PR; no epic merge without green CI.

---

## Appendix A: Tagging

```bash
# P0 only
bunx playwright test --grep @P0

# Security-focused
bunx playwright test --grep @Security

# Domain vectors
bun test packages/domain --grep @p0
```

---

## Appendix B: Knowledge Base References

- `risk-governance.md`, `probability-impact.md`, `test-levels-framework.md`, `test-priorities-matrix.md`, `test-quality.md`, `nfr-criteria.md`, `email-auth.md`

---

**Generated by:** BMad TEA Agent | **Workflow:** `bmad-testarch-test-design`
