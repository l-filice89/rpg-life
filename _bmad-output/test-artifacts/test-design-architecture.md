---
workflowStatus: 'completed'
workflowType: 'testarch-test-design'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/project-context.md
lastSaved: '2026-05-29'
---

# Test Design for Architecture: rpg-life MVP

**Purpose:** Architectural concerns, testability gaps, and NFR requirements for review by Architecture/Dev teams. Serves as a contract between QA and Engineering on what must be addressed before test development begins.

**Date:** 2026-05-29  
**Author:** Murat (TEA)  
**Status:** Architecture Review Pending  
**Project:** rpg-life  
**PRD Reference:** `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md`  
**ADR Reference:** `_bmad-output/planning-artifacts/architecture.md`

---

## Executive Summary

**Scope:** Full-stack habit RPG MVP — auth (magic link), Quest CRUD, server-side progression (XP freshness, Focus, Hero/Skill levels), profile, Docker deployment, CI quality gates.

**Business Context:**

- **Impact:** Personal/learning build; success = working core loop + ship gates (SC1–SC6)
- **Problem:** Gamify task completion without punitive mechanics; progression must be trustworthy
- **Target:** MVP ship via `docker compose up` with 70% coverage and 5 E2E tests in CI

**Architecture (key decisions):**

- **Stack:** Next.js 15 RSC + Bun/Hono/tRPC + SQLite/Drizzle + better-auth + Resend
- **Domain isolation:** Pure functions in `packages/domain`; all XP/Focus logic server-side
- **Auth:** Session cookie via magic link; Next.js rewrites for same-origin cookies

**Expected Scale:** Single-user learning project; no multi-tenant or high-RPS SLO defined.

**Risk Summary:**

- **Total risks:** 12
- **High-priority (≥6):** 6 risks requiring immediate mitigation
- **Critical (score 9):** 2 (idempotency, timezone/freshness)
- **Test effort:** ~45–75 tests (~2–4 weeks builder-time, solo dev + TEA guidance)

---

## Quick Guide

### 🚨 BLOCKERS - Team Must Decide (Can't Proceed Without)

1. **B-001: Auth test harness for CI** — Provide a deterministic way to establish authenticated sessions in tests without manual email (dev-only session injection, test auth route, or Resend webhook capture). Owner: Backend/Auth. Timeline: Epic 1 (Story 1.3).
2. **B-002: Idempotency persistence on `tasks.complete`** — `completed_at`, `xp_awarded`, `freshness_multiplier` columns must exist before complete/reward tests are meaningful. Owner: Backend. Timeline: Epic 3 (Story 3.1 schema).
3. **B-003: SQLite integration test strategy** — Document and implement per-worker test DB (in-memory or temp file) with migration + teardown. Owner: Backend. Timeline: Epic 1 (Story 1.1).
4. **B-004: Timezone contract on complete** — Client sends IANA timezone; server uses local calendar dates for freshness. Contract must be documented with test vectors before domain tests are signed off. Owner: Backend/Domain. Timeline: Epic 3 (Story 3.1).

**What we need from team:** Complete these 4 items pre-implementation or integration/E2E test development is blocked.

---

### ⚠️ HIGH PRIORITY - Team Should Validate (We Provide Recommendation, You Approve)

1. **R-003: Cross-user data leakage** — Enforce `owner_id` scoping on every tRPC procedure; add negative ownership tests. Approve: Backend lead (Epic 2–3).
2. **R-007: Resend dependency in CI** — Use test email sink (Mailpit/Mailhog) or mock in CI; never hit production Resend. Approve: DevOps/Builder (Epic 1).
3. **R-009: Test data factories** — Shared factories in `packages/validators` test helpers or `apps/api/tests/factories` for Task, User, Skill junction. Approve: Builder (Epic 1).
4. **R-005: Reward modal ≤1s NFR** — Define measurement point (tRPC response → modal visible) and acceptable CI network profile. Approve: Architect (Epic 3).

---

### 📋 INFO ONLY - Solutions Provided (Review, No Decisions Needed)

1. **Test strategy:** Unit-heavy domain (60%), integration tRPC+DB (25%), E2E Playwright (15%) — progression logic at unit/integration; UI at E2E only.
2. **Tooling:** `bun test` (domain + API integration), Playwright 1.60 (`apps/web`), MSW for web integration, axe-core in Playwright for a11y gate.
3. **Tiered CI:** PR = lint, typecheck, domain tests, coverage ≥70%, build, Playwright (docker-compose stack).
4. **Coverage:** ~45–75 scenarios P0–P3; minimum 5 E2E per NFR10.
5. **Quality gates:** P0 100%, P1 ≥95%, zero critical a11y violations, coverage ≥70%.

---

## For Architects and Devs - Open Topics 👷

### Risk Assessment

**Total risks identified:** 12 (6 high-priority ≥6, 4 medium, 2 low)

#### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|---|---|-------|------------|-------|----------|
| **R-001** | **DATA** | Double XP/Focus on retry if complete is not idempotent | 3 | 3 | **9** | Persist completion fields; safe retry returns identical payload | Backend | Epic 3 |
| **R-002** | **DATA** | Wrong freshness multiplier across timezones/DST boundaries | 3 | 3 | **9** | Domain test vectors + documented IANA contract | Domain/Backend | Epic 3 |
| **R-003** | **SEC** | User A reads/mutates User B's Quests via tRPC | 2 | 3 | **6** | `protectedProcedure` + ownership checks on all mutations | Backend | Epic 2–3 |
| **R-004** | **SEC** | Client sends forged XP/Focus values | 2 | 3 | **6** | Server-only progression; reject client progression writes | Backend | Epic 3 |
| **R-005** | **TECH** | Magic link auth blocks automated E2E | 3 | 2 | **6** | Test auth bypass or email capture in CI | Backend/QA | Epic 1 |
| **R-007** | **OPS** | Resend outage/rate limit breaks CI auth tests | 3 | 2 | **6** | Local mail sink in docker-compose; mock in unit/integration | DevOps | Epic 1 |
| **R-009** | **TECH** | No factories → slow/flaky test setup | 3 | 2 | **6** | Faker-based factories + auto-cleanup fixtures | Builder/QA | Epic 1 |

#### Medium-Priority Risks (Score 3–5)

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner |
|---------|----------|-------------|---|---|-------|------------|-------|
| R-006 | PERF | Reward modal exceeds 1s NFR | 2 | 2 | 4 | Profile complete path; avoid N+1; E2E timing assertion with slack | Backend |
| R-008 | BUS | Focus spend anti-exploit gaps (free delete overdue) | 2 | 2 | 4 | Server enforces Focus cost on overdue delete/reschedule | Backend |
| R-010 | OPS | SQLite file locking under parallel CI workers | 2 | 2 | 4 | Per-worker DB files or serialized integration job | DevOps |
| R-011 | BUS | Punitive/shame copy slips into overdue/Focus errors | 2 | 1 | 2 | Copy review checklist + snapshot tests for error strings | Frontend |

#### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | P | I | Score | Action |
|---------|----------|-------------|---|---|-------|--------|
| R-012 | TECH | RSC/client boundary leaks server modules | 1 | 2 | 2 | Lint rule + code review |
| R-013 | OPS | Docker volume drift between CI runs | 1 | 1 | 1 | Ephemeral CI volumes |

---

### NFR Testability Requirements

| NFR Category | Threshold / Requirement | Design Support | Gap / Decision | Planned Evidence |
|--------------|-------------------------|----------------|----------------|------------------|
| Security | Magic link auth; no client-trusted XP/Focus; user-scoped mutations | Partial | B-001 auth harness; ownership tests | API integration + E2E auth gate |
| Performance | Reward modal ≤1s after successful complete (NFR3) | Partial | Measurement contract undefined | Playwright timing + API latency log |
| Reliability | Online-only; failed requests show retry UI (NFR2) | Supported | — | E2E network failure + MSW |
| Maintainability | ≥70% meaningful coverage (NFR9); domain prioritized | Supported | Coverage exclude config TBD | CI coverage report |
| Accessibility | Zero critical WCAG violations (NFR4, SC5) | Partial | axe-core integration TBD | Playwright + axe in CI |
| Deployment | `docker compose up` smoke (NFR11, SC4) | Supported | — | CI compose job + smoke script |

**Unknown thresholds:** P95/P99 API latency (beyond reward modal 1s), session TTL, rate limits — mark CONCERNS at `nfr-assess` unless clarified.

**Assessment boundary:** Final PASS/CONCERNS/FAIL belongs in `nfr-assess` after implementation evidence exists.

---

### Testability Concerns and Architectural Gaps

#### 1. Blockers to Fast Feedback

| Concern | Impact | What Architecture Must Provide | Owner | Timeline |
|---------|--------|-------------------------------|-------|----------|
| **No auth test bypass** | E2E blocked on every PR | Dev/test session endpoint or mail capture | Backend | Epic 1 |
| **No test DB isolation** | Flaky parallel integration tests | Per-worker SQLite + migrate/teardown helper | Backend | Epic 1 |
| **No seeding helpers** | Long manual setup per test | Factory module + optional `testOnly` tRPC seed (dev/CI only) | Backend | Epic 1–2 |
| **Email external dependency** | CI flakiness | Mailpit in docker-compose | DevOps | Epic 1 |

#### 2. Architectural Improvements Needed

1. **Expose domain as pure API surface**
   - **Current problem:** Risk of logic leaking into tRPC handlers
   - **Required change:** Handlers delegate to `packages/domain`; handlers tested via integration, domain via unit vectors
   - **Impact if not fixed:** Untestable duplication, freshness bugs
   - **Owner:** Backend | **Timeline:** Epic 3

2. **Structured error codes for test assertions**
   - **Current problem:** Generic errors hard to assert in integration tests
   - **Required change:** Stable TRPCError codes + machine-readable error codes per architecture
   - **Owner:** Backend | **Timeline:** Epic 2

---

### Testability Assessment Summary

#### What Works Well

- API-first tRPC design — business logic testable without UI (ADR 1.2 ✅)
- Pure domain package — ideal for unit tests with timezone vectors (ADR 1.1 partial ✅)
- Monorepo with explicit packages — clear test boundaries
- Ship gates already defined in PRD/epics (70% coverage, 5 E2E, a11y)

#### Accepted Trade-offs (No Action Required)

- **No k6 load testing** — single-user MVP; performance validated via E2E timing + domain speed
- **No contract testing (Pact)** — monolith tRPC; type inference sufficient
- **No DR/multi-region** — learning project scope

---

### Architecturally Significant Requirements (ASRs)

| ASR | Type | Description |
|-----|------|-------------|
| Server-side progression only | ACTIONABLE | All XP/Focus writes in transactions; domain pure |
| Timezone-aware freshness | ACTIONABLE | IANA on complete; UTC storage; local date math |
| Idempotent complete | ACTIONABLE | Persisted completion state; retry-safe |
| Task vs Quest naming | FYI | DB/tRPC = Task; UI = Quest |
| RSC-first UI | FYI | E2E covers journeys; component tests minimal in MVP |

---

### Risk Mitigation Plans (Score ≥6)

#### R-001: Idempotent complete (Score: 9)

1. Add idempotency columns in migration before `tasks.complete` implementation
2. Unit-test domain; integration-test double-submit returns same payload
3. E2E: complete → network retry simulation via API

**Owner:** Backend | **Timeline:** Epic 3 Story 3.2 | **Verification:** Integration test `complete twice → identical xpAward`

#### R-002: Timezone freshness (Score: 9)

1. Document contract in `packages/domain/README` or architecture addendum
2. Ship ≥12 test vectors: UTC boundaries, DST spring/fall, undated decay, overdue decay
3. Reject complete without valid IANA timezone

**Owner:** Domain/Backend | **Timeline:** Epic 3 Story 3.1 | **Verification:** 100% domain vector pass in CI

#### R-005 + R-007: Auth in CI (Score: 6 each)

1. Add Mailpit to docker-compose for local/CI email capture
2. Implement test helper: extract magic link from captured mail OR inject session cookie via test-only route guarded by `NODE_ENV=test`
3. Playwright `storageState` reuse after one login per worker

**Owner:** Backend/DevOps | **Timeline:** Epic 1 Story 1.3 | **Verification:** Auth E2E passes in CI without manual steps

---

### Assumptions and Dependencies

#### Assumptions

1. Solo builder implements tests alongside features (no dedicated QA headcount)
2. CI runs on GitHub Actions with docker-compose available
3. Resend API key available for non-CI dev; CI uses mail sink

#### Dependencies

1. Epic 1 scaffold complete — required before any integration/E2E
2. `packages/domain` with vectors — required before Epic 3 E2E complete flow
3. docker-compose stack — required before Playwright CI (Epic 4)

#### Risks to Plan

- **Risk:** Magic link E2E remains flaky despite harness
  - **Impact:** NFR10 gate blocked
  - **Contingency:** API-level auth integration tests + reduced E2E to smoke with pre-seeded session

---

**Next Steps for Architecture Team:** Resolve B-001–B-004; assign R-001/R-002 owners before Epic 3.

**Next Steps for QA/Builder:** See companion `test-design-qa.md` for scenarios and execution recipe.
