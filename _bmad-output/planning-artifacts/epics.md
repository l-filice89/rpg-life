---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md
  - planning-artifacts/prds/prd-rpg-life-2026-05-29/reconcile-brainstorm.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/quest-board.html
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/reward-modal.html
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/auth-sign-in.html
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/board-clear-empty.html
  - planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/color-themes-exploration.html
  - docs/success_criteria.md
---

# rpg-life - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for rpg-life, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Authenticated user can view all open Quests on Quest Board, sorted by nearest due_date ascending, with undated Quests after dated ones; soft-deleted Quests never appear.

FR2: User can toggle or apply a filter to show overdue open Quests (due_date before today); overdue copy uses neutral language (no "failed", "missed", "penalty"); section hidden or empty when count is zero.

FR3: User can set a filter limiting displayed future Quests to an upcoming-day range (default 7 days when filter active); undated Quests always remain visible; filter state persists for the session only.

FR4: First-time user sees Tutorial explainer on first open; zero-Quest user sees empty state with RPG framing ("No quests yet") and primary CTA to create a Quest via FAB.

FR5: User can create a Quest from FAB with title, difficulty (trivial | easy | medium | hard), optional due date, and 1–3 unique Skills; save disabled until non-empty title and ≥1 Skill; max 3 Skills enforced; successful create shows toast encouraging completion; create sheet copy nudges adding a due date; FAB opens create sheet directly (no Tutorial gate).

FR6: User can edit open Quest fields and Skill tags (free in MVP); user can soft-delete open Quest with confirmation; completed Quests cannot be edited; adding due_date to previously undated open Quest costs 1 Focus; delete overdue open Quest costs 1 Focus; delete non-overdue is free; due date at create is free.

FR7: User completes an open Quest via checkbox → confirmation modal → Yes triggers completion; No dismisses modal and Quest stays open; completion rejected if zero Skills; repeat complete on already-completed Quest is idempotent (no double XP).

FR8: On successful completion, system computes xpAward = baseXp[difficulty] × freshnessMultiplier, splits across linked Skills, updates Hero level, and displays Reward modal with per-Skill gains and Hero progress; dated Quests earn full XP through due date; undated Quests decay from creation; Reward modal shows freshness breakdown when multiplier < 1 with neutral copy; medium/hard completion shows Focus earned when under cap; Hero level-up shows Level up! banner; reward visible within 1s of successful API response.

FR9: User can open My Profile from sidebar and see Hero level, XP remaining to next Hero level, all seven Skills with XP bars (0 XP if never trained), and Focus balance/cap; data refreshes on page open after recent completion.

FR10: User earns +1 Focus when completing a medium or hard Quest, subject to Focus cap (3 + floor(Hero level / 3)); trivial/easy never increase Focus; Focus never exceeds cap after earn.

FR11: User can spend 1 Focus per action for: reschedule overdue (new due date for overdue open Quest), delete overdue (soft-delete overdue open Quest), add due date (first due date on Quest created undated); spend rejected with actionable message when balance < 1; all spends use neutral copy; Focus balance decrements by 1 on each successful spend.

FR12: User opens hamburger menu to reveal sidebar overlay with Quest Board (home), My Profile, and Tutorial; sidebar dismisses on backdrop tap or navigate action; keyboard and screen-reader accessible with focus trap while open.

FR13: On first ever app open, user sees Tutorial explainer sheet automatically before interacting with Quest Board; shown exactly once per user/account; dismissing lands user on Quest Board (empty state if no Quests); subsequent opens do not auto-show.

FR14: User can open Tutorial from sidebar at any time to replay explainer content; replay does not mutate first-run "already seen" state; Tutorial covers Quests, Skills, Hero level, due dates vs undated XP freshness, Focus earn/spend rules.

### NonFunctional Requirements

NFR1: Platform — Browser-first; mobile-primary layout with responsive desktop enhancement.

NFR2: Connectivity — Online-only MVP; failed requests show retry UI (no silent failure).

NFR3: Performance — Reward modal visible within 1s of successful complete under normal network.

NFR4: Accessibility — Semantic HTML, keyboard navigation, visible focus, screen-reader labels on Quest Board actions, sidebar, modals, and FAB; touch targets sized for mobile (minimum 44×44px); **zero critical WCAG violations** at MVP ship gate (automated audit on core flows).

NFR5: Security — Auth via better-auth magic link; all mutations scoped to authenticated user; no client-trusted XP or Focus writes; all progression logic server-side.

NFR6: Auth — Session cookie via better-auth magic link email sign-in.

NFR7: Voice and tone — RPG-encouraging microcopy; never punitive or shame language on overdue, Focus failures, or XP freshness reductions; no medical/therapeutic claims.

NFR8: Theme — Follow prefers-color-scheme (light/dark Crystal Path); no in-app theme toggle in MVP.

NFR9: Test coverage — Minimum **70% meaningful code coverage** across the codebase (domain layer prioritized; exclude generated/boilerplate where configured in coverage report).

NFR10: E2E tests — Minimum **5 passing Playwright tests** in CI covering critical paths (auth gate, Quest create, complete + reward, profile refresh, and at least one Focus-spend or filter flow).

NFR11: Deployment — Application runs successfully via **`docker compose up`** (web + api + persisted SQLite volume); GitHub Actions CI pipeline (lint, typecheck, domain tests, coverage gate, build, E2E).

NFR12: Documentation — README with local setup instructions (env vars, Resend, docker-compose, dev commands) and an **AI integration log** documenting agent-assisted development decisions.

### Additional Requirements

- **Starter template (Epic 1 Story 1):** Scaffold with **create-x4 (x4-mono)** saas preset, then post-scaffold adaptations: reconfigure Postgres → SQLite (`bun:sqlite` + Drizzle), add `packages/ui` (shadcn/ui + Tailwind v4), add `packages/domain`, add `docker-compose.yml` (web :3000, api :3002, SQLite volume), configure better-auth magic link + Resend, wire tRPC HTTP link in Next.js (RSC server caller + React Query client islands).
- **Monorepo topology:** `apps/web` (Next.js 15 App Router, RSC) + `apps/api` (Bun + Hono + tRPC); shared packages: `domain`, `db`, `auth`, `validators`, `api`, `ui`.
- **Database:** SQLite at `/data/rpg-life.db` via Docker volume; Drizzle ORM with versioned migrations run on api container startup; seed 7 Skills catalog; core tables: users, tasks, skills, task_skills, user_skills, user_progress (+ better-auth tables).
- **API layer:** tRPC v11 routers — `tasks`, `profile`, `focus`, `tutorial`; PRD REST sketch maps to tRPC procedures; `protectedProcedure` on all user-scoped reads/mutations; Zod validation in `packages/validators` shared with React Hook Form.
- **Domain layer:** Pure functions in `packages/domain` for freshness (`computeFreshness`), XP split, Hero/Skill level calc, Focus cap/earn/spend rules; co-located unit tests with test vectors for timezone/date edge cases.
- **Progression constants (MVP locked):** baseXp trivial 5 / easy 10 / medium 25 / hard 50; a_skill 25; a_user 50; minFreshness 0.5; undatedDecayPerDay 0.02; overdueDecayPerDay 0.05; maxSkillsPerTask 3; Focus cap 3 + floor(heroLevel/3).
- **Timezone contract (critical):** Client sends IANA timezone on `tasks.complete`; store UTC timestamps in DB; freshness uses local calendar dates; document contract in API.
- **Idempotency:** Persist `tasks.completed_at`, `tasks.xp_awarded`, `tasks.freshness_multiplier` on first complete; safe retry returns identical reward payload.
- **Auth integration:** better-auth at `/api/auth/*` on api; Next.js rewrites proxy `/api/auth/*` + `/api/trpc/*` → api for same-origin cookies; Resend for magic link email (dev + prod); required env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, EMAIL_FROM, API_URL.
- **Frontend architecture:** RSC-first; minimal `"use client"` only on interactive leaves (modals, FAB, sidebar, forms, filters, checkbox); route groups `(auth)/` + `(app)/`; Quest Board filter state in React useState (session-only, not URL params).
- **Naming convention (locked):** `Task` in DB/tRPC/validators; `Quest` in UI copy only — never mix.
- **Transactions:** `tasks.complete` and `focus.spend` wrap in Drizzle transaction; domain calc pure, writes inside transaction.
- **Cache invalidation:** After mutations invalidate `tasks.list` + `profile.get`; no optimistic updates for XP/Focus in MVP.
- **Soft delete:** `deleted_at` nullable timestamp on tasks; never hard delete in MVP.
- **Tutorial state:** Server-side `user_progress.tutorial_seen_at` for cross-device first-run consistency; **`user_progress` table created in Story 1.1**, row provisioned on first sign-in (Story 1.3).
- **Logging:** pino structured JSON on api; never log magic link tokens or session secrets.
- **Reward payload shape:** Return xpAward, xpPerSkill, focusEarned, heroLevelBefore/After, leveledUp, optional freshness breakdown object.
- **Error handling:** tRPC TRPCError codes (UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, CONFLICT); client mutations show toast with retry on network failure; neutral user-facing copy per PRD.
- **Brainstorming session SQLite field notes:** Reference `brainstorming-session-2026-05-28-112057.md` during schema implementation (per architecture gap note).
- **Explicit non-goals:** No Story/narrative, no perk constellation, no offline queue, no multiplayer, no streak punishment, no client-trusted progression.
- **CI coverage gate:** Enforce ≥70% coverage threshold in GitHub Actions (fail build below threshold).
- **E2E minimum suite:** At least 5 Playwright specs must pass in CI before merge to main.
- **A11y audit gate:** Run automated accessibility scan (e.g., axe-core in Playwright or dedicated a11y step) on auth, Quest Board, complete/reward, and Profile flows; zero **critical** violations required.
- **README deliverables:** Setup guide, env reference (`.env.example`), docker-compose usage, and `docs/ai-integration-log.md` (or section in README) maintained through build.

### Project Success Criteria

Source: `docs/success_criteria.md` — these are **ship gates**; every epic and story must trace to at least one criterion where applicable.

SC1: **Working application** — App fully functional with all Quest CRUD operations (create, read/list, update, delete/soft-delete, complete), Focus spend actions, Profile read, and auth sign-in flow end-to-end.

SC2: **Test coverage** — Minimum 70% meaningful code coverage (NFR9); domain progression logic fully unit-tested with edge-case vectors.

SC3: **E2E tests** — Minimum 5 passing Playwright tests in CI (NFR10); cover UJ-1 through UJ-4 critical paths where feasible.

SC4: **Docker deployment** — `docker compose up` brings up web (:3000) and api with SQLite persisted in `./data`; smoke-verifiable without manual service wiring.

SC5: **Accessibility** — Zero critical WCAG violations on audited MVP surfaces (NFR4, UX-DR26).

SC6: **Documentation** — README with setup instructions and AI integration log (NFR12).

### UX Design Requirements

UX-DR1: Implement Crystal Path design tokens in Tailwind/shadcn theme — background (#F6FAFB / #0F1720), foreground, primary teal (#0B7A70 / #2DD4BF), accent violet (#7C3AED / #A78BFA), muted, border, card, destructive, focus-pill, xp-track, xp-fill gradient, skill-chip, overdue-border (light + dark variants per DESIGN.md frontmatter).

UX-DR2: Configure typography tokens — Geist Sans default for body; `display` (28px/600) and `display-sm` (20px/600) for epic moments only; `hero-level` (13px/600, uppercase via CSS) for Hero Lv label.

UX-DR3: Implement spacing and radius tokens — rounded sm 8px, md 12px, lg 16px, full 9999px; spacing scale 4–40px per DESIGN.md.

UX-DR4: Build brand-layer **XpBar** component — 8px height, full radius, teal→violet gradient fill, optional violet glow (`0 0 12px rgba(124, 58, 237, 0.35)`); used in Quest Board header and My Profile.

UX-DR5: Build brand-layer **FocusPill** component — compact pill with focus-pill-bg/fg tokens, full radius, 1px border; read-only in header (no tap action MVP).

UX-DR6: Build brand-layer **SkillChip** component — unified neutral palette (not per-skill hue); Lucide icon 14px + skill name; icon map: Concentration=Target, Vitality=HeartPulse, Lore=BookOpen, Presence=Users, Order=LayoutList, Resolve=Shield, Craft=Hammer; store map in `packages/ui/src/skill-icons.ts`.

UX-DR7: Build brand-layer **QuestRow** component — card surface with border, md radius, spacing.4/5 padding; checkbox leading; row body tap opens edit sheet (not checkbox); shows title (16px medium), difficulty chip, 1–3 skill chips, due date if set; overdue uses muted border only (never alarm red).

UX-DR8: Build **FAB** — 56px circular, primary teal, bottom-trailing on mobile, shadow `0 4px 20px rgba(13, 148, 136, 0.35)`; always opens Create Quest sheet directly.

UX-DR9: Implement Quest Board header stack per mockup guideline (`mockups/quest-board.html`) — hamburger + title → Hero zone (level + XP bar) + Focus pill → filter chips → quest list; generous spacing between rows (spacing.5–6).

UX-DR10: Implement responsive breakpoints — `< md` full-width single column, sidebar overlay, FAB bottom-trailing, Reward modal as bottom sheet; `md–lg` centered max-w-lg; `≥ lg` max-w-2xl, Reward modal as centered dialog, Profile optional two-column Skill grid.

UX-DR11: Implement **Confirm complete modal** — shadcn Dialog; "Mark this quest complete?"; primary Yes + outline No; stacked footer on mobile; one modal level deep (never double-stack with reward).

UX-DR12: Implement **Reward modal (standard)** per mockup guideline (`mockups/reward-modal.html`) — sheet on mobile / dialog on desktop; max-width 420px; shows per-Skill XP with ~400ms animated fill, Focus earned if applicable, freshness note when multiplier < 1, Hero XP bar progress; Continue dismisses; if Hero leveled up, show Level up! banner inline OR transition to level-up overlay.

UX-DR13: Implement **Hero level-up overlay** — full viewport takeover with background-dark, display typography "Level up!", subtle confetti, extended beat; replaces standard reward layout when leveledUp; Continue returns to Quest Board; respect prefers-reduced-motion (skip confetti).

UX-DR14: Implement **Create / Edit Quest sheet** — shadcn Sheet (bottom mobile / right desktop); fields order: title → difficulty → skill chips → due date; save uses primary button styling; save disabled until title + ≥1 Skill; due date optional with scheduling nudge copy; edit shows delete and Focus-gated actions.

UX-DR15: Implement **Focus spend prompt** — shadcn Dialog; shows "1 Focus" cost in FocusPill styling; action-specific copy (reschedule/delete/add due date); insufficient Focus explains earn path (medium/hard completions).

UX-DR16: Implement **Tutorial sheet** — shadcn Sheet from bottom; standard dismiss; auto on first open once; replay from sidebar; covers Quests, Skills, Hero level, freshness, Focus rules.

UX-DR17: Implement **Sidebar overlay** — shadcn Sheet from left; card panel; items: Quest Board, My Profile, Tutorial; focus trap while open; dismiss on backdrop or nav selection; Esc closes.

UX-DR18: Implement **Auth gate** per mockup guideline (`mockups/auth-sign-in.html`) — centered card on background; star motif (CSS/SVG); display-sm headline "Enter the realm"; email field; post-send confirmation inline on same route (masked email, resend); user checks email app for magic link; RPG copy ("Enter a valid realm address" for validation errors).

UX-DR19: Implement **Empty state (zero Quests)** — "No quests yet" + RPG one-liner; FAB remains visible; shown after Tutorial dismiss on first open.

UX-DR20: Implement **Board-clear empty state** per mockup guideline (`mockups/board-clear-empty.html`) — distinct from first-time empty; headline display-sm "Quest board clear"; body "Every quest accounted for. Start another when you're ready."; full-width primary "Add a quest" button; optional muted "See your growth" link to Profile; subtle star motif; FAB visible; appears immediately when last open Quest completed and Reward modal dismissed.

UX-DR21: Implement Quest Board filters UI — toggle overdue filter; upcoming-day range selector (default 7 when active); undated Quests always visible; neutral "Overdue" section label.

UX-DR22: Implement loading skeletons — Quest Board cold load: skeleton rows + header skeleton; My Profile: skeleton bars for Hero + 7 Skills; Suspense fallbacks on RSC pages.

UX-DR23: Implement error states — Quest Board fetch fail: error banner + retry (not empty state); write mutations: toast error + retry hint; no silent failures.

UX-DR24: Implement Toast patterns — Quest created nudge; neutral success on reschedule; network error with retry hint.

UX-DR25: Implement complete-in-flight state — Quest row disabled until response; no double-submit on checkbox.

UX-DR26: Accessibility floor — WCAG 2.2 AA target with **zero critical violations** at ship gate (SC5); semantic list for Quest Board; aria-label on checkbox ("Complete quest: {title}"); screen reader announces Reward modal content; focus trap in sidebar/sheets/modals; visible focus rings; form labels on Create/Edit and auth; prefers-reduced-motion disables XP fill animation and confetti; include automated a11y checks in E2E or CI.

UX-DR27: Voice/tone compliance — use approved microcopy table from EXPERIENCE.md (e.g., "Quest complete!" not "Task completed successfully"; "Spend 1 Focus to reschedule without penalty." not shame framing); banned: streak counters, shame copy, punishment spirals.

UX-DR28: Use shadcn/ui primitives unchanged where specified — Checkbox, Dialog, Sheet, Toast, Skeleton, Badge, Input, Label, Separator; do not custom-rebuild Dialog/Sheet/Toast; brand overrides only on listed components.

UX-DR29: Dark/light mode — follow prefers-color-scheme; neither mode forced as default; reference `mockups/color-themes-exploration.html` for palette validation only (DESIGN.md and EXPERIENCE.md spines win on conflict).

UX-DR30: Modal stack rule — one level deep only; confirm → reward replaces confirm; never two dialogs simultaneously.

### FR Coverage Map

FR1: Epic 2 — View open Quests sorted by due date
FR2: Epic 2 — Overdue filter
FR3: Epic 2 — Upcoming-day range filter
FR4: Epic 2 — Empty state (Tutorial trigger in Epic 1)
FR5: Epic 2 — Create Quest via FAB
FR6: Epic 2 — Edit/delete Quests, Focus-gated mutations
FR7: Epic 3 — Confirm then complete
FR8: Epic 3 — XP freshness + Reward modal
FR9: Epic 3 — My Profile stats
FR10: Epic 3 — Earn Focus on medium/hard
FR11: Epic 3 — Spend Focus (reschedule/delete/add-date)
FR12: Epic 1 — Sidebar navigation
FR13: Epic 1 — First-run Tutorial
FR14: Epic 1 — Tutorial replay from sidebar

## Epic List

### Epic 1: Enter the Realm
User can sign in via magic link, land in the app shell, and receive the first-run Tutorial explaining the core loop.
**FRs covered:** FR12, FR13, FR14

### Epic 2: Plan Quests on the Quest Board
User can view, filter, create, edit, and delete Quests — the planning half of the core loop.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 3: Complete Quests and Track Progress
User can complete Quests, collect rewards, view Hero/Skill stats on My Profile, and spend Focus to replan overdue work.
**FRs covered:** FR7, FR8, FR9, FR10, FR11

### Epic 4: Ship the MVP
Builder can deploy via Docker, verify quality gates (coverage, E2E, a11y), and hand off a documented MVP.
**Success criteria:** SC1, SC2, SC3, SC4, SC5, SC6

## Epic 1: Enter the Realm

User can sign in via magic link, land in the app shell, and receive the first-run Tutorial explaining the core loop.

### Story 1.1: Scaffold Monorepo and Development Infrastructure

As a **builder**,
I want the project scaffolded with the approved stack and runnable via Docker Compose,
So that I have a consistent foundation for all feature work.

**Acceptance Criteria:**

**Given** a greenfield repository
**When** create-x4 (x4-mono) saas preset is scaffolded and post-scaffold adaptations are applied
**Then** the monorepo contains `apps/web` (Next.js 15 RSC), `apps/api` (Bun/Hono/tRPC), and shared packages (`domain`, `db`, `auth`, `validators`, `api`, `ui`)
**And** SQLite is configured via `bun:sqlite` + Drizzle at `/data/rpg-life.db` with Docker volume mount
**And** `docker compose up` starts web (:3000) and api (:3002) without manual wiring
**And** `.env.example` documents required env vars (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, EMAIL_FROM, API_URL)
**And** Next.js rewrites proxy `/api/auth/*` and `/api/trpc/*` to the api service
**And** initial Drizzle migration creates `user_progress` (`user_id` FK to `users`, `tutorial_seen_at` nullable timestamp, `focus_balance` integer default 0) so Tutorial persistence (Story 1.5) is available before Quest schema lands in Epic 2

### Story 1.2: Crystal Path Design Tokens and shadcn Foundation

As a **user**,
I want the app to reflect the Crystal Path visual identity in light and dark mode,
So that rpg-life feels fresh, lightweight, and epic from the first screen.

**Acceptance Criteria:**

**Given** shadcn/ui + Tailwind v4 in `packages/ui`
**When** design tokens from DESIGN.md are applied
**Then** Crystal Path color tokens (primary teal, accent violet, focus-pill, xp-track, skill-chip, overdue-border) are available in light and dark variants (UX-DR1)
**And** typography tokens `display`, `display-sm`, and `hero-level` are configured (UX-DR2)
**And** spacing and radius tokens match DESIGN.md (UX-DR3)
**And** theme follows `prefers-color-scheme` with no forced default (UX-DR29)
**And** standard shadcn primitives (Dialog, Sheet, Toast, etc.) are installed without custom rebuilds (UX-DR28)

### Story 1.3: Magic Link Sign-In

As **Ben (returning user)**,
I want to sign in with my email via a magic link,
So that I can access my Quests without managing a password.

**Acceptance Criteria:**

**Given** an unauthenticated visitor on `(auth)/sign-in`
**When** they enter a valid email and submit
**Then** better-auth sends a magic link via Resend and the page shows post-send confirmation inline (masked email, resend option) per Auth B flow (UX-DR18, NFR5, NFR6)
**And** invalid email shows "Enter a valid realm address" (UX-DR27)
**And** tapping the magic link in email establishes a session cookie and redirects to the authenticated app
**And** expired/invalid link shows an error with option to resend
**And** all `/api/trpc/*` routes use `protectedProcedure` and redirect unauthenticated users to sign-in
**And** on first successful magic-link session, a `user_progress` row is created for the user if missing (`tutorial_seen_at` null, `focus_balance` 0)

### Story 1.4: App Shell and Sidebar Navigation

As **Ben**,
I want to open a sidebar from the hamburger menu to navigate the app,
So that I can move between Quest Board, My Profile, and Tutorial.

**Acceptance Criteria:**

**Given** an authenticated user on any app route
**When** they tap the hamburger icon
**Then** a sidebar overlay opens from the left with Quest Board (home), My Profile, and Tutorial (FR12, UX-DR17)
**And** the sidebar dismisses on backdrop tap, nav selection, or Esc key
**And** focus is trapped while the sidebar is open with visible focus rings (NFR4)
**And** `(app)/` route group renders the authenticated shell with providers (tRPC + QueryClient) at layout level
**And** Quest Board is the default landing route after sign-in

### Story 1.5: First-Run Tutorial

As **Ben (first-time user)**,
I want an explainer on my first app open,
So that I understand Quests, Skills, XP freshness, and Focus before I start.

**Acceptance Criteria:**

**Given** a user who has never dismissed the Tutorial (`tutorial_seen_at` is null)
**When** they open the app after authentication
**Then** the Tutorial sheet auto-opens before Quest Board interaction (FR13, UX-DR16)
**And** dismissing the Tutorial lands the user on Quest Board and marks Tutorial as seen server-side via `tutorial.markSeen` (writes `user_progress.tutorial_seen_at`)
**And** subsequent app opens do not auto-show the Tutorial
**When** the user opens Tutorial from the sidebar at any time
**Then** the same explainer content replays without resetting the seen flag (FR14)
**And** Tutorial covers Quests, Skills, Hero level, due dates vs undated freshness, and Focus earn/spend rules

## Epic 2: Plan Quests on the Quest Board

User can view, filter, create, edit, and delete Quests — the planning half of the core loop.

### Story 2.1: Tasks Schema and Skill Catalog Seed

As a **builder**,
I want the database schema for Quests and the seven Skills seeded,
So that Quest CRUD and progression have a data foundation.

**Acceptance Criteria:**

**Given** the Drizzle migration system from Story 1.1
**When** app schema migrations run on api startup
**Then** tables exist: `tasks` (title, difficulty, due_date, status, owner_id, created_at, deleted_at), `skills` (7 rows), `task_skills` (junction, 1–3 per task), `user_skills` (xp per user/skill)
**And** `user_progress` already exists from Story 1.1 (not recreated; Story 2.1 does not alter its schema)
**And** all seven Skills are seeded: Concentration, Vitality, Lore, Presence, Order, Resolve, Craft
**And** naming follows architecture conventions (snake_case DB, soft delete via `deleted_at`)
**And** Story/narrative tables are NOT created (post-MVP)

### Story 2.2: List Open Quests on Quest Board

As **Ben**,
I want to see my open Quests sorted by nearest due date,
So that I know what to work on next.

**Acceptance Criteria:**

**Given** an authenticated user with open Quests
**When** they navigate to Quest Board
**Then** all open Quests display sorted by nearest `due_date` ascending with undated Quests last (FR1)
**And** soft-deleted Quests never appear
**And** `tasks.list` tRPC procedure returns Quests scoped to the authenticated user only
**And** Quest Board page is a Server Component fetching via tRPC server caller (RSC-first)
**And** cold load shows skeleton rows and header skeleton (UX-DR22)
**And** fetch failure shows error banner with retry, not empty state (UX-DR23)

### Story 2.3: Quest Board Header and Brand Components

As **Ben**,
I want to see my Hero level, XP progress, and Focus at a glance on the Quest Board,
So that I feel my overall progression while planning Quests.

**Acceptance Criteria:**

**Given** an authenticated user on Quest Board
**When** the header renders
**Then** it shows hamburger + title, Hero level label, XpBar, and FocusPill per mockup guideline (UX-DR4, UX-DR5, UX-DR9)
**And** XpBar uses teal→violet gradient with optional glow (UX-DR4)
**And** FocusPill displays current balance (read-only in MVP)
**And** SkillChip component renders with unified neutral palette and Lucide icons per skill map in `packages/ui/src/skill-icons.ts` (UX-DR6)
**And** QuestRow component renders as elevated card with checkbox leading (UX-DR7)
**And** layout follows responsive breakpoints from UX-DR10

### Story 2.4: Create Quest via FAB

As **Ben**,
I want to create a Quest with title, difficulty, Skills, and optional due date,
So that I can log real tasks and assign them RPG meaning.

**Acceptance Criteria:**

**Given** an authenticated user on Quest Board
**When** they tap the FAB
**Then** the Create Quest sheet opens directly with no Tutorial gate (FR5, UX-DR8)
**And** fields appear in order: title → difficulty → skill chips → due date (UX-DR14)
**And** save is disabled until non-empty title and ≥1 Skill selected; max 3 Skills enforced
**And** due date is optional with copy nudging scheduling for full XP
**When** they save a valid Quest
**Then** `tasks.create` persists the Quest and toast shows creation nudge to complete for XP (UX-DR24, UX-DR27)
**And** the new Quest appears on Quest Board
**When** network fails on save
**Then** Quest is not created; error toast with retry hint appears (NFR2, UX-DR23)

### Story 2.5: Edit and Delete Open Quests

As **Ben**,
I want to edit or delete my open Quests,
So that I can keep my Quest Board accurate as plans change.

**Acceptance Criteria:**

**Given** an open Quest on Quest Board
**When** Ben taps the row body (not checkbox)
**Then** the Edit Quest sheet opens with current values (FR6, UX-DR14)
**And** Skill tag edits are free in MVP
**And** completed Quests cannot be edited
**When** Ben deletes a non-overdue open Quest
**Then** confirmation appears and soft-delete is free
**And** deleted Quests are excluded from Quest Board default views
**Note:** Focus-gated delete (overdue) and add-due-date flows are implemented in Story 3.5 after `focus.spend` exists (FR6 Focus-gated mutations, FR11).

### Story 2.6: Quest Board Filters

As **Ben**,
I want to filter overdue Quests and limit upcoming Quests by day range,
So that I can orient my week without overwhelm.

**Acceptance Criteria:**

**Given** Quests with mixed due dates on Quest Board
**When** Ben toggles the overdue filter
**Then** only open Quests with due_date before today display with neutral "Overdue" label (FR2, UX-DR21, UX-DR27)
**And** overdue section is hidden or empty when count is zero
**When** Ben activates the upcoming-day range filter (default 7 days)
**Then** Quests due beyond the range are hidden (FR3)
**And** undated Quests always remain visible when range filter is active
**And** filter state persists for the browser session only (not URL params)

### Story 2.7: Quest Board Empty State

As **Ben (new user with no Quests)**,
I want a welcoming empty state on Quest Board,
So that I know exactly how to plant my first Quest.

**Acceptance Criteria:**

**Given** an authenticated user with zero open Quests who has dismissed the Tutorial
**When** they view Quest Board
**Then** empty state shows "No quests yet" with RPG one-liner and visible FAB (FR4, UX-DR19, UX-DR27)
**And** primary CTA encourages creating first Quest via FAB
**And** voice/tone follows EXPERIENCE.md approved microcopy (UX-DR27)

## Epic 3: Complete Quests and Track Progress

User can complete Quests, collect rewards, view Hero/Skill stats on My Profile, and spend Focus to replan overdue work.

### Story 3.1: Progression Domain Engine

As a **builder**,
I want all XP, freshness, level, and Focus logic in a pure tested domain package,
So that progression is correct, secure, and never client-trusted.

**Acceptance Criteria:**

**Given** MVP progression constants from addendum.md
**When** domain functions are implemented in `packages/domain`
**Then** `computeFreshness`, `splitXpAcrossSkills`, `computeHeroLevel`, `computeSkillLevel`, and Focus cap/earn/spend rules exist as pure functions
**And** co-located unit tests cover dated/undated freshness, overdue decay, minFreshness floor, idempotency inputs, and Focus cap formula with test vectors
**And** timezone-aware freshness uses local calendar dates per architecture contract
**And** test coverage for `packages/domain` contributes toward the 70% project gate (SC2)

### Story 3.2: Confirm and Complete Quest

As **Ben**,
I want to confirm before marking a Quest complete,
So that I don't accidentally award XP for unfinished work.

**Acceptance Criteria:**

**Given** an open Quest with ≥1 Skill on Quest Board
**When** Ben taps the checkbox
**Then** Confirm complete modal appears: "Mark this quest complete?" with Yes/No (FR7, UX-DR11, UX-DR30)
**When** Ben taps No
**Then** modal dismisses and Quest stays open
**When** Ben taps Yes
**Then** `tasks.complete` runs with client IANA timezone, computes xpAward via domain layer, persists idempotency fields (`completed_at`, `xp_awarded`, `freshness_multiplier`), and splits XP across Skills (FR8 partial)
**And** row is disabled during request; no double-submit (UX-DR25)
**When** complete is retried on an already-completed Quest
**Then** response is idempotent with identical reward payload, no double XP (FR7)
**When** network fails
**Then** error toast with retry hint appears (NFR2)

### Story 3.3: Reward Modal and Hero Level-Up Celebration

As **Ben**,
I want to see my XP gains and celebrate level-ups after completing a Quest,
So that finishing real work feels like RPG progress.

**Acceptance Criteria:**

**Given** a successful Quest completion
**When** the Reward modal opens
**Then** it shows per-Skill XP gains with ~400ms animated fill, Focus earned (if medium/hard), Hero XP bar, and freshness note when multiplier < 1 with neutral copy (FR8, UX-DR12, UX-DR27)
**And** modal appears as bottom sheet on mobile, centered dialog on desktop (UX-DR10)
**And** reward feedback is visible within 1s of successful API response (NFR3)
**And** confirm modal is replaced (not stacked) per modal stack rule (UX-DR30)
**When** Hero level increases
**Then** Hero level-up overlay shows full-screen with display typography "Level up!" and subtle confetti (UX-DR13)
**And** `prefers-reduced-motion` skips fill animation and confetti (UX-DR26)
**When** Ben taps Continue
**Then** modal dismisses and Quest Board header refreshes with updated XP/Focus

### Story 3.4: My Profile Stats Page

As **Ben**,
I want to view my Hero level and all Skill XP bars,
So that I can see where my effort is actually going.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they navigate to My Profile via sidebar
**Then** page shows Hero level, XP-to-next Hero level bar, all seven Skills with XP bars (0 if untrained), and Focus balance/cap (FR9)
**And** `profile.get` tRPC returns all seven Skills even at 0 XP
**And** page refreshes data on open (no stale Hero level after recent complete)
**And** loading shows skeleton bars for Hero + 7 Skills (UX-DR22)
**And** Profile may use two-column Skill grid at ≥ lg breakpoint (UX-DR10)

### Story 3.5: Focus Earn and Spend Actions

As **Ben**,
I want to earn Focus from hard Quests and spend it to replan overdue work,
So that I can recover from missed due dates without guilt.

**Acceptance Criteria:**

**Given** Ben completes a medium or hard Quest under Focus cap
**When** completion succeeds
**Then** +1 Focus is earned and displayed in Reward modal and header (FR10)
**And** trivial/easy completions never increase Focus
**When** Ben reschedules an overdue Quest
**Then** Focus spend prompt shows "Spend 1 Focus to reschedule without penalty." (FR11, UX-DR15, UX-DR27)
**And** 1 Focus is debited, due date updates, and neutral toast "Quest rescheduled" appears (UX-DR24)
**When** Ben deletes an overdue open Quest
**Then** Focus spend prompt requires 1 Focus before soft-delete proceeds (FR6, FR11, UX-DR15)
**When** Ben adds a first due date to a Quest created without one
**Then** Focus spend prompt requires 1 Focus before due date is set (FR6, FR11, UX-DR15)
**When** Focus balance < 1
**Then** spend is blocked with message explaining medium/hard completions earn Focus (FR11, UX-DR27)
**And** `focus.spend` wraps in Drizzle transaction with CONFLICT handling on race

### Story 3.6: Board-Clear Celebratory Empty State

As **Ben**,
I want a celebratory empty state when I complete my last open Quest,
So that finishing everything feels rewarding and I'm invited to start the next Quest.

**Acceptance Criteria:**

**Given** Ben has one remaining open Quest on Quest Board
**When** he completes it and dismisses the Reward modal
**Then** Quest Board immediately shows board-clear empty state (UX-DR20)
**And** headline is display-sm "Quest board clear" with body "Every quest accounted for. Start another when you're ready."
**And** full-width primary "Add a quest" button and FAB remain visible
**And** optional muted "See your growth" link navigates to My Profile
**And** this state is distinct from first-time "No quests yet" empty (UX-DR19 vs UX-DR20)

## Epic 4: Ship the MVP

Builder can deploy via Docker, verify quality gates, and hand off a documented MVP.

### Story 4.1: Playwright E2E Test Suite

As a **builder**,
I want automated end-to-end tests covering critical user journeys,
So that regressions in the core loop are caught before merge.

**Acceptance Criteria:**

**Given** the implemented MVP features from Epics 1–3
**When** Playwright E2E suite runs in CI
**Then** at least **5 passing specs** exist (SC3, NFR10) covering: auth gate smoke, Quest create (UJ-1), Quest complete + reward (UJ-2), Profile refresh (UJ-3), and Focus reschedule or filter flow (UJ-4)
**And** tests use Playwright 1.60.0 against docker-compose stack or CI equivalent
**And** E2E validates full Quest CRUD path contributes to SC1 verification

### Story 4.2: CI Pipeline with Coverage Gate

As a **builder**,
I want CI to enforce lint, typecheck, tests, and coverage thresholds,
So that code quality stays consistent throughout the build.

**Acceptance Criteria:**

**Given** GitHub Actions workflow
**When** a PR or push to main runs CI
**Then** pipeline executes lint, typecheck, domain unit tests, build, and Playwright E2E (NFR11)
**And** coverage report enforces **≥70% meaningful code coverage** — build fails below threshold (SC2, NFR9)
**And** domain unit tests from Story 3.1 are included in CI

### Story 4.3: Accessibility Audit Gate

As a **builder**,
I want automated accessibility checks on core flows,
So that the MVP ships with zero critical WCAG violations.

**Acceptance Criteria:**

**Given** auth, Quest Board, complete/reward, and Profile flows implemented
**When** automated a11y scan runs (axe-core in Playwright or dedicated CI step)
**Then** **zero critical WCAG violations** are reported (SC5, UX-DR26)
**And** audited surfaces include sidebar focus trap, modal focus management, checkbox aria-labels, and form labels
**And** failures block merge until resolved

### Story 4.4: Docker Deployment Verification

As a **builder**,
I want the full app to run with a single Docker command,
So that deployment is reproducible for local dev and VPS hosting.

**Acceptance Criteria:**

**Given** a clean clone with `.env` configured from `.env.example`
**When** `docker compose up` is run
**Then** web and api services start, SQLite persists in `./data`, and auth + Quest Board are reachable (SC4, NFR11)
**And** README documents the docker-compose workflow and required env vars
**And** smoke verification steps are documented for manual or scripted check

### Story 4.5: README and AI Integration Log

As a **builder**,
I want setup documentation and an AI development log,
So that the project is onboarding-friendly and agent-assisted decisions are traceable.

**Acceptance Criteria:**

**Given** the completed MVP
**When** a new developer reads the README
**Then** it includes local setup (Bun, env vars, Resend, docker-compose, dev commands) (SC6, NFR12)
**And** an **AI integration log** exists (`docs/ai-integration-log.md` or dedicated README section) documenting agent-assisted development decisions and key implementation notes
**And** `.env.example` matches all required variables from architecture
