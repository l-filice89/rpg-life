# Marketing Site Reimagine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reimagine the x4 marketing site from a boilerplate showcase into a belief-first experience that changes how developers think about AI-assisted development, with a new hero, 6-section scroll journey, and 4 new sub-pages.

**Architecture:** Homepage-first approach — rebuild the homepage narrative with new components while reusing the existing Tailwind v4 / Motion / OKLCH design system. Add 4 new sub-pages (/kickstart, /commands, /discovery, /teams). Retire stale pages and components. All work on `feature/marketing-reimagine` branch.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Motion (`motion/react`), Lucide React, Geist fonts, `cn()` from `@/lib/utils`. No server-side code. No Three.js (removed in Task 2).

---

## File Map

### New files

| File                                                            | Purpose                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/marketing/src/components/hero/HeroDescribeApp.tsx`        | Hero section — typewriter input + animated plan card         |
| `apps/marketing/src/components/sections/AutoLoopTerminal.tsx`   | Section ② — agent status pills + animated auto-loop terminal |
| `apps/marketing/src/components/sections/DiscoverySection.tsx`   | Section ④ — /x4:gaps and /x4:dream split cards               |
| `apps/marketing/src/components/sections/KickstartFlow.tsx`      | /kickstart page — 6-step horizontal flow component           |
| `apps/marketing/src/components/sections/CommandsTable.tsx`      | /commands page — searchable/filterable command reference     |
| `apps/marketing/src/components/sections/DiscoveryExplainer.tsx` | /discovery page — full gaps + dream explainer                |
| `apps/marketing/src/app/kickstart/page.tsx`                     | /kickstart route                                             |
| `apps/marketing/src/app/commands/page.tsx`                      | /commands route                                              |
| `apps/marketing/src/app/discovery/page.tsx`                     | /discovery route                                             |
| `apps/marketing/src/app/teams/page.tsx`                         | /teams route                                                 |

### Modified files

| File                                                             | Changes                                                           |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/marketing/src/components/layout/Navbar.tsx`                | New NAV_LINKS array + Install CTA button                          |
| `apps/marketing/src/components/sections/TechStackBento.tsx`      | Replace bento with logo grid + preset pills                       |
| `apps/marketing/src/components/sections/AgentPluginShowcase.tsx` | Update to 5-card agent layout with companion plugin badges        |
| `apps/marketing/src/components/sections/CTASection.tsx`          | New "One Command" install section                                 |
| `apps/marketing/src/components/sections/CompanionPlugins.tsx`    | Update to 9 plugins (3 required, 6 recommended)                   |
| `apps/marketing/src/components/sections/HooksSection.tsx`        | Update to 4 hooks including session-start                         |
| `apps/marketing/src/components/sections/StatsCounter.tsx`        | Update numbers (27 commands, 5 agents, etc.)                      |
| `apps/marketing/src/app/page.tsx`                                | New 6-section homepage order                                      |
| `apps/marketing/src/app/layout.tsx`                              | Updated metadata title/description                                |
| `apps/marketing/next.config.ts`                                  | Add /docs redirect                                                |
| `apps/marketing/package.json`                                    | Remove three, @react-three/fiber, @react-three/drei, @types/three |

### Deleted files

```
apps/marketing/src/components/hero/HeroScene.tsx
apps/marketing/src/components/hero/HeroSceneLoader.tsx
apps/marketing/src/components/hero/HeroContent.tsx
apps/marketing/src/components/sections/BentoGrid.tsx
apps/marketing/src/components/sections/CodeShowcase.tsx
apps/marketing/src/components/sections/FeatureVisuals.tsx
apps/marketing/src/components/sections/PhilosophyCards.tsx
apps/marketing/src/components/sections/PluginPipeline.tsx
apps/marketing/src/components/sections/SkillsSection.tsx
apps/marketing/src/components/sections/StickyScroll.tsx
apps/marketing/src/components/sections/WorkflowDemo.tsx
apps/marketing/src/app/features/      (entire directory)
apps/marketing/src/app/stack/         (entire directory)
apps/marketing/src/app/ai/            (entire directory)
apps/marketing/src/app/plugins/       (entire directory)
apps/marketing/src/app/docs/          (entire directory)
```

---

## Task 1: Branch + Retire Stale Pages and Components

**Files:**

- Delete: all files listed in "Deleted files" above
- Modify: `apps/marketing/src/app/page.tsx` (temporarily blank out retired imports)

- [ ] **Step 1: Create the feature branch**

```bash
cd /Users/corbanbaxter/Development/rpg-life
git checkout -b feature/marketing-reimagine
```

- [ ] **Step 2: Delete retired page directories**

```bash
rm -rf apps/marketing/src/app/features
rm -rf apps/marketing/src/app/stack
rm -rf apps/marketing/src/app/ai
rm -rf apps/marketing/src/app/plugins
rm -rf apps/marketing/src/app/docs
```

- [ ] **Step 3: Delete retired components**

```bash
rm apps/marketing/src/components/hero/HeroScene.tsx
rm apps/marketing/src/components/hero/HeroSceneLoader.tsx
rm apps/marketing/src/components/hero/HeroContent.tsx
rm apps/marketing/src/components/sections/BentoGrid.tsx
rm apps/marketing/src/components/sections/CodeShowcase.tsx
rm apps/marketing/src/components/sections/FeatureVisuals.tsx
rm apps/marketing/src/components/sections/PhilosophyCards.tsx
rm apps/marketing/src/components/sections/PluginPipeline.tsx
rm apps/marketing/src/components/sections/SkillsSection.tsx
rm apps/marketing/src/components/sections/StickyScroll.tsx
rm apps/marketing/src/components/sections/WorkflowDemo.tsx
```

- [ ] **Step 4: Stub page.tsx to remove broken imports**

Replace the full content of `apps/marketing/src/app/page.tsx` with:

```tsx
export default function HomePage() {
  return <div />;
}
```

- [ ] **Step 5: Type-check to confirm no other files depend on deleted components**

```bash
cd /Users/corbanbaxter/Development/rpg-life
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS (the stub page.tsx has no imports, so nothing should break).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(marketing): retire stale pages and components, create reimagine branch"
```

---

## Task 2: Remove Three.js + Update Navbar

**Files:**

- Modify: `apps/marketing/package.json`
- Modify: `apps/marketing/src/components/layout/Navbar.tsx`
- Modify: `apps/marketing/next.config.ts`

- [ ] **Step 1: Remove Three.js packages from package.json**

In `apps/marketing/package.json`, remove from `dependencies`:

- `"three": "0.182.0"`
- `"@react-three/fiber": "9.5.0"`
- `"@react-three/drei": "10.7.7"`

And from `devDependencies`:

- `"@types/three": "0.182.0"`

Then run:

```bash
cd /Users/corbanbaxter/Development/rpg-life
bun install
```

- [ ] **Step 2: Update Navbar with new nav links and Install CTA**

Replace the full content of `apps/marketing/src/components/layout/Navbar.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/kickstart', label: 'Kickstart' },
  { href: '/commands', label: 'Commands' },
  { href: '/teams', label: 'For Teams' },
];

const PLUGINS_URL = 'https://github.com/studiox4/x4-agent-plugins';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled ? 'glass border-b border-border shadow-lg shadow-black/10' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="gradient-text text-2xl font-bold tracking-tight">x4</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'relative rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-lg bg-white/5"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Install CTA */}
        <a
          href={PLUGINS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 md:block"
        >
          Install
        </a>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="glass overflow-hidden border-b border-border md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1 px-6 py-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/5 text-foreground'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={PLUGINS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Install
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
```

- [ ] **Step 3: Add /docs redirect to next.config.ts**

Replace `apps/marketing/next.config.ts`:

```ts
import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://github.com/studiox4/x4-agent-plugins',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Update layout metadata**

In `apps/marketing/src/app/layout.tsx`, update the `metadata` object:

```ts
export const metadata: Metadata = {
  title: {
    default: 'x4 — The Complete AI Dev Workflow for Claude Code',
    template: '%s | x4',
  },
  description:
    'One Claude Code plugin. Scaffold a full-stack TypeScript monorepo, plan features with AI, dispatch agent teams, and ship pull requests — all from your terminal.',
  openGraph: {
    title: 'x4 — The Complete AI Dev Workflow for Claude Code',
    description:
      'One Claude Code plugin. Scaffold, plan, build, and ship full-stack TypeScript apps with autonomous agent teams.',
    type: 'website',
    locale: 'en_US',
    siteName: 'x4',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'x4 — The Complete AI Dev Workflow for Claude Code',
    description: 'One Claude Code plugin. Describe your app. Watch agents build it.',
  },
};
```

- [ ] **Step 5: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(marketing): update nav, remove three.js, add /docs redirect, update metadata"
```

---

## Task 3: Build HeroDescribeApp

**Files:**

- Create: `apps/marketing/src/components/hero/HeroDescribeApp.tsx`

- [ ] **Step 1: Create the component**

Create `apps/marketing/src/components/hero/HeroDescribeApp.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const TYPED_PHRASE = 'A fitness tracker with AI coaching and social features';
const FEATURE_TAGS = [
  'Auth',
  'Workout Tracking',
  'AI Coaching',
  'Social Feed',
  'Progress Charts',
  'Notifications',
  'Mobile App',
  'Analytics',
];

export function HeroDescribeApp() {
  const [typedCount, setTypedCount] = useState(0);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    // Start typing after 600ms
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedCount((c) => {
          if (c >= TYPED_PHRASE.length) {
            clearInterval(interval);
            // Show plan card 400ms after typing completes
            setTimeout(() => setShowPlan(true), 400);
            return c;
          }
          return c + 1;
        });
      }, 38);
      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 font-mono text-xs text-violet-400">
          v3.5.0 · Claude Code Plugin · Apache 2.0
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0, 1] }}
      >
        What are you <span className="gradient-text">building?</span>
      </motion.h1>

      {/* Sub-headline */}
      <motion.p
        className="mb-10 max-w-xl text-lg text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Describe your app. x4 plans it, agents build it, ships it to production.
      </motion.p>

      {/* Input */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="gradient-border rounded-xl">
          <div className="flex items-center gap-3 rounded-xl bg-card/95 px-5 py-4 backdrop-blur-sm">
            <span className="text-violet-400 text-lg font-mono">›</span>
            <span className="font-mono text-sm text-foreground">
              {TYPED_PHRASE.slice(0, typedCount)}
              {typedCount < TYPED_PHRASE.length && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-middle" />
              )}
            </span>
          </div>
        </div>

        {/* Plan card */}
        <AnimatedPlanCard show={showPlan} />
      </motion.div>

      {/* Scroll hint */}
      <motion.p
        className="mt-16 text-xs text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: showPlan ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        ↓ watch agents build it
      </motion.p>
    </div>
  );
}

function AnimatedPlanCard({ show }: { show: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0, 1] }}
      className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-emerald-400">✓</span>
        <span className="font-mono text-xs font-semibold text-emerald-400">
          Kickstart plan generated · 8 features · 4 phases · PRDs ready
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {FEATURE_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-300"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 font-mono text-xs text-emerald-500/70">
        Run /x4:work to start building →
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/src/components/hero/HeroDescribeApp.tsx
git commit -m "feat(marketing): add HeroDescribeApp with typewriter + plan card animation"
```

---

## Task 4: Build AutoLoopTerminal

**Files:**

- Create: `apps/marketing/src/components/sections/AutoLoopTerminal.tsx`

- [ ] **Step 1: Create the component**

Create `apps/marketing/src/components/sections/AutoLoopTerminal.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface LogLine {
  text: string;
  type: 'success' | 'active' | 'queued' | 'detail';
  delay: number;
}

const LOG_LINES: LogLine[] = [
  { text: '✓ [1/8] Auth — branch: feat/auth · PR #41 merged', type: 'success', delay: 0 },
  { text: '✓ [2/8] Workout Tracking — PR #42 merged', type: 'success', delay: 500 },
  { text: '✓ [3/8] AI Coaching — PR #43 merged', type: 'success', delay: 900 },
  { text: '✓ [4/8] Social Feed — PR #44 merged', type: 'success', delay: 1300 },
  { text: '✓ [5/8] Progress Charts — PR #45 merged', type: 'success', delay: 1700 },
  { text: '✓ [6/8] Notifications — PR #46 merged', type: 'success', delay: 2100 },
  { text: '→ [7/8] Mobile App — building...', type: 'active', delay: 2600 },
  { text: '    Backend: scaffolding tRPC routes', type: 'detail', delay: 3000 },
  { text: '    Frontend: generating Expo screens', type: 'detail', delay: 3400 },
  { text: '◌ [8/8] Analytics — queued', type: 'queued', delay: 3800 },
];

const AGENTS = [
  { label: 'Backend', color: 'bg-emerald-400' },
  { label: 'Frontend', color: 'bg-emerald-400' },
  { label: 'Reviewer', color: 'bg-amber-400' },
  { label: 'Tester', color: 'bg-blue-400' },
  { label: 'Performance', color: 'bg-violet-400' },
] as const;

export function AutoLoopTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOG_LINES.forEach((line, i) => {
      const timer = setTimeout(() => setVisibleLines(i + 1), line.delay);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Heading */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold sm:text-5xl">
            Your terminal just got <span className="gradient-text">a team.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Eight features. One command. Agents handle the rest.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Agent status bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {AGENTS.map((agent) => (
              <div
                key={agent.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-1.5"
              >
                <span className={`h-2 w-2 rounded-full ${agent.color}`} />
                <span className="text-xs text-muted-foreground">{agent.label}</span>
              </div>
            ))}
            <div className="ml-auto rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
              <span className="font-mono text-xs text-emerald-400">
                ↻ Auto-loop · 6/8 PRDs complete
              </span>
            </div>
          </div>

          {/* Terminal */}
          <div className="gradient-border overflow-hidden rounded-xl">
            <div className="rounded-xl bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">
                  /x4:work — auto-loop
                </span>
              </div>
              <div className="min-h-64 space-y-1 p-4 font-mono text-sm">
                {LOG_LINES.slice(0, visibleLines).map((line, i) => (
                  <div key={i}>
                    {line.type === 'success' && (
                      <span className="text-emerald-400">{line.text}</span>
                    )}
                    {line.type === 'active' && <span className="text-amber-400">{line.text}</span>}
                    {line.type === 'detail' && (
                      <span className="text-muted-foreground/60">{line.text}</span>
                    )}
                    {line.type === 'queued' && (
                      <span className="text-muted-foreground/40">{line.text}</span>
                    )}
                  </div>
                ))}
                {visibleLines < LOG_LINES.length && isInView && (
                  <span className="inline-block h-4 w-2 animate-pulse bg-foreground/50" />
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: '6', label: 'PRs merged' },
              { value: '5', label: 'agents active' },
              { value: '0', label: 'manual PRs' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card/80 p-4 text-center"
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/src/components/sections/AutoLoopTerminal.tsx
git commit -m "feat(marketing): add AutoLoopTerminal — agent status bar + animated PRD progress"
```

---

## Task 5: Build DiscoverySection + Refactor TechStackBento and CTASection

**Files:**

- Create: `apps/marketing/src/components/sections/DiscoverySection.tsx`
- Modify: `apps/marketing/src/components/sections/TechStackBento.tsx`
- Modify: `apps/marketing/src/components/sections/CTASection.tsx`

- [ ] **Step 1: Create DiscoverySection**

Create `apps/marketing/src/components/sections/DiscoverySection.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const GAPS = [
  { severity: 'error', text: 'Dead end: Auth with no password reset' },
  { severity: 'warn', text: 'Missing: Workout logs → no export' },
  { severity: 'warn', text: 'Incomplete: Onboarding drops at step 3' },
];

const DREAMS = [
  { type: 'what-if', text: 'Share workout plans publicly', color: 'text-violet-400' },
  { type: "what's-next", text: 'AI injury prevention alerts', color: 'text-blue-400' },
  { type: 'emerging', text: 'Real-time coach via WebSockets', color: 'text-emerald-400' },
];

export function DiscoverySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold sm:text-5xl">
            Shipped is never <span className="gradient-text">finished.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            x4 scans what you&apos;ve built and finds what&apos;s missing before your users do.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Gaps card */}
          <div className="rounded-xl border border-violet-500/20 bg-card/80 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-violet-400">/x4:gaps</span>
              <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                PRODUCT GAP FINDER
              </span>
            </div>
            <div className="space-y-2">
              {GAPS.map((gap, i) => (
                <div key={i} className="flex items-start gap-2 font-mono text-xs">
                  <span className={gap.severity === 'error' ? 'text-red-400' : 'text-amber-400'}>
                    ⚠
                  </span>
                  <span className="text-muted-foreground">{gap.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs text-muted-foreground">Send to backlog?</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-400">
                  ✓ Password reset
                </span>
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-400">
                  ✓ Export
                </span>
              </div>
            </div>
          </div>

          {/* Dream card */}
          <div className="rounded-xl border border-emerald-500/20 bg-card/80 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-emerald-400">/x4:dream</span>
              <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                VISIONARY IDEAS
              </span>
            </div>
            <div className="space-y-2">
              {DREAMS.map((dream, i) => (
                <div key={i} className="flex items-start gap-2 font-mono text-xs">
                  <span className={dream.color}>✦</span>
                  <span className="text-muted-foreground">{dream.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs text-muted-foreground">Add to backlog?</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 font-mono text-xs text-violet-400">
                  ✓ Share plans
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          className="mt-6 text-center font-mono text-xs text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Selected ideas feed straight back into /x4:work. The loop never ends.
        </motion.p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Refactor TechStackBento**

Replace the full content of `apps/marketing/src/components/sections/TechStackBento.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const TECH = [
  'Next.js 15',
  'Hono',
  'tRPC 11',
  'Drizzle ORM',
  'Neon',
  'Better Auth',
  'Vercel AI SDK',
  'Expo 52',
  'Turborepo',
  'Bun',
];

const PRESETS = [
  { label: 'saas', highlighted: true },
  { label: 'full-stack', highlighted: false },
  { label: 'landing', highlighted: false },
  { label: 'api-only', highlighted: false },
];

export function TechStackBento() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold sm:text-5xl">
            The stack you would have <span className="gradient-text">chosen anyway.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Not scaffolded toys. Not locked-in frameworks. The exact tools senior engineers pick.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Tech grid */}
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
            {TECH.map((name) => (
              <div
                key={name}
                className="rounded-xl border border-border bg-card/80 p-3 text-center"
              >
                <span className="font-mono text-xs text-foreground">{name}</span>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {PRESETS.map((p) => (
              <span
                key={p.label}
                className={
                  p.highlighted
                    ? 'rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 font-mono text-sm text-violet-300'
                    : 'rounded-full border border-border bg-card/50 px-4 py-1.5 font-mono text-sm text-muted-foreground'
                }
              >
                {p.label}
              </span>
            ))}
          </div>

          {/* Command */}
          <div className="mt-4 text-center font-mono text-xs text-muted-foreground/50">
            /x4:create my-app --preset saas
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Refactor CTASection**

Replace the full content of `apps/marketing/src/components/sections/CTASection.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const PLUGINS_URL = 'https://github.com/studiox4/x4-agent-plugins';

const INSTALL_STEPS = [
  {
    comment: '# 1. Add the marketplace',
    command: '/plugin marketplace add studiox4/x4-agent-plugins',
  },
  { comment: '# 2. Install the plugin', command: '/plugin install x4@rpg-life-agent-plugins' },
  { comment: '# 3. Run onboarding', command: '/x4:onboard' },
];

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative overflow-hidden py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-glow/5 to-transparent" />

      <motion.div
        className="relative mx-auto max-w-2xl px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-bold sm:text-5xl">
          Ready to stop <span className="gradient-text">building manually?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
          Three commands. Your machine is ready. Your agents are waiting.
        </p>

        {/* Install code block */}
        <div className="gradient-border mt-10 overflow-hidden rounded-xl text-left">
          <div className="rounded-xl bg-card/95 p-6 backdrop-blur-sm">
            <div className="space-y-4 font-mono text-sm">
              {INSTALL_STEPS.map((step, i) => (
                <div key={i}>
                  <div className="text-muted-foreground/50">{step.comment}</div>
                  <div className="text-foreground">{step.command}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={PLUGINS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Install x4
          </a>
          <a
            href={PLUGINS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card/80 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/5"
          >
            View on GitHub ↗
          </a>
        </div>

        <p className="mt-6 font-mono text-xs text-muted-foreground/40">
          v3.5.0 · Apache 2.0 · studiox4/x4-agent-plugins
        </p>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/src/components/sections/DiscoverySection.tsx \
        apps/marketing/src/components/sections/TechStackBento.tsx \
        apps/marketing/src/components/sections/CTASection.tsx
git commit -m "feat(marketing): add DiscoverySection, refactor TechStackBento and CTASection"
```

---

## Task 6: Refactor AgentPluginShowcase + Wire Homepage

**Files:**

- Modify: `apps/marketing/src/components/sections/AgentPluginShowcase.tsx`
- Modify: `apps/marketing/src/app/page.tsx`

- [ ] **Step 1: Replace AgentPluginShowcase with 5-card agent layout**

Replace the full content of `apps/marketing/src/components/sections/AgentPluginShowcase.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const AGENTS = [
  {
    icon: '⚙',
    name: 'Backend',
    scope: 'API routes, tRPC, database schema, middleware',
    companion: null,
    color: 'border-indigo-500/20 bg-indigo-500/5',
    iconBg: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    icon: '🎨',
    name: 'Frontend',
    scope: 'Pages, components, styling, client state',
    companion: 'frontend-design',
    color: 'border-cyan-500/20 bg-cyan-500/5',
    iconBg: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    icon: '🔍',
    name: 'Reviewer',
    scope: 'Security, architecture, quality — read-only',
    companion: 'code-review',
    color: 'border-violet-500/20 bg-violet-500/5',
    iconBg: 'bg-violet-500/10 text-violet-400',
  },
  {
    icon: '🧪',
    name: 'Tester',
    scope: 'Unit tests, e2e tests, coverage',
    companion: 'playwright',
    color: 'border-blue-500/20 bg-blue-500/5',
    iconBg: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: '⚡',
    name: 'Performance',
    scope: 'Bundle size, re-renders, query efficiency — read-only',
    companion: null,
    color: 'border-amber-500/20 bg-amber-500/5',
    iconBg: 'bg-amber-500/10 text-amber-400',
  },
] as const;

export function AgentPluginShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold sm:text-5xl">
            Five specialists. <span className="gradient-text">One pipeline.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each agent owns its domain. None can touch what isn&apos;t theirs.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {AGENTS.map((agent) => (
            <div key={agent.name} className={`rounded-xl border p-4 ${agent.color}`}>
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-lg ${agent.iconBg}`}
              >
                {agent.icon}
              </div>
              <div className="mb-1 text-sm font-semibold text-foreground">{agent.name}</div>
              <div className="mb-3 text-xs leading-relaxed text-muted-foreground">
                {agent.scope}
              </div>
              {agent.companion && (
                <div className="rounded-md border border-border bg-background/50 px-2 py-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    + {agent.companion}
                  </span>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire homepage page.tsx with all 6 sections**

Replace the full content of `apps/marketing/src/app/page.tsx`:

```tsx
import { HeroDescribeApp } from '@/components/hero/HeroDescribeApp';
import { AutoLoopTerminal } from '@/components/sections/AutoLoopTerminal';
import { TechStackBento } from '@/components/sections/TechStackBento';
import { DiscoverySection } from '@/components/sections/DiscoverySection';
import { AgentPluginShowcase } from '@/components/sections/AgentPluginShowcase';
import { CTASection } from '@/components/sections/CTASection';

export default function HomePage() {
  return (
    <>
      {/* ① Hero — "What are you building?" */}
      <section id="how-it-works" className="relative min-h-screen overflow-hidden">
        <HeroDescribeApp />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ② Living Terminal — "Watch Agents Build It" */}
      <AutoLoopTerminal />

      {/* ③ Real Stack — "The stack you would have chosen anyway" */}
      <TechStackBento />

      {/* ④ Discovery Loop — "Shipped is never finished" */}
      <DiscoverySection />

      {/* ⑤ Agent Team — "Five specialists. One pipeline." */}
      <AgentPluginShowcase />

      {/* ⑥ Install CTA — "Ready to stop building manually?" */}
      <CTASection />
    </>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 4: Start dev server and visually verify the homepage**

```bash
cd apps/marketing && bun dev
```

Open http://localhost:3001 and verify:

- Hero shows with typewriter input animating in
- Plan card appears after typing completes
- Scrolling down reveals each section
- Nav shows the new links
- No visual regressions

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/src/components/sections/AgentPluginShowcase.tsx \
        apps/marketing/src/app/page.tsx
git commit -m "feat(marketing): wire 6-section homepage — hero, terminal, stack, discovery, agents, CTA"
```

---

## Task 7: Build /kickstart Page

**Files:**

- Create: `apps/marketing/src/components/sections/KickstartFlow.tsx`
- Create: `apps/marketing/src/app/kickstart/page.tsx`

- [ ] **Step 1: Create KickstartFlow component**

Create `apps/marketing/src/components/sections/KickstartFlow.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const STEPS = [
  {
    icon: '💬',
    label: '1. Vision',
    desc: "Describe what you're building in plain language",
    color: 'border-violet-500/30 text-violet-400',
  },
  {
    icon: '🧠',
    label: '2. Brainstorm',
    desc: 'AI generates a categorized feature list you refine',
    color: 'border-blue-500/30 text-blue-400',
  },
  {
    icon: '📊',
    label: '3. Prioritize',
    desc: 'Sequence features into build phases by value + deps',
    color: 'border-cyan-500/30 text-cyan-400',
  },
  {
    icon: '🎨',
    label: '4. UI Design',
    desc: 'Layouts, components, and flows per user-facing feature',
    color: 'border-emerald-500/30 text-emerald-400',
  },
  {
    icon: '📝',
    label: '5. Batch PRDs',
    desc: 'Full implementation plan generated per feature',
    color: 'border-amber-500/30 text-amber-400',
  },
  {
    icon: '🚀',
    label: '6. Summary',
    desc: 'Build order shown — then run /x4:work',
    color: 'border-rose-500/30 text-rose-400',
  },
] as const;

const PLANNING_MODES = [
  {
    title: 'Kickstart',
    command: '/x4:kickstart',
    desc: 'New projects. Full planning session — vision, brainstorm, UI design, batch PRDs all at once.',
    highlight: true,
  },
  {
    title: 'Incremental',
    command: '/x4:idea + /x4:plan-backlog',
    desc: 'Ongoing work. Capture ideas one at a time, triage them into PRDs as you go.',
    highlight: false,
  },
  {
    title: 'Discovery',
    command: '/x4:gaps + /x4:dream',
    desc: "What's next. Scan for gaps, explore big ideas, feed selected items back into the pipeline.",
    highlight: false,
  },
];

export function KickstartFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref}>
      {/* 6-step flow */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7 }}
      >
        {STEPS.map((step, i) => (
          <div key={i} className={`rounded-xl border p-4 ${step.color.split(' ')[0]} bg-card/80`}>
            <div className="mb-3 text-2xl">{step.icon}</div>
            <div className={`mb-1 text-xs font-semibold ${step.color.split(' ')[1]}`}>
              {step.label}
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground">{step.desc}</div>
          </div>
        ))}
      </motion.div>

      {/* Transition command */}
      <motion.div
        className="mt-6 rounded-xl border border-border bg-card/50 p-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="font-mono text-xs text-muted-foreground/50"># Then just run:</div>
        <div className="mt-1 font-mono text-sm">
          <span className="text-emerald-400">/x4:work</span>
          <span className="ml-3 text-muted-foreground/40">
            ← agents build all features, in order, automatically
          </span>
        </div>
      </motion.div>

      {/* Three planning modes */}
      <motion.div
        className="mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h3 className="mb-6 text-center text-2xl font-bold">Three ways to plan</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANNING_MODES.map((mode) => (
            <div
              key={mode.title}
              className={`rounded-xl border p-5 ${
                mode.highlight ? 'border-violet-500/30 bg-violet-500/5' : 'border-border bg-card/50'
              }`}
            >
              <div className="mb-1 font-semibold text-foreground">{mode.title}</div>
              <div className="mb-3 font-mono text-xs text-violet-400">{mode.command}</div>
              <div className="text-sm text-muted-foreground">{mode.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Create /kickstart page**

Create `apps/marketing/src/app/kickstart/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { KickstartFlow } from '@/components/sections/KickstartFlow';

export const metadata: Metadata = {
  title: 'Kickstart',
  description:
    'From blank page to full plan in one session. A 6-step AI planning session that turns your idea into a prioritized build queue.',
};

export default function KickstartPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-6">
            <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 font-mono text-xs text-violet-400">
              /x4:kickstart
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            From blank page to <span className="gradient-text">full plan</span> in one session.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A 6-step AI planning session that turns your idea into a prioritized build queue — with
            UI designs and PRDs for every feature.
          </p>
        </div>
      </section>

      {/* Flow */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <KickstartFlow />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/src/components/sections/KickstartFlow.tsx \
        apps/marketing/src/app/kickstart/
git commit -m "feat(marketing): add /kickstart page with 6-step flow and planning modes"
```

---

## Task 8: Build /commands Page

**Files:**

- Create: `apps/marketing/src/components/sections/CommandsTable.tsx`
- Create: `apps/marketing/src/app/commands/page.tsx`

- [ ] **Step 1: Create CommandsTable component**

Create `apps/marketing/src/components/sections/CommandsTable.tsx`:

```tsx
'use client';

import { useState, useMemo } from 'react';

type Category = 'All' | 'Setup' | 'Planning' | 'Discovery' | 'Build' | 'Docs' | 'Utility';

interface Command {
  command: string;
  description: string;
  category: Exclude<Category, 'All'>;
}

const COMMANDS: Command[] = [
  // Setup
  {
    command: '/x4:onboard',
    description: 'Check tools, accounts, CLIs, companion plugins — set up your dev environment',
    category: 'Setup',
  },
  {
    command: '/x4:create [name]',
    description: 'Scaffold a new project (presets: full-stack, saas, landing, api-only)',
    category: 'Setup',
  },
  {
    command: '/x4:tour',
    description: 'Guided walkthrough — explore apps, test login, try AI chat, set up git',
    category: 'Setup',
  },
  {
    command: '/x4:add',
    description: 'Add a mobile or web app to an existing project',
    category: 'Setup',
  },
  {
    command: '/x4:env',
    description: 'Set up environment variables (database, auth, AI keys)',
    category: 'Setup',
  },
  {
    command: '/x4:status',
    description: 'Quick project health dashboard — apps, ports, database, git, plugins',
    category: 'Setup',
  },
  // Planning
  {
    command: '/x4:kickstart',
    description: 'Brainstorm features, design UI, prioritize, and batch-generate PRDs',
    category: 'Planning',
  },
  {
    command: '/x4:idea <idea>',
    description: 'Capture a feature idea to the backlog',
    category: 'Planning',
  },
  {
    command: '/x4:plan-backlog',
    description: 'Triage backlog → brainstorm → implementation plan → write PRD',
    category: 'Planning',
  },
  {
    command: '/x4:init-tracker',
    description: 'Scaffold STATUS.md, BACKLOG.md, planning folders',
    category: 'Planning',
  },
  // Discovery
  {
    command: '/x4:gaps',
    description: 'Find product gaps — dead ends, missing connections, incomplete flows',
    category: 'Discovery',
  },
  {
    command: '/x4:dream',
    description:
      'Explore big ideas — bold features, natural evolutions, untapped tech stack capabilities',
    category: 'Discovery',
  },
  // Build
  {
    command: '/x4:work',
    description: '7-phase pipeline with auto-loop: Orient → Build → Review → Ship → Next',
    category: 'Build',
  },
  {
    command: '/x4:run-tests',
    description: 'Run configured test commands (unit, e2e, lint, typecheck)',
    category: 'Build',
  },
  {
    command: '/x4:init-setup',
    description: 'Interactive wizard for database, hosting, CI, tests, tracker, llms.txt',
    category: 'Build',
  },
  {
    command: '/x4:init-agents',
    description: 'Generate project-specific agent files from templates',
    category: 'Build',
  },
  {
    command: '/x4:verify-local',
    description: 'Run all checks with auto-fix — mandatory ship gate',
    category: 'Build',
  },
  {
    command: '/x4:pr-create',
    description: 'Create branch + DB branch + draft PR',
    category: 'Build',
  },
  {
    command: '/x4:pr-status',
    description: 'Check CI, preview URLs, review state',
    category: 'Build',
  },
  { command: '/x4:pr-cleanup', description: 'Post-merge cleanup', category: 'Build' },
  // Docs
  {
    command: '/x4:llmstxt-init',
    description: 'Scaffold download script and docs directory',
    category: 'Docs',
  },
  {
    command: '/x4:llmstxt-update',
    description: 'Scan dependencies, discover, download llms.txt docs',
    category: 'Docs',
  },
  {
    command: '/x4:llmstxt-status',
    description: 'Read-only status report of current docs',
    category: 'Docs',
  },
  // Utility
  {
    command: '/x4:help',
    description:
      'Contextual plugin guide — detects project state, shows all commands, suggests next step',
    category: 'Utility',
  },
  {
    command: '/x4:doctor',
    description:
      'Project health diagnostic — prerequisites, config, agents, env vars, database, plugins, llms.txt',
    category: 'Utility',
  },
];

const CATEGORIES: Category[] = [
  'All',
  'Setup',
  'Planning',
  'Discovery',
  'Build',
  'Docs',
  'Utility',
];

export function CommandsTable() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filtered = useMemo(() => {
    return COMMANDS.filter((cmd) => {
      const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
      const matchesSearch =
        search === '' ||
        cmd.command.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search commands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card/80 px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'border border-border bg-card/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[200px_1fr_90px] border-b border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
          <span>Command</span>
          <span>Description</span>
          <span>Category</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((cmd) => (
            <div
              key={cmd.command}
              className="grid grid-cols-[200px_1fr_90px] items-start px-4 py-3.5 transition-colors hover:bg-card/50"
            >
              <span className="font-mono text-xs text-violet-300">{cmd.command}</span>
              <span className="pr-4 text-sm text-muted-foreground">{cmd.description}</span>
              <span className="text-xs text-muted-foreground/50">{cmd.category}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No commands match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-xs text-muted-foreground/40">
        {filtered.length} of {COMMANDS.length} commands
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create /commands page**

Create `apps/marketing/src/app/commands/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CommandsTable } from '@/components/sections/CommandsTable';

export const metadata: Metadata = {
  title: 'Commands',
  description: 'Complete reference for all 27 x4 Claude Code plugin commands.',
};

export default function CommandsPage() {
  return (
    <div className="pt-24">
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10">
            <h1 className="text-4xl font-bold sm:text-5xl">
              Command <span className="gradient-text">Reference</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              27 commands · all under the <span className="font-mono text-violet-400">/x4:</span>{' '}
              namespace
            </p>
          </div>
          <CommandsTable />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/src/components/sections/CommandsTable.tsx \
        apps/marketing/src/app/commands/
git commit -m "feat(marketing): add /commands page with searchable 27-command reference"
```

---

## Task 9: Build /discovery and /teams Pages

**Files:**

- Create: `apps/marketing/src/components/sections/DiscoveryExplainer.tsx`
- Create: `apps/marketing/src/app/discovery/page.tsx`
- Create: `apps/marketing/src/app/teams/page.tsx`

- [ ] **Step 1: Create DiscoveryExplainer component**

Create `apps/marketing/src/components/sections/DiscoveryExplainer.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const PIPELINE = [
  { label: '/x4:gaps', color: 'border-violet-500/30 text-violet-400', bg: 'bg-violet-500/5' },
  { label: '/x4:dream', color: 'border-emerald-500/30 text-emerald-400', bg: 'bg-emerald-500/5' },
  { label: '↓ backlog', color: 'border-border text-muted-foreground', bg: 'bg-card/50' },
  { label: '/x4:plan-backlog', color: 'border-border text-muted-foreground', bg: 'bg-card/50' },
  { label: '/x4:work', color: 'border-border text-muted-foreground', bg: 'bg-card/50' },
  { label: '↻ repeat', color: 'border-violet-500/30 text-violet-400', bg: 'bg-violet-500/5' },
];

export function DiscoveryExplainer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref}>
      {/* Two panels */}
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7 }}
      >
        <div className="rounded-xl border border-violet-500/20 bg-card/80 p-6">
          <div className="mb-3 font-mono text-lg font-bold text-violet-400">/x4:gaps</div>
          <div className="mb-4 text-sm font-medium text-foreground">Product Gap Finder</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scans your completed and planned features to surface what&apos;s missing. Finds dead
            ends (auth with no password reset), missing connections (features that should integrate
            but don&apos;t), incomplete user journeys, and stale backlog items that are now more
            relevant.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Dead ends', 'Missing links', 'Incomplete flows', 'Stale gaps'].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 font-mono text-xs text-violet-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-card/80 p-6">
          <div className="mb-3 font-mono text-lg font-bold text-emerald-400">/x4:dream</div>
          <div className="mb-4 text-sm font-medium text-foreground">Visionary Ideas Generator</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Interactive exploration of big ideas across three dimensions: bold features that would
            change the product&apos;s value proposition, natural evolutions of what&apos;s already
            built, and untapped capabilities in your tech stack (informed by llms.txt docs).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['What if', "What's next", "What's emerging"].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 font-mono text-xs text-emerald-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* The loop */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <p className="mb-6 text-sm text-muted-foreground">The continuous improvement loop</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PIPELINE.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${step.color} ${step.bg}`}
              >
                {step.label}
              </span>
              {i < PIPELINE.length - 1 && <span className="text-muted-foreground/30">→</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Create /discovery page**

Create `apps/marketing/src/app/discovery/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { DiscoveryExplainer } from '@/components/sections/DiscoveryExplainer';

export const metadata: Metadata = {
  title: 'Discovery',
  description:
    "Find what's missing in your product and explore what's possible. /x4:gaps and /x4:dream keep your product evolving.",
};

export default function DiscoveryPage() {
  return (
    <div className="pt-24">
      <section className="py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Your product tells you <span className="gradient-text">what it needs next.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Two tools. One loop. Continuous improvement on autopilot.
          </p>
        </div>
      </section>

      <section className="py-8 pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <DiscoveryExplainer />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create /teams page**

Create `apps/marketing/src/app/teams/page.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Teams',
  description:
    'Ship the x4 workflow with your code. Auto-suggest x4 to every teammate who opens the project.',
};

const SETTINGS_JSON = `{
  "extraKnownMarketplaces": {
    "x4-agent-plugins": {
      "source": {
        "source": "github",
        "repo": "studiox4/x4-agent-plugins"
      }
    }
  },
  "enabledPlugins": {
    "x4@rpg-life-agent-plugins": true
  }
}`;

const REQUIRED_PLUGINS = [
  {
    name: 'superpowers',
    usedBy: '/x4:kickstart, /x4:plan-backlog',
    desc: 'Structured brainstorming + writing plans',
  },
  {
    name: 'code-simplifier',
    usedBy: '/x4:work Phase 4',
    desc: 'Simplifies complex code after review',
  },
  {
    name: 'frontend-design',
    usedBy: '/x4:kickstart, Frontend agent',
    desc: 'UI design patterns, accessibility, responsive layout',
  },
];

const RECOMMENDED_PLUGINS = [
  {
    name: 'code-review',
    enhances: 'Reviewer agent',
    desc: 'Structured review patterns, vulnerability detection',
  },
  {
    name: 'playwright',
    enhances: 'Tester agent',
    desc: 'Playwright e2e test authoring and execution',
  },
  {
    name: 'typescript-lsp',
    enhances: 'All agents',
    desc: 'TypeScript diagnostics and type checking',
  },
  { name: 'commit-commands', enhances: 'Git workflow', desc: 'Commit message helpers' },
  { name: 'github', enhances: 'PR management', desc: 'GitHub issue and PR tools' },
  { name: 'railway', enhances: 'Deployment', desc: 'Railway deployment management' },
];

export default function TeamsPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Ship the workflow <span className="gradient-text">with the code.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Commit one config file. Every teammate who opens the project gets prompted to install x4
            — same plugin, same workflow, zero manual setup.
          </p>
        </div>
      </section>

      {/* Config snippet */}
      <section className="pb-16">
        <div className="mx-auto max-w-2xl px-6">
          <div className="gradient-border overflow-hidden rounded-xl">
            <div className="rounded-xl bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">
                  .claude/settings.json
                </span>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-sm text-foreground">
                <code>{SETTINGS_JSON}</code>
              </pre>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              'Auto-installs for new teammates',
              'Same plugin version across team',
              'No manual setup per developer',
            ].map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-border bg-card/50 p-4 text-center"
              >
                <div className="mb-2 text-emerald-400">✓</div>
                <div className="text-xs text-muted-foreground">{benefit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companion plugins */}
      <section className="py-16 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-2 text-2xl font-bold">Companion Plugins</h2>
          <p className="mb-10 text-muted-foreground">
            x4 integrates with official Claude Code plugins. All installed via{' '}
            <span className="font-mono text-violet-400">/x4:onboard</span>.
          </p>

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Required by x4 workflows
          </h3>
          <div className="mb-10 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[140px_180px_1fr] border-b border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
              <span>Plugin</span>
              <span>Used By</span>
              <span>What It Does</span>
            </div>
            {REQUIRED_PLUGINS.map((p) => (
              <div
                key={p.name}
                className="grid grid-cols-[140px_180px_1fr] items-start border-b border-border px-4 py-3.5 last:border-0"
              >
                <span className="font-mono text-xs text-violet-300">{p.name}</span>
                <span className="text-xs text-muted-foreground/70">{p.usedBy}</span>
                <span className="text-sm text-muted-foreground">{p.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended
          </h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[140px_180px_1fr] border-b border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
              <span>Plugin</span>
              <span>Enhances</span>
              <span>What It Does</span>
            </div>
            {RECOMMENDED_PLUGINS.map((p) => (
              <div
                key={p.name}
                className="grid grid-cols-[140px_180px_1fr] items-start border-b border-border px-4 py-3.5 last:border-0"
              >
                <span className="font-mono text-xs text-violet-300">{p.name}</span>
                <span className="text-xs text-muted-foreground/70">{p.enhances}</span>
                <span className="text-sm text-muted-foreground">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/src/components/sections/DiscoveryExplainer.tsx \
        apps/marketing/src/app/discovery/ \
        apps/marketing/src/app/teams/
git commit -m "feat(marketing): add /discovery and /teams pages"
```

---

## Task 10: Final Visual Verification + Push Branch

**Files:** None new — verification and push only.

- [ ] **Step 1: Run the dev server for full visual pass**

```bash
cd apps/marketing && bun dev
```

Visit each route and verify:

- http://localhost:3001 — homepage: hero animates, plan card appears, all 6 sections visible, nav links correct
- http://localhost:3001/kickstart — 6-step flow renders, planning modes section visible
- http://localhost:3001/commands — table loads with 27 commands, search filters work, category tabs filter correctly
- http://localhost:3001/discovery — two panels render, loop pipeline visible
- http://localhost:3001/teams — config snippet shows, companion plugins tables render
- http://localhost:3001/about — still renders (untouched)
- http://localhost:3001/features — should 404 (page deleted)
- http://localhost:3001/docs — should redirect to GitHub (verify in browser)

- [ ] **Step 2: Final type-check**

```bash
cd /Users/corbanbaxter/Development/rpg-life
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: PASS with 0 errors

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feature/marketing-reimagine
```

- [ ] **Step 4: Final commit if any minor fixes were needed**

```bash
git add -A
git commit -m "fix(marketing): visual verification fixes"
git push
```
