# Marketing Site-Wide Updates — Design Spec (Part B)

**Date:** 2026-04-04
**Branch:** feature/marketing-reimagine
**Base:** All file references are against the `feature/marketing-reimagine` branch — NOT main.
**Scope:** Site-wide updates following homepage Part A. Adds 4 new pages, updates CommandsTable to 33 commands, and adds Getting Started to the navbar.

---

## 1. Context

The homepage (Part A) added DayInLifeSection and bumped to v3.10.0. Part B expands the site to cover the full v3.10.0 command set (33 commands, up from 25) and adds dedicated pages for Getting Started, Deployment, Email & Announcements, and Companion Plugins.

**What doesn't change:** Homepage sections, AutoLoopTerminal, TechStackBento, DiscoverySection, AgentPluginShowcase, DayInLifeSection, CTASection, design system.

**What changes:** CommandsTable data + categories, commands page count text, Navbar (add Getting Started), 4 new pages.

---

## 2. Approach

Max reuse of existing section components. Two pages (`/getting-started`, `/companion-plugins`) compose entirely from existing components. Two pages (`/deployment`, `/announce`) each need one new section component. No design system changes.

---

## 3. Changes

### 3.1 CommandsTable — 33 commands, new categories

**File:** `apps/marketing/src/components/sections/CommandsTable.tsx`

Replace the `COMMANDS` array and `Category` type entirely. **All 25 existing commands are removed — this is a full replacement, not an update.** The old `Docs` category and commands like `/x4:docs`, `/x4:plan`, `/x4:ship`, `/x4:add-page`, `/x4:add-schema`, `/x4:add-router`, `/x4:add-table`, `/x4:add-middleware`, `/x4:add-form`, `/x4:add-hook`, `/x4:add-env`, `/x4:add-workflow`, `/x4:add-test`, `/x4:work-batch`, `/x4:review`, `/x4:check-boundaries`, `/x4:llmstxt-update` are retired.

**New categories:** `All` | `Setup` | `Planning` | `Build` | `Discovery` | `Announce` | `DevOps` | `Open Source`

**Full command list:**

| Command                | Description                                                             | Category    |
| ---------------------- | ----------------------------------------------------------------------- | ----------- |
| `/x4:create`           | Scaffold a new full-stack monorepo with interactive preset              | Setup       |
| `/x4:onboard`          | Check local dev environment and walk through setup                      | Setup       |
| `/x4:add`              | Add a new mobile app or web app to an existing project                  | Setup       |
| `/x4:deploy-setup`     | One-time Railway deployment wizard — creates project, generates domains | Setup       |
| `/x4:env`              | Set up or update environment variables for the project                  | Setup       |
| `/x4:init-setup`       | Interactive wizard to configure database, hosting, CI, package manager  | Setup       |
| `/x4:init-agents`      | Generate project-specific agent files from templates                    | Setup       |
| `/x4:init-tracker`     | Scaffold project tracking files (STATUS.md, BACKLOG.md)                 | Setup       |
| `/x4:e2e-setup`        | Scaffold Playwright e2e test suites for rpg-life apps                    | Setup       |
| `/x4:kickstart`        | Brainstorm app vision, design UI, batch-generate PRDs                   | Planning    |
| `/x4:plan-backlog`     | Triage backlog, brainstorm approaches, create implementation plan       | Planning    |
| `/x4:idea`             | Add an idea or feature to the project backlog                           | Planning    |
| `/x4:work`             | Pick up next piece of work, dispatch agent team, and ship it            | Build       |
| `/x4:run-tests`        | Run all configured test commands from agent-team config                 | Build       |
| `/x4:verify-local`     | Run all configured checks with auto-fix — mandatory before PRs          | Build       |
| `/x4:upgrade`          | Apply x4 project migrations after a plugin update                       | Build       |
| `/x4:gaps`             | Find product gaps — dead ends, missing connections, incomplete flows    | Discovery   |
| `/x4:dream`            | Explore big ideas — bold features and untapped directions               | Discovery   |
| `/x4:market-update`    | Sync marketing site with recently shipped features                      | Announce    |
| `/x4:market-email`     | Generate a release email campaign from recent changelog                 | Announce    |
| `/x4:market-linkedin`  | Generate a LinkedIn post from recently shipped features                 | Announce    |
| `/x4:market-tweet`     | Generate an X/Twitter thread from recently shipped features             | Announce    |
| `/x4:market-subscribe` | Scaffold an email capture form into the marketing site                  | Announce    |
| `/x4:pr-create`        | Create a feature branch, DB branch, push, and open a draft PR           | DevOps      |
| `/x4:pr-status`        | Check current branch's PR status — CI checks, preview URLs              | DevOps      |
| `/x4:pr-cleanup`       | Post-merge cleanup — delete DB branch and remove local git branch       | DevOps      |
| `/x4:doctor`           | Diagnose project setup — checks prerequisites, config, env vars         | DevOps      |
| `/x4:status`           | Quick dashboard showing app status, ports, database, git                | DevOps      |
| `/x4:tour`             | Guided post-scaffold tour of your rpg-life project                       | DevOps      |
| `/x4:help`             | Show all available commands and contextual next step                    | DevOps      |
| `/x4:opensrc-init`     | Set up opensrc — fetches npm package source code for AI agents          | Open Source |
| `/x4:opensrc-status`   | Check opensrc health — which packages have source fetched               | Open Source |
| `/x4:opensrc-update`   | Refresh opensrc — add source for new deps, update outdated              | Open Source |

### 3.2 Commands page — count text

**File:** `apps/marketing/src/app/commands/page.tsx`

Two string replacements:

- `metadata.description`: `'25 commands for...'` → `'33 commands for...'`
- Page body: `<span className="gradient-text font-semibold">25 commands</span>` → `<span className="gradient-text font-semibold">33 commands</span>`

### 3.3 Navbar — add Getting Started

**File:** `apps/marketing/src/components/layout/Navbar.tsx`

Add `{ href: '/getting-started', label: 'Getting Started' }` as the first item in `NAV_LINKS`, before the current first link. Only `/getting-started` is added to the navbar. The other three new pages (`/deployment`, `/companion-plugins`, `/announce`) are accessible via direct URL only — no navbar entries for them.

Current:

```ts
const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/kickstart', label: 'Kickstart' },
  { href: '/commands', label: 'Commands' },
  { href: '/teams', label: 'For Teams' },
];
```

After:

```ts
const NAV_LINKS = [
  { href: '/getting-started', label: 'Getting Started' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/kickstart', label: 'Kickstart' },
  { href: '/commands', label: 'Commands' },
  { href: '/teams', label: 'For Teams' },
];
```

### 3.4 New page: /getting-started

**File:** `apps/marketing/src/app/getting-started/page.tsx`

- Metadata: `title: 'Getting Started — x4'`, `description: 'From zero to running app in minutes. Install x4, scaffold your project, and start building — all from Claude Code.'`
- Hero: "From zero to running app in minutes."
- Sub-headline: "Install x4, scaffold your project, and start building — all from Claude Code."
- Body: `<PluginInstall />` component (already has the 3-command install block + team config JSON)
- No new section components needed.

### 3.5 New page: /companion-plugins

**File:** `apps/marketing/src/app/companion-plugins/page.tsx`

- Metadata: `title: 'Companion Plugins — x4'`, `description: 'x4 relies on a set of companion plugins. Required ones are installed automatically by /x4:onboard.'`
- Hero: "The plugins that power x4."
- Sub-headline: "x4 relies on a set of companion plugins. Required ones are installed automatically by `/x4:onboard`."
- Body: `<CompanionPlugins />` then `<HooksSection />`
- No new section components needed.

### 3.6 New page: /deployment

**File:** `apps/marketing/src/app/deployment/page.tsx`
**New component:** `apps/marketing/src/components/sections/DeploymentFlow.tsx`

- Metadata: `title: 'Deployment — x4'`, `description: 'One command sets up your entire Railway project — services, domains, and PR previews.'`
- Hero: "Deploy to Railway. Zero config."
- Sub-headline: "One command sets up your entire Railway project — services, domains, and PR previews."
- Body: `<DeploymentFlow />`

**DeploymentFlow component:** 3 cards showing the deployment workflow. Cards use the same individual card styling as DayInLifeSection (`border-l-2`, `bg-slate-900/50 border border-slate-800 rounded-lg p-4`), but the container layout is a **vertical stack** (`flex flex-col gap-4`), not DayInLifeSection's horizontal row. Do not copy the chapter container from DayInLifeSection — only copy the individual card `className` and `style`. Layout: max-w-2xl centered. Deployment color: `#3b82f6` (blue). Animation: same `useRef/useInView` pattern.

| Command            | Outcome                                                         |
| ------------------ | --------------------------------------------------------------- |
| `/x4:deploy-setup` | Railway project created, services configured, domains generated |
| Push to main       | Production deploys automatically via GitHub integration         |
| Open a PR          | Preview environment spins up, URL posted as PR comment          |

### 3.7 New page: /announce

**File:** `apps/marketing/src/app/announce/page.tsx`
**New component:** `apps/marketing/src/components/sections/AnnounceCommands.tsx`

- Metadata: `title: 'Email & Announcements — x4'`, `description: 'Five commands. One changelog. Every channel covered — email, LinkedIn, X, and your marketing site.'`
- Hero: "Tell the world what shipped."
- Sub-headline: "Five commands. One changelog. Every channel covered."
- Body: `<AnnounceCommands />`

**AnnounceCommands component:** 5 command cards in a 2-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4`), max-w-3xl centered. Same card style as DayInLifeSection. Amber color (`#f59e0b`) for all cards. Note: four of these five commands also appear in DayInLifeSection Chapter 05 — this is intentional. `/announce` is the dedicated deep-dive page; the homepage chapter is a summary.

| Command                | Outcome                                         |
| ---------------------- | ----------------------------------------------- |
| `/x4:market-update`    | Sync marketing site with what shipped           |
| `/x4:market-email`     | Generate release email from changelog           |
| `/x4:market-linkedin`  | Write LinkedIn post, copy to clipboard          |
| `/x4:market-tweet`     | Write X thread, 280-char enforced               |
| `/x4:market-subscribe` | Scaffold email capture form into marketing site |

Animation: same `useRef/useInView` pattern, stagger per card with `delay: index * 0.08`.

---

## 4. File Map

| Action | File                                                          | What changes                                           |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------ |
| Modify | `apps/marketing/src/components/sections/CommandsTable.tsx`    | Full data replacement — 33 commands, new Category type |
| Modify | `apps/marketing/src/app/commands/page.tsx`                    | "25" → "33" in two places                              |
| Modify | `apps/marketing/src/components/layout/Navbar.tsx`             | Add Getting Started as first nav link                  |
| Create | `apps/marketing/src/app/getting-started/page.tsx`             | Hero + PluginInstall                                   |
| Create | `apps/marketing/src/app/companion-plugins/page.tsx`           | Hero + CompanionPlugins + HooksSection                 |
| Create | `apps/marketing/src/app/deployment/page.tsx`                  | Hero + DeploymentFlow                                  |
| Create | `apps/marketing/src/components/sections/DeploymentFlow.tsx`   | 3-step Railway deployment flow                         |
| Create | `apps/marketing/src/app/announce/page.tsx`                    | Hero + AnnounceCommands                                |
| Create | `apps/marketing/src/components/sections/AnnounceCommands.tsx` | 5 market-\* command cards                              |

---

## 5. Implementation Notes

- All pages use `export const metadata: Metadata = { ... }` for SEO (same pattern as existing pages)
- `'use client'` required on DeploymentFlow and AnnounceCommands (they use motion/react)
- Type-check after each task: `bun turbo type-check --filter=@rpg-life/marketing`
- No API calls — all content is hardcoded
- Design tokens (OKLCH, glass cards, motion/react, Tailwind v4) unchanged
