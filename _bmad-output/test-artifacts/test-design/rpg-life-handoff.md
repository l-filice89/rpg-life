---
title: 'TEA Test Design → BMAD Handoff Document'
version: '1.0'
workflowType: 'testarch-test-design-handoff'
sourceWorkflow: 'testarch-test-design'
generatedBy: 'TEA Master Test Architect (Murat)'
generatedAt: '2026-05-29'
projectName: 'rpg-life'
---

# TEA → BMAD Integration Handoff

## Purpose

Bridges TEA system-level test design with BMAD epic/story execution. Quality requirements, risks, and test strategies should flow into story acceptance criteria and Epic 4 ship gates.

## TEA Artifacts Inventory

| Artifact | Path | BMAD Integration Point |
|----------|------|------------------------|
| Architecture Test Design | `_bmad-output/test-artifacts/test-design-architecture.md` | Pre-implementation blockers, ASRs, NFR testability |
| QA Test Design | `_bmad-output/test-artifacts/test-design-qa.md` | Story test requirements, CI recipe |
| Progress / workflow state | `_bmad-output/test-artifacts/test-design-progress.md` | Resume test design workflow |

## Epic-Level Integration Guidance

### Risk References (Epic Quality Gates)

| Epic | P0/P1 Risks to Gate | Recommended Quality Gate |
|------|---------------------|--------------------------|
| **Epic 1: Enter the Realm** | R-005, R-007, R-009 | Auth E2E smoke passes in CI; Mailpit wired; factories exist |
| **Epic 2: Plan Quests** | R-003 | Integration tests prove user-scoped CRUD; cross-user negative tests |
| **Epic 3: Complete & Progress** | R-001, R-002, R-004, R-008 | Domain vectors 100%; idempotent complete INT test; Focus rules INT |
| **Epic 4: Ship MVP** | All P0 | ≥70% coverage, ≥5 E2E, zero critical a11y, docker smoke |

### Quality Gates per Epic

- **Epic 1 exit:** B-001, B-003 resolved; P0-001 auth gate test exists (may skip until harness)
- **Epic 2 exit:** P0-002, P1-003, P1-004 passing
- **Epic 3 exit:** P0-004–P0-009, P0-012, P1-005, P1-006 passing
- **Epic 4 exit:** All SC1–SC6 verification tests green in CI

## Story-Level Integration Guidance

### P0/P1 Test Scenarios → Story Acceptance Criteria

| Story | Must-add acceptance criteria (from test design) |
|-------|------------------------------------------------|
| 1.1 Scaffold | SQLite test DB helper; factory module stub; Mailpit in compose |
| 1.3 Magic Link | Test auth harness documented; P0-010 automatable |
| 3.1 Domain + schema | ≥12 freshness vectors; idempotency columns; P0-005–P0-008 |
| 3.2 Complete flow | P0-004 double-complete INT test; P0-012 E2E reward |
| 4.1 Playwright suite | NFR10: 5 specs — auth, create, complete+reward, profile, focus/filter |
| 4.2 CI pipeline | NFR9: coverage ≥70% fail gate |
| 4.3 A11y gate | SC5: axe zero critical on 4 flows |

### Data-TestId Requirements

Recommend stable selectors for E2E (add during Epic 1–2 UI work):

| Surface | Suggested test id / role |
|---------|--------------------------|
| FAB | `data-testid="fab-create-quest"` |
| Quest row checkbox | `aria-label="Complete quest: {title}"` (required UX-DR26) |
| Reward modal | `data-testid="reward-modal"` |
| Focus pill | `data-testid="focus-pill"` |
| Sidebar | `role="navigation"` + focus trap |
| Sign-in email | `data-testid="sign-in-email"` |

## Risk-to-Story Mapping

| Risk ID | Category | P×I | Recommended Story/Epic | Test Level |
|---------|----------|-----|--------------------------|------------|
| R-001 | DATA | 9 | Epic 3 Story 3.2 Complete | INT + E2E |
| R-002 | DATA | 9 | Epic 3 Story 3.1 Domain | UNIT |
| R-003 | SEC | 6 | Epic 2 Stories 2.2–2.5 | INT |
| R-004 | SEC | 6 | Epic 3 Story 3.1 Domain | UNIT + INT |
| R-005 | TECH | 6 | Epic 1 Story 1.3 Auth | E2E |
| R-007 | OPS | 6 | Epic 1 Story 1.1 Infra | CI/DevOps |
| R-009 | TECH | 6 | Epic 1 Story 1.1 Infra | All |
| R-006 | PERF | 4 | Epic 3 Story 3.2 + Epic 4 | E2E |
| R-008 | BUS | 4 | Epic 3 Story 3.5 Focus | INT + E2E |

## Recommended BMAD → TEA Workflow Sequence

1. **TEA Test Design (TD)** — complete (this handoff)
2. **BMAD Dev Story / Sprint** — implement with blockers B-001–B-004 first
3. **TEA ATDD (AT)** — generate failing acceptance tests per epic before dev
4. **TEA Framework (TF)** — if Playwright/CI scaffold needs formal setup (Epic 1)
5. **TEA Automate (TA)** — expand suite during Epics 2–4
6. **TEA Trace (TR)** — gate before MVP ship (Epic 4)

## Phase Transition Quality Gates

| From Phase | To Phase | Gate Criteria |
|------------|----------|---------------|
| Test Design | Epic 1 implementation | B-001–B-004 owners assigned |
| Epic 1 | Epic 2 | Auth harness + test DB + factories ready |
| Epic 3 | Epic 4 | R-001, R-002 mitigated; domain vectors green |
| Implementation | MVP ship | P0 100%, coverage ≥70%, 5 E2E, a11y zero critical |
