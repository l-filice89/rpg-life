# Marketing Homepage Update — Design Spec

**Date:** 2026-04-04
**Branch:** feature/marketing-reimagine
**Base:** All file references are against the `feature/marketing-reimagine` branch — NOT main. This branch contains the previously completed marketing reimagine (HeroDescribeApp, AutoLoopTerminal, DiscoverySection, CTASection, page.tsx wiring 6 sections, etc.). Reviewers and implementers must check out or reference that branch.
**Scope:** Homepage-only update (Part A). Adds DayInLifeSection, bumps hero version badge, updates CTASection install block. Existing sections unchanged.

---

## 1. Context

The marketing site was rebuilt in the previous sprint (v3.5.0 narrative, 6-section homepage). x4 is now at v3.10.0 with a significantly expanded command set (33 commands), a full announce workflow, and Railway deploy automation. The brief identifies "Day in the Life" as the primary new storytelling device — showing how a developer actually lives with x4 over Day 1, Day 2, and beyond.

**What doesn't change:** HeroDescribeApp typewriter mechanic, AutoLoopTerminal, TechStackBento, DiscoverySection, AgentPluginShowcase. Design system (OKLCH, glass cards, Motion, Tailwind v4) unchanged.

**What changes:** Version badge in hero, new DayInLifeSection (inserts after hero), CTASection install block.

---

## 2. Changes

### 2.1 HeroDescribeApp — version badge only

Update the badge text from:

```
v3.5.0 · Claude Code Plugin · Apache 2.0
```

to:

```
v3.10.0 · Claude Code Plugin · Apache 2.0
```

File: `apps/marketing/src/components/hero/HeroDescribeApp.tsx`

---

### 2.2 NEW: DayInLifeSection

**File:** `apps/marketing/src/components/sections/DayInLifeSection.tsx`

**Headline:** "A day in the life."
**Sub-headline:** "From zero to shipped app — with one plugin."

Five stacked chapters. Each chapter is a label row above a horizontal row of command cards.

#### Chapter structure

| #   | Label                                                 | Color              | Commands                                                   |
| --- | ----------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| 1   | Day 1 · Morning — Get your machine ready              | violet (`#7c3aed`) | onboard, create, deploy-setup, tour                        |
| 2   | Day 1 · Afternoon — Plan everything you want to build | blue (`#3b82f6`)   | kickstart                                                  |
| 3   | Day 2 — Agent teams build your features               | green (`#4ade80`)  | work                                                       |
| 4   | Week 2+ — Find what's missing and what's next         | cyan (`#06b6d4`)   | gaps, dream, plan-backlog, work                            |
| 5   | Ongoing — Tell the world what shipped                 | amber (`#f59e0b`)  | market-update, market-email, market-linkedin, market-tweet |

#### Command card design

Each card shows:

- **Command:** `/x4:command` — monospace, violet (`text-violet-400 font-mono`)
- **Outcome:** one-line description — muted text (`text-slate-400 text-sm`)
- **Left border accent:** chapter color (e.g. `border-l-2 border-violet-500`)
- **Card background:** `bg-slate-900/50 border border-slate-800 rounded-lg p-4`

**Command outcomes (exact text):**

Chapter 1 (violet):

- `/x4:onboard` — "Machine ready, companion plugins installed"
- `/x4:create my-app` — "Full-stack monorepo scaffolded in seconds"
- `/x4:deploy-setup` — "Railway configured, PR previews enabled"
- `/x4:tour` — "Test login, try AI chat, explore your running app"

Chapter 2 (blue):

- `/x4:kickstart` — "Brainstorm features, design UI, batch-generate PRDs"

Chapter 3 (green):

- `/x4:work` — "Auto-loop: agents build all features, one PR at a time"

Chapter 4 (cyan):

- `/x4:gaps` — "Find dead ends, missing connections, incomplete flows"
- `/x4:dream` — "Explore bold ideas informed by your tech stack"
- `/x4:plan-backlog` — "Turn selected ideas into PRDs"
- `/x4:work` — "Build the next wave"

Chapter 5 (amber):

- `/x4:market-update` — "Sync marketing site with what shipped"
- `/x4:market-email` — "Generate release email from changelog"
- `/x4:market-linkedin` — "Write LinkedIn post, copy to clipboard"
- `/x4:market-tweet` — "Write X thread, 280-char enforced"

#### Layout

- Chapter label: `font-mono text-xs uppercase tracking-wider` in chapter color. Format: `01 · DAY 1 · MORNING — GET YOUR MACHINE READY` (zero-padded two-digit number, interpunct separators, all caps). Each chapter's number is its position: `01`–`05`.
- Cards within a chapter: `flex flex-col gap-3 md:flex-row md:flex-wrap`
- Chapter rows: `flex flex-col gap-8` (stacked vertically with generous spacing)
- Section padding: `py-20 px-4`, `max-w-5xl mx-auto`

#### Animation

- `'use client'` directive
- Single `useRef` + `useInView(ref, { once: true, margin: '-80px' })` on the outer section container — same pattern as `AutoLoopTerminal.tsx`. One `isInView` boolean drives all chapters.
- Each chapter is a `motion.div` with `initial={{ opacity: 0, y: 20 }}` and `animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}`. Stagger via `transition={{ delay: index * 0.1 }}` where `index` is the chapter's position (0–4).

---

### 2.3 CTASection — updated install block

**File:** `apps/marketing/src/components/sections/CTASection.tsx`

Replace the existing 3-command install block with:

```bash
# Add the marketplace
/plugin marketplace add studiox4/x4-agent-plugins

# Install x4
/plugin install x4@rpg-life-agent-plugins

# Start onboarding
/x4:onboard
```

Headline stays: "Ready to stop building manually?"
Sub-headline stays: "Three commands. Your machine is ready. Your agents are waiting."
Footer line: `v3.10.0 · Apache 2.0 · studiox4/x4-agent-plugins`

---

### 2.4 Homepage wiring

**File:** `apps/marketing/src/app/page.tsx`

Insert `<DayInLifeSection />` between `<HeroDescribeApp />` and `<AutoLoopTerminal />`:

```tsx
<HeroDescribeApp />
<DayInLifeSection />
<AutoLoopTerminal />
<TechStackBento />
<DiscoverySection />
<AgentPluginShowcase />
<CTASection />
```

---

## 3. Component Inventory

### New

| Component          | Location               | Purpose                         |
| ------------------ | ---------------------- | ------------------------------- |
| `DayInLifeSection` | `components/sections/` | 5-chapter command card timeline |

### Modified

| Component         | Change                                       |
| ----------------- | -------------------------------------------- |
| `HeroDescribeApp` | Version badge: v3.5.0 → v3.10.0              |
| `CTASection`      | New 3-command install block + footer version |
| `app/page.tsx`    | Insert DayInLifeSection                      |

### Unchanged

AutoLoopTerminal, TechStackBento, DiscoverySection, AgentPluginShowcase, Navbar, all sub-pages.

---

## 4. Implementation Notes

- No live API calls. All content is hardcoded.
- `'use client'` on DayInLifeSection (needs Motion).
- Type-check after every component: `bun turbo type-check --filter=@rpg-life/marketing`
- No `output: 'export'` — site deploys to Railway as standard Next.js.
- Design tokens (OKLCH variables) unchanged.
