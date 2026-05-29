# Marketing Site-Wide Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the marketing site to 33 commands, add 4 new pages (Getting Started, Companion Plugins, Deployment, Email & Announcements), and add Getting Started to the navbar.

**Architecture:** All work is on branch `feature/marketing-reimagine` in the worktree at `/Users/corbanbaxter/Development/rpg-life/.worktrees/marketing-reimagine`. Tasks 1–5 are fully independent and can run in parallel. Tasks 6–7 each create a section component and its page in one commit. No design system changes — follow existing patterns throughout.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, `motion/react` (NOT framer-motion), TypeScript. Type-check: `bun turbo type-check --filter=@rpg-life/marketing` from the worktree root.

---

## File Map

| Action | File                                                          | What changes                                           |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------ |
| Modify | `apps/marketing/src/components/sections/CommandsTable.tsx`    | Full data replacement — 33 commands, new Category type |
| Modify | `apps/marketing/src/app/commands/page.tsx`                    | "25" → "33" in two places                              |
| Modify | `apps/marketing/src/components/layout/Navbar.tsx`             | Add Getting Started as first nav link                  |
| Create | `apps/marketing/src/app/getting-started/page.tsx`             | Hero + PluginInstall                                   |
| Create | `apps/marketing/src/app/companion-plugins/page.tsx`           | Hero + CompanionPlugins + HooksSection                 |
| Create | `apps/marketing/src/components/sections/DeploymentFlow.tsx`   | 3-step Railway deployment flow                         |
| Create | `apps/marketing/src/app/deployment/page.tsx`                  | Hero + DeploymentFlow                                  |
| Create | `apps/marketing/src/components/sections/AnnounceCommands.tsx` | 5 market-\* command cards                              |
| Create | `apps/marketing/src/app/announce/page.tsx`                    | Hero + AnnounceCommands                                |

---

## Task 1: Update CommandsTable to 33 commands

**Files:**

- Modify: `apps/marketing/src/components/sections/CommandsTable.tsx`

- [ ] **Step 1: Replace the entire file content**

  Replace with:

  ```tsx
  'use client';

  import { useState } from 'react';
  import { cn } from '@/lib/utils';

  type Category =
    | 'All'
    | 'Setup'
    | 'Planning'
    | 'Build'
    | 'Discovery'
    | 'Announce'
    | 'DevOps'
    | 'Open Source';

  interface Command {
    command: string;
    description: string;
    category: Exclude<Category, 'All'>;
  }

  const COMMANDS: Command[] = [
    {
      command: '/x4:create',
      description: 'Scaffold a new full-stack monorepo with interactive preset',
      category: 'Setup',
    },
    {
      command: '/x4:onboard',
      description: 'Check local dev environment and walk through setup',
      category: 'Setup',
    },
    {
      command: '/x4:add',
      description: 'Add a new mobile app or web app to an existing project',
      category: 'Setup',
    },
    {
      command: '/x4:deploy-setup',
      description: 'One-time Railway deployment wizard — creates project, generates domains',
      category: 'Setup',
    },
    {
      command: '/x4:env',
      description: 'Set up or update environment variables for the project',
      category: 'Setup',
    },
    {
      command: '/x4:init-setup',
      description: 'Interactive wizard to configure database, hosting, CI, package manager',
      category: 'Setup',
    },
    {
      command: '/x4:init-agents',
      description: 'Generate project-specific agent files from templates',
      category: 'Setup',
    },
    {
      command: '/x4:init-tracker',
      description: 'Scaffold project tracking files (STATUS.md, BACKLOG.md)',
      category: 'Setup',
    },
    {
      command: '/x4:e2e-setup',
      description: 'Scaffold Playwright e2e test suites for rpg-life apps',
      category: 'Setup',
    },
    {
      command: '/x4:kickstart',
      description: 'Brainstorm app vision, design UI, batch-generate PRDs',
      category: 'Planning',
    },
    {
      command: '/x4:plan-backlog',
      description: 'Triage backlog, brainstorm approaches, create implementation plan',
      category: 'Planning',
    },
    {
      command: '/x4:idea',
      description: 'Add an idea or feature to the project backlog',
      category: 'Planning',
    },
    {
      command: '/x4:work',
      description: 'Pick up next piece of work, dispatch agent team, and ship it',
      category: 'Build',
    },
    {
      command: '/x4:run-tests',
      description: 'Run all configured test commands from agent-team config',
      category: 'Build',
    },
    {
      command: '/x4:verify-local',
      description: 'Run all configured checks with auto-fix — mandatory before PRs',
      category: 'Build',
    },
    {
      command: '/x4:upgrade',
      description: 'Apply x4 project migrations after a plugin update',
      category: 'Build',
    },
    {
      command: '/x4:gaps',
      description: 'Find product gaps — dead ends, missing connections, incomplete flows',
      category: 'Discovery',
    },
    {
      command: '/x4:dream',
      description: 'Explore big ideas — bold features and untapped directions',
      category: 'Discovery',
    },
    {
      command: '/x4:market-update',
      description: 'Sync marketing site with recently shipped features',
      category: 'Announce',
    },
    {
      command: '/x4:market-email',
      description: 'Generate a release email campaign from recent changelog',
      category: 'Announce',
    },
    {
      command: '/x4:market-linkedin',
      description: 'Generate a LinkedIn post from recently shipped features',
      category: 'Announce',
    },
    {
      command: '/x4:market-tweet',
      description: 'Generate an X/Twitter thread from recently shipped features',
      category: 'Announce',
    },
    {
      command: '/x4:market-subscribe',
      description: 'Scaffold an email capture form into the marketing site',
      category: 'Announce',
    },
    {
      command: '/x4:pr-create',
      description: 'Create a feature branch, DB branch, push, and open a draft PR',
      category: 'DevOps',
    },
    {
      command: '/x4:pr-status',
      description: "Check current branch's PR status — CI checks, preview URLs",
      category: 'DevOps',
    },
    {
      command: '/x4:pr-cleanup',
      description: 'Post-merge cleanup — delete DB branch and remove local git branch',
      category: 'DevOps',
    },
    {
      command: '/x4:doctor',
      description: 'Diagnose project setup — checks prerequisites, config, env vars',
      category: 'DevOps',
    },
    {
      command: '/x4:status',
      description: 'Quick dashboard showing app status, ports, database, git',
      category: 'DevOps',
    },
    {
      command: '/x4:tour',
      description: 'Guided post-scaffold tour of your rpg-life project',
      category: 'DevOps',
    },
    {
      command: '/x4:help',
      description: 'Show all available commands and contextual next step',
      category: 'DevOps',
    },
    {
      command: '/x4:opensrc-init',
      description: 'Set up opensrc — fetches npm package source code for AI agents',
      category: 'Open Source',
    },
    {
      command: '/x4:opensrc-status',
      description: 'Check opensrc health — which packages have source fetched',
      category: 'Open Source',
    },
    {
      command: '/x4:opensrc-update',
      description: 'Refresh opensrc — add source for new deps, update outdated',
      category: 'Open Source',
    },
  ];

  const CATEGORIES: Category[] = [
    'All',
    'Setup',
    'Planning',
    'Build',
    'Discovery',
    'Announce',
    'DevOps',
    'Open Source',
  ];

  const CATEGORY_STYLES: Record<Exclude<Category, 'All'>, string> = {
    Setup: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    Planning: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    Discovery: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30',
    Build: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    Announce: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    DevOps: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30',
    'Open Source': 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
  };

  export function CommandsTable() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    const filtered = COMMANDS.filter((cmd) => {
      const matchesSearch =
        search === '' ||
        cmd.command.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="mx-auto max-w-4xl px-6">
        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card/50 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Category filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border">
          {/* Header */}
          <div className="grid grid-cols-[2fr_3fr_auto] gap-4 border-b border-border bg-card/50 px-6 py-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Command
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </div>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No commands match your search.
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.command}
                className={cn(
                  'grid grid-cols-[2fr_3fr_auto] items-center gap-4 px-6 py-3.5',
                  i % 2 === 1 && 'bg-card/20',
                  i < filtered.length - 1 && 'border-b border-border/50',
                )}
              >
                <div className="font-mono text-sm text-violet-400">{cmd.command}</div>
                <div className="text-sm text-muted-foreground">{cmd.description}</div>
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      CATEGORY_STYLES[cmd.category],
                    )}
                  >
                    {cmd.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p className="mt-4 text-right text-xs text-muted-foreground">
            {filtered.length} of {COMMANDS.length} commands
          </p>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`, 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/marketing/src/components/sections/CommandsTable.tsx
  git commit -m "feat(marketing): update CommandsTable to 33 commands with new categories"
  ```

---

## Task 2: Update commands page count text

**Files:**

- Modify: `apps/marketing/src/app/commands/page.tsx`

- [ ] **Step 1: Update metadata description**

  Change:

  ```
  '25 commands for the complete AI development workflow. Scaffold, plan, build, discover, and ship — all from your terminal.'
  ```

  To:

  ```
  '33 commands for the complete AI development workflow. Scaffold, plan, build, discover, and ship — all from your terminal.'
  ```

- [ ] **Step 2: Update hero count**

  Change:

  ```tsx
  <span className="gradient-text font-semibold">25 commands</span>
  ```

  To:

  ```tsx
  <span className="gradient-text font-semibold">33 commands</span>
  ```

- [ ] **Step 3: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/app/commands/page.tsx
  git commit -m "feat(marketing): update commands page count to 33"
  ```

---

## Task 3: Add Getting Started to Navbar

**Files:**

- Modify: `apps/marketing/src/components/layout/Navbar.tsx`

- [ ] **Step 1: Update NAV_LINKS**

  Find:

  ```ts
  const NAV_LINKS = [
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/kickstart', label: 'Kickstart' },
    { href: '/commands', label: 'Commands' },
    { href: '/teams', label: 'For Teams' },
  ];
  ```

  Replace with:

  ```ts
  const NAV_LINKS = [
    { href: '/getting-started', label: 'Getting Started' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/kickstart', label: 'Kickstart' },
    { href: '/commands', label: 'Commands' },
    { href: '/teams', label: 'For Teams' },
  ];
  ```

- [ ] **Step 2: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/marketing/src/components/layout/Navbar.tsx
  git commit -m "feat(marketing): add Getting Started to navbar"
  ```

---

## Task 4: Create /getting-started page

**Files:**

- Create: `apps/marketing/src/app/getting-started/page.tsx`

The `PluginInstall` component already exists at `apps/marketing/src/components/sections/PluginInstall.tsx` and has the full 3-command install block. Just create the page wrapper.

- [ ] **Step 1: Create the page**

  ```tsx
  import type { Metadata } from 'next';
  import { PluginInstall } from '@/components/sections/PluginInstall';

  export const metadata: Metadata = {
    title: 'Getting Started — x4',
    description:
      'From zero to running app in minutes. Install x4, scaffold your project, and start building — all from Claude Code.',
  };

  export default function GettingStartedPage() {
    return (
      <>
        {/* Hero */}
        <section className="pb-12 pt-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              From zero to running app <span className="gradient-text">in minutes.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Install x4, scaffold your project, and start building — all from Claude Code.
            </p>
          </div>
        </section>

        {/* Install */}
        <section className="pb-24">
          <PluginInstall />
        </section>
      </>
    );
  }
  ```

  Note: check how `PluginInstall` is exported — it may be a named export (`export function PluginInstall`) or default export. Read the file first and adjust the import accordingly.

- [ ] **Step 2: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/marketing/src/app/getting-started/page.tsx
  git commit -m "feat(marketing): add /getting-started page"
  ```

---

## Task 5: Create /companion-plugins page

**Files:**

- Create: `apps/marketing/src/app/companion-plugins/page.tsx`

The `CompanionPlugins` and `HooksSection` components already exist in `apps/marketing/src/components/sections/`. Check their export styles before using them.

- [ ] **Step 1: Check export styles**

  Read `CompanionPlugins.tsx` and `HooksSection.tsx` to confirm whether they use named exports (`export function`) or default exports. Adjust imports accordingly.

- [ ] **Step 2: Create the page**

  ```tsx
  import type { Metadata } from 'next';
  import { CompanionPlugins } from '@/components/sections/CompanionPlugins';
  import { HooksSection } from '@/components/sections/HooksSection';

  export const metadata: Metadata = {
    title: 'Companion Plugins — x4',
    description:
      'x4 relies on a set of companion plugins. Required ones are installed automatically by /x4:onboard.',
  };

  export default function CompanionPluginsPage() {
    return (
      <>
        {/* Hero */}
        <section className="pb-12 pt-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              The plugins that <span className="gradient-text">power x4.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              x4 relies on a set of companion plugins. Required ones are installed automatically by{' '}
              <span className="font-mono text-violet-400">/x4:onboard</span>.
            </p>
          </div>
        </section>

        {/* Plugins */}
        <CompanionPlugins />

        {/* Hooks */}
        <HooksSection />
      </>
    );
  }
  ```

  Adjust import style (named vs default) based on what you found in Step 1.

- [ ] **Step 3: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/app/companion-plugins/page.tsx
  git commit -m "feat(marketing): add /companion-plugins page"
  ```

---

## Task 6: Create DeploymentFlow component and /deployment page

**Files:**

- Create: `apps/marketing/src/components/sections/DeploymentFlow.tsx`
- Create: `apps/marketing/src/app/deployment/page.tsx`

The card styling follows `DayInLifeSection` exactly for individual cards, but the container is a **vertical stack** (`flex flex-col gap-4`), not a horizontal row. The three "commands" include two non-command entries (Push to main, Open a PR) — render them identically as cards with the same monospace style.

- [ ] **Step 1: Create DeploymentFlow.tsx**

  ```tsx
  'use client';

  import { useRef } from 'react';
  import { motion, useInView } from 'motion/react';

  const DEPLOYMENT_COLOR = '#3b82f6';

  interface DeploymentCard {
    command: string;
    outcome: string;
  }

  const CARDS: DeploymentCard[] = [
    {
      command: '/x4:deploy-setup',
      outcome: 'Railway project created, services configured, domains generated',
    },
    {
      command: 'Push to main',
      outcome: 'Production deploys automatically via GitHub integration',
    },
    {
      command: 'Open a PR',
      outcome: 'Preview environment spins up, URL posted as PR comment',
    },
  ];

  export function DeploymentFlow() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
      <section ref={ref} className="py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col gap-4">
            {CARDS.map((card, index) => (
              <motion.div
                key={card.command}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-lg border border-slate-800 border-l-2 bg-slate-900/50 p-4"
                style={{ borderLeftColor: DEPLOYMENT_COLOR }}
              >
                <p className="font-mono text-sm text-violet-400">{card.command}</p>
                <p className="mt-1 text-sm text-slate-400">{card.outcome}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  export default DeploymentFlow;
  ```

- [ ] **Step 2: Create deployment/page.tsx**

  ```tsx
  import type { Metadata } from 'next';
  import { DeploymentFlow } from '@/components/sections/DeploymentFlow';

  export const metadata: Metadata = {
    title: 'Deployment — x4',
    description:
      'One command sets up your entire Railway project — services, domains, and PR previews.',
  };

  export default function DeploymentPage() {
    return (
      <>
        {/* Hero */}
        <section className="pb-12 pt-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              Deploy to Railway. <span className="gradient-text">Zero config.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              One command sets up your entire Railway project — services, domains, and PR previews.
            </p>
          </div>
        </section>

        {/* Flow */}
        <section className="pb-24">
          <DeploymentFlow />
        </section>
      </>
    );
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`, 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/components/sections/DeploymentFlow.tsx apps/marketing/src/app/deployment/page.tsx
  git commit -m "feat(marketing): add DeploymentFlow component and /deployment page"
  ```

---

## Task 7: Create AnnounceCommands component and /announce page

**Files:**

- Create: `apps/marketing/src/components/sections/AnnounceCommands.tsx`
- Create: `apps/marketing/src/app/announce/page.tsx`

5 market-\* command cards in a 2-column responsive grid. Same individual card styling as DayInLifeSection. Amber color for all cards.

- [ ] **Step 1: Create AnnounceCommands.tsx**

  ```tsx
  'use client';

  import { useRef } from 'react';
  import { motion, useInView } from 'motion/react';

  const ANNOUNCE_COLOR = '#f59e0b';

  interface AnnounceCard {
    command: string;
    outcome: string;
  }

  const CARDS: AnnounceCard[] = [
    { command: '/x4:market-update', outcome: 'Sync marketing site with what shipped' },
    { command: '/x4:market-email', outcome: 'Generate release email from changelog' },
    { command: '/x4:market-linkedin', outcome: 'Write LinkedIn post, copy to clipboard' },
    { command: '/x4:market-tweet', outcome: 'Write X thread, 280-char enforced' },
    { command: '/x4:market-subscribe', outcome: 'Scaffold email capture form into marketing site' },
  ];

  export function AnnounceCommands() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
      <section ref={ref} className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CARDS.map((card, index) => (
              <motion.div
                key={card.command}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-lg border border-slate-800 border-l-2 bg-slate-900/50 p-4"
                style={{ borderLeftColor: ANNOUNCE_COLOR }}
              >
                <p className="font-mono text-sm text-violet-400">{card.command}</p>
                <p className="mt-1 text-sm text-slate-400">{card.outcome}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  export default AnnounceCommands;
  ```

- [ ] **Step 2: Create announce/page.tsx**

  ```tsx
  import type { Metadata } from 'next';
  import { AnnounceCommands } from '@/components/sections/AnnounceCommands';

  export const metadata: Metadata = {
    title: 'Email & Announcements — x4',
    description:
      'Five commands. One changelog. Every channel covered — email, LinkedIn, X, and your marketing site.',
  };

  export default function AnnouncePage() {
    return (
      <>
        {/* Hero */}
        <section className="pb-12 pt-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              Tell the world <span className="gradient-text">what shipped.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Five commands. One changelog. Every channel covered.
            </p>
          </div>
        </section>

        {/* Commands */}
        <section className="pb-24">
          <AnnounceCommands />
        </section>
      </>
    );
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`, 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/components/sections/AnnounceCommands.tsx apps/marketing/src/app/announce/page.tsx
  git commit -m "feat(marketing): add AnnounceCommands component and /announce page"
  ```
