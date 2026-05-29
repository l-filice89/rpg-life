# Marketing Homepage Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Day in the Life" timeline section to the marketing homepage, bump the version badge to v3.10.0, and update the install commands in the CTA section.

**Architecture:** Three targeted edits on the `feature/marketing-reimagine` branch: (1) one-line string change in HeroDescribeApp, (2) new DayInLifeSection component using the same `useRef/useInView` pattern as AutoLoopTerminal, (3) updated INSTALL_COMMANDS constant and footer version in CTASection. Then wire DayInLifeSection into page.tsx between HeroDescribeApp and AutoLoopTerminal.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, `motion/react` (NOT framer-motion), TypeScript. All work on branch `feature/marketing-reimagine`. Type-check: `bun turbo type-check --filter=@rpg-life/marketing`.

---

## File Map

| Action | File                                                          | What changes                                                                 |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Modify | `apps/marketing/src/components/hero/HeroDescribeApp.tsx`      | `v3.5.0` → `v3.10.0` in badge string                                         |
| Create | `apps/marketing/src/components/sections/DayInLifeSection.tsx` | New component — 5-chapter command card timeline                              |
| Modify | `apps/marketing/src/components/sections/CTASection.tsx`       | Replace `INSTALL_COMMANDS` constant, update footer version                   |
| Modify | `apps/marketing/src/app/page.tsx`                             | Import DayInLifeSection, insert between HeroDescribeApp and AutoLoopTerminal |

---

## Task 1: Bump version badge in HeroDescribeApp

**Files:**

- Modify: `apps/marketing/src/components/hero/HeroDescribeApp.tsx`

- [ ] **Step 1: Confirm the string to replace**

  Open the file and confirm line containing `v3.5.0 · Claude Code Plugin · Apache 2.0`.

- [ ] **Step 2: Replace the version string**

  Change:

  ```
  v3.5.0 · Claude Code Plugin · Apache 2.0
  ```

  To:

  ```
  v3.10.0 · Claude Code Plugin · Apache 2.0
  ```

- [ ] **Step 3: Type-check**

  Run from repo root:

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/components/hero/HeroDescribeApp.tsx
  git commit -m "feat(marketing): bump version badge to v3.10.0"
  ```

---

## Task 2: Create DayInLifeSection component

**Files:**

- Create: `apps/marketing/src/components/sections/DayInLifeSection.tsx`

- [ ] **Step 1: Create the file with full content**

  ```tsx
  'use client';

  import { useRef } from 'react';
  import { motion, useInView } from 'motion/react';

  interface CommandCard {
    command: string;
    outcome: string;
  }

  interface Chapter {
    number: string;
    label: string;
    color: string;
    cards: CommandCard[];
  }

  const CHAPTERS: Chapter[] = [
    {
      number: '01',
      label: 'Day 1 · Morning — Get your machine ready',
      color: '#7c3aed',
      cards: [
        { command: '/x4:onboard', outcome: 'Machine ready, companion plugins installed' },
        { command: '/x4:create my-app', outcome: 'Full-stack monorepo scaffolded in seconds' },
        { command: '/x4:deploy-setup', outcome: 'Railway configured, PR previews enabled' },
        { command: '/x4:tour', outcome: 'Test login, try AI chat, explore your running app' },
      ],
    },
    {
      number: '02',
      label: 'Day 1 · Afternoon — Plan everything you want to build',
      color: '#3b82f6',
      cards: [
        {
          command: '/x4:kickstart',
          outcome: 'Brainstorm features, design UI, batch-generate PRDs',
        },
      ],
    },
    {
      number: '03',
      label: 'Day 2 — Agent teams build your features',
      color: '#4ade80',
      cards: [
        { command: '/x4:work', outcome: 'Auto-loop: agents build all features, one PR at a time' },
      ],
    },
    {
      number: '04',
      label: "Week 2+ — Find what's missing and what's next",
      color: '#06b6d4',
      cards: [
        { command: '/x4:gaps', outcome: 'Find dead ends, missing connections, incomplete flows' },
        { command: '/x4:dream', outcome: 'Explore bold ideas informed by your tech stack' },
        { command: '/x4:plan-backlog', outcome: 'Turn selected ideas into PRDs' },
        { command: '/x4:work', outcome: 'Build the next wave' },
      ],
    },
    {
      number: '05',
      label: 'Ongoing — Tell the world what shipped',
      color: '#f59e0b',
      cards: [
        { command: '/x4:market-update', outcome: 'Sync marketing site with what shipped' },
        { command: '/x4:market-email', outcome: 'Generate release email from changelog' },
        { command: '/x4:market-linkedin', outcome: 'Write LinkedIn post, copy to clipboard' },
        { command: '/x4:market-tweet', outcome: 'Write X thread, 280-char enforced' },
      ],
    },
  ];

  export function DayInLifeSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
      <section ref={ref} className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">A day in the life.</h2>
            <p className="mt-4 text-muted-foreground">
              From zero to shipped app — with one plugin.
            </p>
          </motion.div>

          {/* Chapters */}
          <div className="flex flex-col gap-8">
            {CHAPTERS.map((chapter, index) => (
              <motion.div
                key={chapter.number}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Chapter label */}
                <p
                  className="mb-3 font-mono text-xs uppercase tracking-wider"
                  style={{ color: chapter.color }}
                >
                  {chapter.number} · {chapter.label}
                </p>

                {/* Command cards */}
                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                  {chapter.cards.map((card) => (
                    <div
                      key={`${chapter.number}-${card.command}`}
                      className="rounded-lg border border-slate-800 border-l-2 bg-slate-900/50 p-4 md:min-w-[220px]"
                      style={{ borderLeftColor: chapter.color }}
                    >
                      <p className="font-mono text-sm text-violet-400">{card.command}</p>
                      <p className="mt-1 text-sm text-slate-400">{card.outcome}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  export default DayInLifeSection;
  ```

- [ ] **Step 2: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`, 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/marketing/src/components/sections/DayInLifeSection.tsx
  git commit -m "feat(marketing): add DayInLifeSection — 5-chapter command card timeline"
  ```

---

## Task 3: Update CTASection install commands and footer version

**Files:**

- Modify: `apps/marketing/src/components/sections/CTASection.tsx`

The file currently has:

```tsx
const INSTALL_COMMANDS = `# Install the x4 plugin
claude mcp add x4

# Scaffold your project
/x4:create my-app --preset saas

# Start building
/x4:kickstart`;
```

And footer: `v3.5.0 · Apache 2.0 · studiox4/x4-agent-plugins`

- [ ] **Step 1: Replace the INSTALL_COMMANDS constant**

  Change `INSTALL_COMMANDS` to:

  ```tsx
  const INSTALL_COMMANDS = `# Add the marketplace
  /plugin marketplace add studiox4/x4-agent-plugins
  
  # Install x4
  /plugin install x4@rpg-life-agent-plugins
  
  # Start onboarding
  /x4:onboard`;
  ```

  Note: use template literal with no leading indentation on the content lines (the `<pre>` already handles display).

- [ ] **Step 2: Update footer version**

  Change:

  ```
  v3.5.0 · Apache 2.0 · studiox4/x4-agent-plugins
  ```

  To:

  ```
  v3.10.0 · Apache 2.0 · studiox4/x4-agent-plugins
  ```

- [ ] **Step 3: Type-check**

  ```bash
  bun turbo type-check --filter=@rpg-life/marketing
  ```

  Expected: `Tasks: 1 successful`, 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/marketing/src/components/sections/CTASection.tsx
  git commit -m "feat(marketing): update install commands and version to v3.10.0 in CTASection"
  ```

---

## Task 4: Wire DayInLifeSection into homepage

**Files:**

- Modify: `apps/marketing/src/app/page.tsx`

Current `page.tsx`:

```tsx
import { HeroDescribeApp } from '@/components/hero/HeroDescribeApp';
import { AutoLoopTerminal } from '@/components/sections/AutoLoopTerminal';
import TechStackBento from '@/components/sections/TechStackBento';
import DiscoverySection from '@/components/sections/DiscoverySection';
import AgentPluginShowcase from '@/components/sections/AgentPluginShowcase';
import CTASection from '@/components/sections/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroDescribeApp />
      <AutoLoopTerminal />
      <TechStackBento />
      <DiscoverySection />
      <AgentPluginShowcase />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 1: Add the import**

  Add after the `HeroDescribeApp` import line:

  ```tsx
  import DayInLifeSection from '@/components/sections/DayInLifeSection';
  ```

- [ ] **Step 2: Insert the component**

  Add `<DayInLifeSection />` between `<HeroDescribeApp />` and `<AutoLoopTerminal />`:

  ```tsx
  export default function HomePage() {
    return (
      <>
        <HeroDescribeApp />
        <DayInLifeSection />
        <AutoLoopTerminal />
        <TechStackBento />
        <DiscoverySection />
        <AgentPluginShowcase />
        <CTASection />
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
  git add apps/marketing/src/app/page.tsx
  git commit -m "feat(marketing): wire DayInLifeSection into homepage"
  ```
