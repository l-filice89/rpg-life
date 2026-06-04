# AI Integration Log — rpg-life

This log captures agent-assisted development decisions across epics so implementation choices are traceable.

## How This Was Built

rpg-life was developed with a BMad workflow in Cursor:
- planning artifacts first (PRD, architecture, UX, epics),
- story-by-story implementation with explicit acceptance criteria,
- review and patch loops before stories are finalized.

## Decision Log

### 2026-05-29 — Epic 1 — Data Platform

- Context: Story 1.1 scaffold and architecture alignment
- Decision: Use SQLite + Drizzle for MVP instead of a managed Postgres setup.
- Rationale: Single-user/local-first MVP with Docker deployment goals; lower operational overhead and faster onboarding.
- Outcome: `packages/db` and migration flow standardized around SQLite, with bind-mounted persistence in docker.

### 2026-05-29 — Epic 1 — Contract Layer

- Context: Story 1.1/1.3 API contract setup
- Decision: Standardize on tRPC v11 for API contracts instead of parallel REST endpoints.
- Rationale: End-to-end type safety between server and UI and lower DTO drift risk.
- Outcome: Routers consolidated in `packages/api`; web consumes via same typed contract.

### 2026-05-29 — Epic 1 — Naming Guardrail

- Context: Cross-epic terminology consistency
- Decision: Keep `Task` as data model/backend term; use `Quest` only in UX copy.
- Rationale: Prevent domain-layer ambiguity and accidental schema/API naming drift.
- Outcome: Search for `quest` in backend/domain code becomes a quality signal.

### 2026-05-30 — Epic 2 — Quest Board Architecture

- Context: Story 2.2+ Quest Board implementation
- Decision: Keep Quest Board data loading RSC-first with client islands only for interactions.
- Rationale: Preserve server-fetch performance and reduce unnecessary client hydration.
- Outcome: Server-rendered board shell with client-owned FAB/sheets/filters.

### 2026-06-01 — Epic 2 — Schema Forward-Provision

- Context: Story 2.1 schema design for future completion flow
- Decision: Add completion/idempotency columns before Epic 3 (`completed_at`, `xp_awarded`, `freshness_multiplier`).
- Rationale: Avoid migration churn and reduce risk in complete/reward stories.
- Outcome: Epic 3 completion path shipped without cross-epic schema rework.

### 2026-06-02 — Epic 3 — Domain Isolation

- Context: Story 3.1 progression engine
- Decision: Keep XP/freshness/focus/level calculations in `packages/domain` pure functions.
- Rationale: Server-authoritative progression with deterministic, unit-testable logic.
- Outcome: Reused domain functions across completion, rewards, profile, and focus spend.

### 2026-06-02 — Epic 3 — Empty State Split

- Context: Story 2.7 and 3.6 empty-state UX
- Decision: Maintain separate components for first-time empty and board-clear empty states.
- Rationale: Different behavioral intent and messaging; single component with toggles caused conflation risk.
- Outcome: `QuestBoardEmptyFirst` and `QuestBoardEmptyClear` remain distinct implementation paths.

### 2026-06-04 — Epic 4 — E2E Auth Strategy

- Context: Story 4.1 Playwright coverage in CI
- Decision: Add test-only auth/session endpoints (`POST /api/auth/test-session`, test seed helpers) gated to `NODE_ENV=test`.
- Rationale: Reliable authenticated E2E without brittle external inbox automation for magic links.
- Outcome: Critical journeys (create, complete, profile, focus spend) became automatable in CI.

### 2026-06-04 — Epic 4 — CI Coverage Gate

- Context: Story 4.2 quality gate hardening
- Decision: Enforce coverage threshold in CI parsing instead of `bunfig.toml` threshold flag.
- Rationale: Bun 1.3.x applies threshold per-file (bug), causing false negatives.
- Outcome: CI now enforces global threshold using workflow parsing while keeping `bun test --coverage` stable.

### 2026-06-04 — Epic 4 — Accessibility Gate

- Context: Story 4.3 accessibility quality bar
- Decision: Add axe-core Playwright audits for critical pages/flows and patch component-level a11y regressions.
- Rationale: Catch accessibility regressions automatically at release gate, not post-release.
- Outcome: Dedicated accessibility spec coverage and improved keyboard/focus semantics in UI components.

### 2026-06-04 — Epic 4 — Docker Verification

- Context: Story 4.4 deployment readiness
- Decision: Add scripted docker smoke verification (`scripts/smoke-docker.sh`) and document compose-first verification.
- Rationale: Ensure reproducible startup/health validation for local and VPS-style deployments.
- Outcome: One-command environment verification with health/proxy checks and explicit cleanup behavior.
