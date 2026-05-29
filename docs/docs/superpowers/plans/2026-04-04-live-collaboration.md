# Live Collaboration Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Liveblocks presence layer (avatar stack + live cursors) to the dashboard, plus a static animated demo on the marketing site — entirely opt-in via env vars.

**Architecture:** `packages/shared/collaboration/` holds the provider, typed hooks, and types. `apps/web` wraps the dashboard layout with `CollaborationProvider` and renders `AvatarStack` / `LiveCursors`. A Next.js Route Handler at `/api/liveblocks-auth` signs room tokens server-side. Marketing ships a purely static `LiveDemoSection` with no real Liveblocks connection.

**Tech Stack:** `@liveblocks/react`, `@liveblocks/client` (in `packages/shared`), `@liveblocks/node` (in `apps/web` server only), `motion/react` (already in `apps/marketing`), Bun, Next.js 15 App Router, Better Auth.

---

## File Map

| File                                                         | Action | Responsibility                                                        |
| ------------------------------------------------------------ | ------ | --------------------------------------------------------------------- |
| `packages/shared/collaboration/types.ts`                     | Create | `CursorPosition`, `UserMeta`, `Presence` types                        |
| `packages/shared/collaboration/hooks.ts`                     | Create | Plain re-exports from `@liveblocks/react`                             |
| `packages/shared/collaboration/provider.tsx`                 | Create | `CollaborationProvider` — feature-gated wrapper                       |
| `packages/shared/collaboration/index.ts`                     | Create | Re-exports everything from the module                                 |
| `packages/shared/package.json`                               | Modify | Add Liveblocks deps, `./collaboration` export, update lint script     |
| `packages/shared/tsconfig.json`                              | Modify | Add `collaboration/**/*.ts` and `collaboration/**/*.tsx` to `include` |
| `apps/web/package.json`                                      | Modify | Add `@liveblocks/node` (server-only)                                  |
| `apps/web/src/app/api/liveblocks-auth/route.ts`              | Create | POST handler that signs Liveblocks room tokens                        |
| `apps/web/src/app/(dashboard)/layout.tsx`                    | Modify | Wrap with `CollaborationProvider roomId="room-dashboard"`             |
| `apps/web/src/components/avatar-stack.tsx`                   | Create | Shows up to 5 online user avatars in the header                       |
| `apps/web/src/components/dashboard-header.tsx`               | Modify | Add `<AvatarStack />` inside the right-side flex div                  |
| `apps/web/src/components/live-cursors.tsx`                   | Create | Renders other users' cursors + broadcasts own position                |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx`            | Modify | Add `<LiveCursors />` at the top of the page                          |
| `.env.example`                                               | Modify | Add Liveblocks vars as commented-out examples                         |
| `CLAUDE.md`                                                  | Modify | Add two rows to the env vars table                                    |
| `apps/marketing/src/components/sections/LiveDemoSection.tsx` | Create | Static animated presence demo                                         |
| `apps/marketing/src/app/collaboration/page.tsx`              | Create | Marketing page: hero + `<LiveDemoSection />`                          |

---

## Task 1: `packages/shared/collaboration/` — shared types, hooks, provider, index

**Files:**

- Create: `packages/shared/collaboration/types.ts`
- Create: `packages/shared/collaboration/hooks.ts`
- Create: `packages/shared/collaboration/provider.tsx`
- Create: `packages/shared/collaboration/index.ts`

> **Context:** These four files form the entire shared module. `types.ts` is a leaf — no imports from outside. `hooks.ts` is a plain re-export (one line). `provider.tsx` is `'use client'` and reads `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` at module scope — that's fine because `apps/web/next.config.ts` already has `transpilePackages: ['@rpg-life/shared', '@rpg-life/auth']`, so Next.js inlines the env var at build time. IMPORTANT: do NOT use `createRoomContext` — that binds hooks to a context-specific `RoomProvider` which conflicts with the global one used here.

- [ ] **Step 1: Create `packages/shared/collaboration/types.ts`**

```ts
export type CursorPosition = { x: number; y: number };
export type UserMeta = { id: string; info: { name: string; avatar: string; color: string } };
export type Presence = { cursor: CursorPosition | null };
```

- [ ] **Step 2: Create `packages/shared/collaboration/hooks.ts`**

Plain re-export — no `createRoomContext` (would bind to a different RoomProvider instance):

```ts
export { useOthers, useMyPresence, useUpdateMyPresence } from '@liveblocks/react';
```

- [ ] **Step 3: Create `packages/shared/collaboration/provider.tsx`**

```tsx
'use client';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

export function CollaborationProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId?: string;
}) {
  if (!PUBLIC_KEY) return <>{children}</>;
  return (
    <LiveblocksProvider publicApiKey={PUBLIC_KEY} authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId ?? 'room-default'} initialPresence={{ cursor: null }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
```

- [ ] **Step 4: Create `packages/shared/collaboration/index.ts`**

```ts
export { CollaborationProvider } from './provider';
export { useOthers, useMyPresence, useUpdateMyPresence } from './hooks';
export type { CursorPosition, UserMeta, Presence } from './types';
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/collaboration/
git commit -m "feat(shared): add collaboration module — provider, hooks, types"
```

---

## Task 2: Wire `packages/shared` — deps, exports, tsconfig

**Files:**

- Modify: `packages/shared/package.json`
- Modify: `packages/shared/tsconfig.json`

> **Context:** Current `packages/shared/package.json` has no Liveblocks deps and no `./collaboration` in the exports map. Current `packages/shared/tsconfig.json` lists each top-level directory explicitly in `include` — must add both `.ts` and `.tsx` globs since `provider.tsx` is JSX. The lint script currently reads `eslint src/ types/ utils/ api-client/ hooks/ ui/ ai-types/` — add `collaboration/` to the end.

- [ ] **Step 1: Add Liveblocks deps to `packages/shared/package.json`**

In the `dependencies` object, add:

```json
"@liveblocks/client": "^2.0.0",
"@liveblocks/react": "^2.0.0"
```

- [ ] **Step 2: Add `./collaboration` to the exports map in `packages/shared/package.json`**

```json
"./collaboration": "./collaboration/index.ts"
```

- [ ] **Step 3: Update the lint script in `packages/shared/package.json`**

Change:

```json
"lint": "eslint src/ types/ utils/ api-client/ hooks/ ui/ ai-types/"
```

To:

```json
"lint": "eslint src/ types/ utils/ api-client/ hooks/ ui/ ai-types/ collaboration/"
```

- [ ] **Step 4: Add collaboration globs to `packages/shared/tsconfig.json`**

In the `include` array (after `"ai-types/**/*.ts"`), add:

```json
"collaboration/**/*.ts",
"collaboration/**/*.tsx"
```

- [ ] **Step 5: Install deps and verify type-check passes**

```bash
bun install
bun turbo type-check --filter=@rpg-life/shared
```

Expected: Exit 0. If it fails, the most likely issue is a missing `react` type for JSX in `provider.tsx` — check that `"jsx": "react-jsx"` is in `packages/shared/tsconfig.json` (it already is).

- [ ] **Step 6: Commit**

```bash
git add packages/shared/package.json packages/shared/tsconfig.json bun.lock
git commit -m "feat(shared): wire collaboration exports, deps, tsconfig"
```

---

## Task 3: `apps/web` — install `@liveblocks/node` + auth endpoint

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/src/app/api/liveblocks-auth/route.ts`

> **Context:** `@liveblocks/node` is a server-only package for signing room tokens. It must live in `apps/web`, NOT in `packages/shared`. Do NOT add `@liveblocks/react` to `apps/web` — the components import it via `@rpg-life/shared/collaboration` (single module instance). The auth handler uses `auth.api.getSession({ headers: req.headers })` from `@rpg-life/auth/server` — this is the correct Better Auth pattern (there is no standalone `getSession()` export). The `stringToColor` utility deterministically maps a user ID to one of 7 brand colors.

- [ ] **Step 1: Add `@liveblocks/node` to `apps/web/package.json`**

In the `dependencies` object, add:

```json
"@liveblocks/node": "^2.0.0"
```

Run `bun install`.

- [ ] **Step 2: Create the auth directory**

```bash
mkdir -p apps/web/src/app/api/liveblocks-auth
```

- [ ] **Step 3: Create `apps/web/src/app/api/liveblocks-auth/route.ts`**

```ts
import { Liveblocks } from '@liveblocks/node';
import { auth } from '@rpg-life/auth/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) return new Response('Liveblocks not configured', { status: 503 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const liveblocks = new Liveblocks({ secret });
  const { status, body } = await liveblocks.identifyUser(
    { userId: session.user.id },
    {
      userInfo: {
        name: session.user.name ?? 'Anonymous',
        avatar: session.user.image ?? '',
        color: stringToColor(session.user.id),
      },
    },
  );
  return new Response(body, { status });
}

function stringToColor(str: string): string {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  let hash = 0;
  for (const ch of str) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
```

- [ ] **Step 4: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: Exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/src/app/api/liveblocks-auth/ bun.lock
git commit -m "feat(web): add @liveblocks/node and Liveblocks auth endpoint"
```

---

## Task 4: Wrap dashboard layout with `CollaborationProvider`

**Files:**

- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

> **Context:** The current layout is already `'use client'` (line 1) and renders `<SidebarProvider>` wrapping the full UI. Wrap the return value in `<CollaborationProvider roomId="room-dashboard">`. IMPORTANT: keep `<CommandMenu />` — it's currently outside `<SidebarInset>` at the end of the `SidebarProvider` tree. The `CollaborationProvider` must be the outermost wrapper so `AvatarStack` and `LiveCursors` (which are children) are always inside a valid Liveblocks context when the env var is set.

- [ ] **Step 1: Modify `apps/web/src/app/(dashboard)/layout.tsx`**

Add the import at the top:

```tsx
import { CollaborationProvider } from '@rpg-life/shared/collaboration';
```

Wrap the return:

```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CollaborationProvider roomId="room-dashboard">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
        <CommandMenu />
      </SidebarProvider>
    </CollaborationProvider>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/layout.tsx
git commit -m "feat(web): wrap dashboard layout with CollaborationProvider"
```

---

## Task 5: `AvatarStack` component + `DashboardHeader` integration

**Files:**

- Create: `apps/web/src/components/avatar-stack.tsx`
- Modify: `apps/web/src/components/dashboard-header.tsx`

> **Context:** `AvatarStack` uses the inner-component split pattern. The exported `AvatarStack` checks `PUBLIC_KEY` and returns null early when Liveblocks is not configured — this prevents `useOthers()` from being called outside a `RoomProvider`. The inner `AvatarStackInner` component holds all the hook calls and is only rendered when the context is valid. Import `useOthers` from `@rpg-life/shared/collaboration` (NOT from `@liveblocks/react` directly — single module instance constraint). The existing `DashboardHeader` has `<div className="flex items-center gap-2">` at line 53 wrapping `<ThemeToggle />` and `<UserNav />` — add `<AvatarStack />` as the first child inside that div.

- [ ] **Step 1: Create `apps/web/src/components/avatar-stack.tsx`**

```tsx
'use client';
import { useOthers } from '@rpg-life/shared/collaboration';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

export function AvatarStack() {
  if (!PUBLIC_KEY) return null;
  return <AvatarStackInner />;
}

function AvatarStackInner() {
  const others = useOthers();
  if (others.length === 0) return null;
  const visible = others.slice(0, 5);
  const overflow = others.length - 5;

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <Avatar key={user.connectionId} className="h-7 w-7 border-2 border-background">
          <AvatarImage src={user.info?.avatar} />
          <AvatarFallback style={{ backgroundColor: user.info?.color }}>
            {user.info?.name?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
          +{overflow}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `apps/web/src/components/dashboard-header.tsx`**

Add the import (after the existing imports):

```tsx
import { AvatarStack } from '@/components/avatar-stack';
```

Update the right-side div (currently at line 53):

```tsx
<div className="flex items-center gap-2">
  <AvatarStack />
  <ThemeToggle />
  <UserNav />
</div>
```

- [ ] **Step 3: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: Exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/avatar-stack.tsx apps/web/src/components/dashboard-header.tsx
git commit -m "feat(web): add AvatarStack component and wire into DashboardHeader"
```

---

## Task 6: `LiveCursors` component + dashboard page integration

**Files:**

- Create: `apps/web/src/components/live-cursors.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

> **Context:** Same inner-component split as `AvatarStack`. `LiveCursors` guards on `PUBLIC_KEY`; `LiveCursorsInner` calls hooks. Import both `useOthers` and `useUpdateMyPresence` from `@rpg-life/shared/collaboration`. The `useEffect` registers `mousemove` and `mouseleave` on `window` — `updatePresence` is a stable reference from Liveblocks so the dep array is correct. Cursors use `position: fixed` so they're viewport-relative and work regardless of scroll position. Add `<LiveCursors />` as the very first element inside the `<div className="space-y-6">` in `dashboard/page.tsx`.

- [ ] **Step 1: Create `apps/web/src/components/live-cursors.tsx`**

```tsx
'use client';
import { useOthers, useUpdateMyPresence } from '@rpg-life/shared/collaboration';
import { useEffect } from 'react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

export function LiveCursors() {
  if (!PUBLIC_KEY) return null;
  return <LiveCursorsInner />;
}

function LiveCursorsInner() {
  const others = useOthers();
  const updatePresence = useUpdateMyPresence();

  useEffect(() => {
    const onMove = (e: MouseEvent) => updatePresence({ cursor: { x: e.clientX, y: e.clientY } });
    const onLeave = () => updatePresence({ cursor: null });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [updatePresence]);

  return (
    <>
      {others.map(
        (user) =>
          user.presence.cursor && (
            <div
              key={user.connectionId}
              className="pointer-events-none fixed z-50"
              style={{ left: user.presence.cursor.x, top: user.presence.cursor.y }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill={user.info?.color ?? '#3b82f6'}>
                <path d="M0 0L16 6L8 8L6 16Z" />
              </svg>
              <span
                className="ml-1 rounded px-1 text-xs text-white"
                style={{ backgroundColor: user.info?.color ?? '#3b82f6' }}
              >
                {user.info?.name}
              </span>
            </div>
          ),
      )}
    </>
  );
}
```

- [ ] **Step 2: Modify `apps/web/src/app/(dashboard)/dashboard/page.tsx`**

Add the import:

```tsx
import { LiveCursors } from '@/components/live-cursors';
```

Add `<LiveCursors />` as the first child inside the return div:

```tsx
return (
  <div className="space-y-6">
    <LiveCursors />
    {/* Welcome Banner */}
    ...rest of existing content unchanged...
  </div>
);
```

- [ ] **Step 3: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: Exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/live-cursors.tsx apps/web/src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(web): add LiveCursors component and wire into dashboard page"
```

---

## Task 7: Env vars — `.env.example` + `CLAUDE.md`

**Files:**

- Modify: `.env.example`
- Modify: `CLAUDE.md`

> **Context:** `.env.example` currently ends with `APP_VERSION=0.0.0`. Add the Liveblocks block after it, commented out (they're optional). `CLAUDE.md` has an env vars table — add two rows for the new vars.

- [ ] **Step 1: Append Liveblocks block to `.env.example`**

Append to the end of `.env.example`:

```env

# Liveblocks — real-time presence (optional, get keys at liveblocks.io)
# NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxx
# LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxx
```

- [ ] **Step 2: Add env vars to `CLAUDE.md`**

Find the env vars table in `CLAUDE.md` (the table with `DATABASE_URL`, `JWT_SECRET`, etc.). Add two rows at the end of the table:

```md
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks server key for presence auth (optional) | No |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Liveblocks public key for client (optional) | No |
```

- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs: add Liveblocks env vars to .env.example and CLAUDE.md"
```

---

## Task 8: Marketing — `LiveDemoSection` + collaboration page

**Files:**

- Create: `apps/marketing/src/components/sections/LiveDemoSection.tsx`
- Create: `apps/marketing/src/app/collaboration/page.tsx`

> **Context:** This is a purely static visual demo — no Liveblocks packages, no env vars required. Uses `motion/react` for cursor animation (already installed at `motion@12.34.0`). Follow the same card styling as `DayInLifeSection.tsx` (dark card `bg-card border rounded-2xl`, teal accent `#14b8a6`). The component shows 3 simulated user avatars and 2 animated cursors floating over a mock dashboard card. The marketing app uses PascalCase filenames for all section components — use `LiveDemoSection.tsx`. The page lives at `apps/marketing/src/app/collaboration/page.tsx` (Next.js App Router, creates the `/collaboration` route).

- [ ] **Step 1: Create `apps/marketing/src/components/sections/LiveDemoSection.tsx`**

```tsx
'use client';

import { motion } from 'motion/react';

const USERS = [
  { name: 'Alex', color: '#3b82f6', initial: 'A' },
  { name: 'Jordan', color: '#8b5cf6', initial: 'J' },
  { name: 'Sam', color: '#14b8a6', initial: 'S' },
];

const CURSOR_PATHS = [
  { x: [60, 120, 80, 160, 100], y: [80, 60, 140, 100, 60] },
  { x: [200, 160, 220, 140, 200], y: [120, 80, 160, 100, 120] },
];

export function LiveDemoSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for teams</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            See who&apos;s online. Watch them move. Presence ships as a boilerplate feature.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8">
          {/* Avatar stack */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {USERS.map((user) => (
                <div
                  key={user.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-sm font-semibold text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.initial}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">3 people online</span>
            <span
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: '#14b8a614', color: '#14b8a6' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#14b8a6' }} />
              live
            </span>
          </div>

          {/* Mock dashboard card with animated cursors */}
          <div className="relative overflow-hidden rounded-xl border bg-background p-6">
            <div className="mb-4 h-4 w-32 rounded bg-muted" />
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted" />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>

            {/* Animated cursors */}
            {CURSOR_PATHS.map((path, i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute"
                animate={{ x: path.x, y: path.y }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'easeInOut',
                  delay: i * 1.5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill={USERS[i].color}>
                  <path d="M0 0L16 6L8 8L6 16Z" />
                </svg>
                <span
                  className="ml-1 whitespace-nowrap rounded px-1 text-xs text-white"
                  style={{ backgroundColor: USERS[i].color }}
                >
                  {USERS[i].name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `apps/marketing/src/app/collaboration/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { LiveDemoSection } from '@/components/sections/LiveDemoSection';
import { CTASection } from '@/components/sections/CTASection';

export const metadata: Metadata = {
  title: 'Live Collaboration',
  description:
    'Real-time presence built into the boilerplate. Avatar stacks, live cursors, and multiplayer — wired up and opt-in from day one.',
};

export default function CollaborationPage() {
  return (
    <>
      {/* Hero */}
      <section className="pb-12 pt-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Real-time presence, <span className="gradient-text">out of the box</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Avatar stacks, live cursors, and room-based multiplayer — wired into{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">packages/shared</code> and opt-in
            via env vars. No WebSocket boilerplate required.
          </p>
        </div>
      </section>

      <LiveDemoSection />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 3: Type-check marketing**

```bash
bun turbo type-check --filter=@rpg-life/marketing
```

Expected: Exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/src/components/sections/LiveDemoSection.tsx apps/marketing/src/app/collaboration/
git commit -m "feat(marketing): add LiveDemoSection and /collaboration page"
```

---

## Final verification

- [ ] **Full type-check across all packages**

```bash
bun turbo type-check
```

Expected: Exit 0 for all packages.

- [ ] **Full build**

```bash
bun turbo build
```

Expected: Exit 0 for all packages.

- [ ] **Feature gate check** — start the dev server WITHOUT setting `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`. Navigate to `/dashboard`. Verify: no console errors, no visible UI changes from baseline, `AvatarStack` renders nothing, `LiveCursors` renders nothing.

- [ ] **Marketing page check** — visit `http://localhost:3001/collaboration`. Verify: hero renders, animated cursors are visible in the mock dashboard card, no console errors.

- [ ] **Final commit (if any cleanup needed)**

```bash
git add -p
git commit -m "chore: finalize live collaboration implementation"
```
