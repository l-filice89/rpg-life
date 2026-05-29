# Marketing Site Reimagine — Design Spec

**Date:** 2026-04-03
**Branch:** feature/marketing-reimagine
**Approach:** A — Homepage-first reimagine. Refactor and rebuild the homepage narrative, add four new pages, update nav. Reuse the existing design system (OKLCH colors, Tailwind v4, Motion, glass morphism). Retire stale pages.

---

## 1. Context

The x4 plugin has reached v3.5.0. The marketing site still reflects an older positioning — x4 as a boilerplate, with a feature-grid structure. The product is now a complete Claude Code plugin with a flagship kickstart flow, 5-agent build pipeline with auto-loop, discovery tools (gaps + dream), and health diagnostics. The site needs to reflect this.

**What doesn't change:** Design system (OKLCH colors, glass cards, Motion animations, Tailwind v4, Three.js-free after hero). Component library (most reusable — CTASection, AnimatedTerminal, TechStackBento, GlowCard, etc. get refactored in place).

**What changes:** Everything structural — hero, narrative arc, nav, page lineup, copy, stats.

---

## 2. Core Design Decisions

| Decision     | Choice                                                                     | Rationale                                                                 |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Primary goal | Belief-first                                                               | Change how developers think about building software, not just sell a tool |
| Hero concept | "Describe Your App" input + Living Terminal                                | Interactive moment hooks immediately; terminal rewards technical audience |
| Homepage arc | 6 sections (Magic → Proof → Trust → Wonder → Belonging → Action)           | Skepticism fades gradually — visitor never feels sold to                  |
| Navigation   | Product-focused: How It Works · Kickstart · Commands · For Teams + Install | Feature-centric, bookmarkable, familiar SaaS pattern                      |
| 3D hero      | Retired                                                                    | Three.js scene replaced with deep space gradient + subtle particle field  |

---

## 3. Navigation

**New nav:** `x4 | How It Works | Kickstart | Commands | For Teams | [Install CTA]`

**Pages retired:** `/features`, `/stack`, `/ai`, `/plugins` — their content folded into homepage sections and new sub-pages.

**Pages kept:** `/about` (minor copy updates only)

---

## 4. Homepage — 6-Section Scroll Journey

### ① Hero: "Describe Your App"

- **Full viewport.** No 3D scene — deep space gradient background with subtle CSS particle field.
- **Headline:** "What are you building?"
- **Sub-headline:** "Describe your app. x4 plans it, agents build it, ships it to production."
- **The input:** Typewriter-animated pre-scripted phrase (e.g. "A fitness tracker with AI coaching and social features"). NOT a live Claude API call — deterministic, fast, always works.
- **The reveal:** After input completes, a plan card animates in showing 8 feature tags + "8 features · 4 phases · PRDs ready" + `Run /x4:work to start building →`
- **Scroll indicator:** "↓ watch agents build it"
- **Implementation:** New `HeroDescribeApp.tsx` component. Replaces `HeroContent.tsx` + `HeroSceneLoader.tsx`. Uses Motion for typewriter + card entrance.

### ② Living Terminal: "Watch Agents Build It"

- **Headline:** "Your terminal just got a team."
- **Sub-headline:** "Eight features. One command. Agents handle the rest."
- **Agent status bar:** Five pills (Backend ●green, Frontend ●green, Reviewer ●amber, Tester ●blue, Performance ●purple) + auto-loop progress indicator on the right.
- **Terminal window:** Animated log showing 6 PRDs merged, 1 in progress, 1 queued. Uses extended `AnimatedTerminal` component. These numbers are **illustrative/hardcoded** — they are not derived from Section 6 canonical stats and should not be updated when stats change.
- **Stats row:** 3 counters — PRs merged / agents active / manual PRs written (always 0). These are also illustrative animation values, not canonical stats.
- **Implementation:** New `AutoLoopTerminal.tsx`. Reuses `AnimatedTerminal` internally.

### ③ Real Stack: "The stack you would have chosen anyway."

- **Sub-headline:** "Not scaffolded toys. Not locked-in frameworks. The exact tools senior engineers pick."
- **10-logo tech grid:** Next.js 15, Hono, tRPC 11, Drizzle, Neon, Better Auth, Vercel AI SDK, Expo 52, Turborepo, Bun.
- **Preset pills:** saas · full-stack · landing · api-only (with saas highlighted)
- **Command line:** `/x4:create my-app --preset saas`
- **Implementation:** Refactor existing `TechStackBento.tsx` — strip bento layout, replace with tighter logo grid + preset pills.

### ④ Discovery Loop: "Shipped is never finished."

- **Sub-headline:** "x4 scans what you've built and finds what's missing before your users do."
- **Two-column card split:**
  - Left: `/x4:gaps` — shows dead ends, missing connections, incomplete flows with severity colors. Checkbox UI to send to backlog.
  - Right: `/x4:dream` — shows "What if / What's next / What's emerging" ideas with color-coded categories. Checkbox UI.
- **Footer line:** "Selected ideas feed straight back into /x4:work. The loop never ends."
- **Implementation:** New `DiscoverySection.tsx` component.

### ⑤ Agent Team: "Five specialists. One pipeline."

- **Sub-headline:** "Each agent owns its domain. None can touch what isn't theirs."
- **5 agent cards:** Backend, Frontend (+ frontend-design badge), Reviewer (+ code-review badge), Tester (+ playwright badge), Performance. Each has icon, name, scope description, companion plugin badge where applicable.
- **Implementation:** Refactor existing `AgentPluginShowcase.tsx` — update copy, add companion plugin badges, tighten layout. (`AgentShowcase.tsx` is a separate unused variant in the same directory — do not edit it.)

### ⑥ Install CTA: "Ready to stop building manually?"

- **Sub-headline:** "Three commands. Your machine is ready. Your agents are waiting."
- **Code block:** The 3-command install sequence with comments.
- **Two buttons:** "Install x4" (primary/purple) + "View on GitHub ↗" (secondary)
- **Footer line:** `v3.5.0 · Apache 2.0 · studiox4/x4-agent-plugins`
- **Implementation:** Refactor existing `CTASection.tsx`.

---

## 5. Sub-pages (4 new)

### /kickstart

- Hero: `/x4:kickstart` pill + "From blank page to full plan in one session."
- 6-step horizontal flow (Vision → Brainstorm → Prioritize → UI Design → Batch PRDs → Summary), each step color-coded.
- Code snippet at bottom: `/x4:work ← agents build all features, in order, automatically`
- Sections below: "Three ways to plan" (Kickstart vs Incremental vs Discovery), full step-by-step detail for each of the 6 steps.
- **New file:** `app/kickstart/page.tsx` + `components/sections/KickstartFlow.tsx`

### /commands

- Header: "Command Reference" + "27 commands · all under /x4:"
- Search input + category filter tabs (All · Setup · Planning · Discovery · Build · Docs)
- Full scrollable table: command | description | category
- All 27 commands from the brief, accurate.
- **New files:** `app/commands/page.tsx` + `components/sections/CommandsTable.tsx`

### /discovery

- Hero: "Your product tells you what it needs next."
- Two-panel explainer: `/x4:gaps` (left, purple border) + `/x4:dream` (right, green border) with full descriptions.
- Pipeline diagram below showing: gaps/dream → backlog → plan-backlog → work → ship → gaps again (the loop).
- **New files:** `app/discovery/page.tsx` + `components/sections/DiscoveryExplainer.tsx`

### /teams

- Hero: "Ship the workflow with the code."
- The `settings.json` snippet (syntax-highlighted).
- 3 benefit cards: Auto-installs for new teammates / Same plugin version / No manual setup.
- Section below: "Companion plugins" — the full ecosystem table showing required vs recommended. Companion plugins table is inlined directly in `app/teams/page.tsx` (no separate component file needed — it's a simple static table, not reused elsewhere).
- **New files:** `app/teams/page.tsx`

---

## 6. Stats / Numbers (updated)

All occurrences of stats across the site must use these numbers:

- **27 commands** (not 24)
- **5 agents**
- **4 project presets**
- **7-phase build pipeline**
- **6-step kickstart**
- **2 discovery tools**
- **9 companion plugins**
- **4 built-in hooks**
- **1 install command**

---

## 7. Component Inventory

### New components

| Component            | Location               | Purpose                                      |
| -------------------- | ---------------------- | -------------------------------------------- |
| `HeroDescribeApp`    | `components/hero/`     | Replaces HeroContent + HeroSceneLoader       |
| `AutoLoopTerminal`   | `components/sections/` | Section ② — living terminal with agent pills |
| `DiscoverySection`   | `components/sections/` | Section ④ — gaps + dream cards               |
| `KickstartFlow`      | `components/sections/` | /kickstart page — 6-step flow                |
| `CommandsTable`      | `components/sections/` | /commands page — searchable table            |
| `DiscoveryExplainer` | `components/sections/` | /discovery page                              |

### Refactored (keep, update)

| Component             | Changes                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `AnimatedTerminal`    | Extended with agent status bar                                                                                      |
| `TechStackBento`      | Stripped to logo grid + presets                                                                                     |
| `AgentPluginShowcase` | Updated copy + companion plugin badges                                                                              |
| `CTASection`          | Updated copy, new 3-command install block                                                                           |
| `Navbar`              | New links: How It Works · Kickstart · Commands · For Teams + Install CTA (file: `src/components/layout/Navbar.tsx`) |
| `CompanionPlugins`    | Updated with 9 plugins (3 required, 6 recommended)                                                                  |
| `HooksSection`        | Updated with 4 hooks including session-start/llms.txt check                                                         |
| `StatsCounter`        | Updated numbers (27 commands, etc.)                                                                                 |

### Retired (delete)

| Component             | Reason                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `HeroScene.tsx`       | 3D scene removed                                                                                    |
| `HeroSceneLoader.tsx` | No longer needed                                                                                    |
| `PluginPipeline.tsx`  | Replaced by AutoLoopTerminal                                                                        |
| `SkillsSection.tsx`   | Content folded into /commands                                                                       |
| `StickyScroll.tsx`    | Not used in new layout                                                                              |
| `FeatureVisuals.tsx`  | Replaced by new sections                                                                            |
| `WorkflowDemo.tsx`    | Replaced by AutoLoopTerminal                                                                        |
| `PhilosophyCards.tsx` | /about stays minimal                                                                                |
| `BentoGrid.tsx`       | Replaced by new section structure                                                                   |
| `CodeShowcase.tsx`    | Retired — not used in new homepage layout; code examples covered by inline snippets in each section |

### Pages retired

`app/features/`, `app/stack/`, `app/ai/`, `app/plugins/` — delete these directories.

`app/docs/` — **retire and redirect.** The `/docs` route is currently in the nav (as `Docs`) but is not included in the new nav. Delete `app/docs/page.tsx`. Add a redirect in `next.config.ts`: `/docs → https://github.com/studiox4/x4-agent-plugins` (the GitHub repo) until a dedicated docs site exists.

---

## 8. Implementation Notes

- **No live API calls in the hero.** The typewriter input and plan card are fully pre-scripted and animated.
- **Branch:** All work on `feature/marketing-reimagine`. Never commit directly to main.
- **Three.js removal:** After deleting HeroScene/HeroSceneLoader, remove all four packages from `package.json`: `three`, `@react-three/fiber`, `@react-three/drei` (dependencies) and `@types/three` (devDependencies). Saves ~300KB+ from the bundle.
- **Type-check after every major component change:** `bun turbo type-check --filter=@rpg-life/marketing`
- **No server-side code:** Do not use `use server`, API routes, or `getServerSideProps`. All new pages use `use client` or are pure server components with no data fetching. The site is deployed to Railway as a standard Next.js app (no `output: 'export'` — do not add it).
- **Existing design tokens** (OKLCH variables in globals.css) stay unchanged.
