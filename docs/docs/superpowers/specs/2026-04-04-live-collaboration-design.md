# Live Collaboration Layer — Design Spec

**Date:** 2026-04-04
**Scope:** Presence-only (avatar stack + live cursors) via Liveblocks. Opt-in via env vars. Shared package for web and marketing consumers.

---

## 1. Problem

rpg-life has no real-time features out of the box. Developers who want to show who's online or add live cursors must wire up a WebSocket provider themselves. A boilerplate should demonstrate this capability so developers can see the pattern and extend it.

---

## 2. Goal

Ship a presence layer that:

- Shows an avatar stack of online users in `DashboardHeader`
- Renders live cursors on the dashboard page
- Is entirely opt-in — missing env vars render nothing, the app works normally
- Ships a `<LiveDemoSection />` on the marketing site so visitors can see it without logging in

---

## 3. Architecture

`packages/shared/collaboration/` contains the Liveblocks provider and hooks. `apps/web` uses it for real presence. `apps/marketing` uses only the static `<LiveDemoSection />` component — no real Liveblocks connection, no Liveblocks packages installed directly in marketing.

A Next.js Route Handler at `apps/web/src/app/api/liveblocks-auth/route.ts` signs room tokens server-side using `LIVEBLOCKS_SECRET_KEY`. The client uses `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` to identify the project.

**Feature gate:** if `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` is absent, `CollaborationProvider` renders its children unchanged and all hooks return safe empty defaults. Zero runtime errors, zero UI changes.

---

## 4. File Changes

### 4.1 New package: `packages/shared/collaboration/`

```
packages/shared/collaboration/
  index.ts              ← re-exports everything
  provider.tsx          ← CollaborationProvider (wraps LiveblocksProvider)
  hooks.ts              ← usePresence, useOthers, useCursors
  types.ts              ← UserMeta, Presence, CursorPosition types
```

**`provider.tsx`** — See section 4.5 for the final implementation. It wraps both `LiveblocksProvider` and `RoomProvider`, accepts a `roomId` prop, and no-ops entirely when `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` is absent.

**`types.ts`**:

```ts
export type CursorPosition = { x: number; y: number };
export type UserMeta = { id: string; info: { name: string; avatar: string; color: string } };
export type Presence = { cursor: CursorPosition | null };
```

**`hooks.ts`** — re-exports `useOthers`, `useMyPresence`, `useUpdateMyPresence` directly from `@liveblocks/react`. No `createRoomContext` call — that pattern binds hooks to a context-specific `RoomProvider` which conflicts with `provider.tsx` using the global `RoomProvider`. Plain re-exports work with the global `RoomProvider` and type safety on `user.info` is handled via optional chaining in the components.

```ts
export { useOthers, useMyPresence, useUpdateMyPresence } from '@liveblocks/react';
```

These hooks throw when called outside a `RoomProvider` — callers must guard via the inner-component split pattern (see sections 4.6 and 4.8).

### 4.2 `packages/shared/package.json`

Add `@liveblocks/react` and `@liveblocks/client` as dependencies.

Add `"./collaboration"` to the `exports` map:

```json
"./collaboration": "./collaboration/index.ts"
```

Update the `lint` script in `packages/shared/package.json` to include `collaboration/`:

```json
"lint": "eslint src/ types/ utils/ api-client/ hooks/ ui/ ai-types/ collaboration/"
```

Add the following entries to the `include` array in `packages/shared/tsconfig.json` so TypeScript checks the new module (both `.ts` and `.tsx` since `provider.tsx` is a JSX file):

```json
"collaboration/**/*.ts",
"collaboration/**/*.tsx"
```

### 4.3 `apps/web` — next.config.ts + package.json

**`NEXT_PUBLIC_` env var inlining:** `process.env.NEXT_PUBLIC_*` is inlined at build time by Next.js only for code it compiles directly. Since `provider.tsx` lives in `packages/shared`, Next.js must transpile the package for inlining to work. `apps/web/next.config.ts` already includes `transpilePackages: ['@rpg-life/shared', '@rpg-life/auth']` — no change required, `@rpg-life/shared` is already present.

**`apps/marketing` does not need `transpilePackages`** — marketing never imports `provider.tsx` or any code from `packages/shared/collaboration`. The marketing demo is a purely static component with no Liveblocks imports. No change required to `apps/marketing/next.config.ts`.

Add only `@liveblocks/node` to `apps/web/package.json` dependencies (server-only, used by the auth route handler). Do NOT add `@liveblocks/react` to `apps/web` — `AvatarStack` and `LiveCursors` must import hooks from `@rpg-life/shared/collaboration` (the re-exports in `hooks.ts`) to avoid two separate module instances of `@liveblocks/react`. Having two copies would make the `RoomProvider` registered in `packages/shared`'s copy invisible to hooks resolved from a different copy, causing "No RoomProvider found" errors at runtime.

### 4.4 `apps/web` — auth endpoint

**New file:** `apps/web/src/app/api/liveblocks-auth/route.ts`

`packages/auth/src/server.ts` exports only `auth` (a Better Auth instance). Session retrieval uses `auth.api.getSession({ headers: req.headers })`. `apps/web` does not have a centralised env validation module (unlike `apps/api`) — `LIVEBLOCKS_SECRET_KEY` is read from `process.env` directly with an existence guard.

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

### 4.5 `apps/web` — dashboard layout

**Modify:** `apps/web/src/app/(dashboard)/layout.tsx`

`RoomProvider` must be inside `CollaborationProvider` so it is skipped when Liveblocks is not configured. Move both into `CollaborationProvider` — update its implementation to also conditionally render `RoomProvider`:

```tsx
// packages/shared/collaboration/provider.tsx — updated
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

Dashboard layout usage:

```tsx
import { CollaborationProvider } from '@rpg-life/shared/collaboration';

export default function DashboardLayout({ children }) {
  return (
    <CollaborationProvider roomId="room-dashboard">
      <SidebarProvider>...existing layout...</SidebarProvider>
    </CollaborationProvider>
  );
}
```

This ensures `useOthers`, `useUpdateMyPresence`, `AvatarStack`, and `LiveCursors` are only mounted inside a valid Liveblocks context. When the env var is absent, `CollaborationProvider` is a passthrough and none of the Liveblocks hooks are ever called.

### 4.6 `apps/web` — AvatarStack component

**New file:** `apps/web/src/components/avatar-stack.tsx`

Uses `useOthers()` to render up to 5 user avatars. Renders nothing when Liveblocks is not configured or no others are present.

Uses the inner-component split pattern so hooks are never called outside a `RoomProvider` context: the outer `AvatarStack` guards on the env var and returns null early; the inner `AvatarStackInner` is only rendered (and thus only calls hooks) when a valid context exists.

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

### 4.7 `apps/web` — DashboardHeader

**Modify:** `apps/web/src/components/dashboard-header.tsx`

Add `<AvatarStack />` before `<ThemeToggle />` inside the existing `flex items-center gap-2` wrapper:

```tsx
import { AvatarStack } from '@/components/avatar-stack';
// ...in the header right section (inside existing <div className="flex items-center gap-2">):
<div className="flex items-center gap-2">
  <AvatarStack />
  <ThemeToggle />
  <UserNav />
</div>;
```

### 4.8 `apps/web` — Live cursors on dashboard page

**New file:** `apps/web/src/components/live-cursors.tsx`

Tracks mouse position via `useUpdateMyPresence`, renders other users' cursors via `useOthers`.

Uses the same inner-component split pattern as `AvatarStack`: the outer `LiveCursors` guards on the env var; the inner `LiveCursorsInner` is only rendered when a valid `RoomProvider` context exists.

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

**Modify:** `apps/web/src/app/(dashboard)/dashboard/page.tsx` — add `<LiveCursors />` at the top of the page.

### 4.9 `apps/web` — no env schema changes needed

`apps/web` does not have a centralised Zod env validation module (unlike `apps/api`). Both Liveblocks vars are accessed via `process.env` directly — `LIVEBLOCKS_SECRET_KEY` is read inside the POST handler with an existence guard (section 4.4), and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` is inlined by Next.js at build time.

### 4.10 Root `.env.example`

Add:

```env
# Liveblocks — real-time presence (optional, get keys at liveblocks.io)
# NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxx
# LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxx
```

### 4.11 Marketing site — `<LiveDemoSection />`

**New file:** `apps/marketing/src/components/sections/LiveDemoSection.tsx`

A static visual demo (no real Liveblocks connection needed) showing:

- Three simulated user avatars with colored rings
- Animated cursor trails moving across a mock dashboard card
- Copy: "See who's online. Watch them move."

Uses `motion/react` for cursor animation. Same card styling as `DayInLifeSection`. Teal accent (`#14b8a6`).

**New file:** `apps/marketing/src/app/collaboration/page.tsx`

Hero + `<LiveDemoSection />`. Metadata: `title: 'Live Collaboration — x4'`.

**Modify:** `apps/marketing/src/components/layout/Navbar.tsx` — no navbar entry (accessible via direct URL, linked from homepage if desired).

### 4.12 `CLAUDE.md`

Add to env vars table:

```md
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks server key for presence auth (optional) | No |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Liveblocks public key for client (optional) | No |
```

---

## 5. Constraints

- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` absent → `CollaborationProvider` is a passthrough, `AvatarStack` and `LiveCursors` return null early (inner-component split pattern prevents hooks from being called outside `RoomProvider` context), nothing renders. Zero errors.
- `@liveblocks/react` and `@liveblocks/client` installed in `packages/shared`. `@liveblocks/node` installed in `apps/web` only (server-side auth handler).
- `RoomProvider` must be a Client Component — `apps/web/(dashboard)/layout.tsx` already has `'use client'`.
- Marketing demo is purely visual/animated — no real Liveblocks connection, no env vars required.
- `LiveCursors` uses `position: fixed` so cursors are viewport-relative and work across any page content.

---

## 6. Env Vars

| Var                                 | Where                    | Purpose                            |
| ----------------------------------- | ------------------------ | ---------------------------------- |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | `apps/web` (client)      | Identifies Liveblocks project      |
| `LIVEBLOCKS_SECRET_KEY`             | `apps/web` (server only) | Signs room tokens in auth endpoint |

---

## 7. Testing

| Check            | Command                                | Expected                       |
| ---------------- | -------------------------------------- | ------------------------------ |
| Type-check       | `bun turbo type-check`                 | Exit 0                         |
| Build            | `bun turbo build`                      | Exit 0                         |
| Feature gate     | Run without env vars set               | No UI changes, no errors       |
| Presence visible | Set env vars, open two browser windows | Avatar stack shows second user |
| Marketing demo   | Visit `/collaboration`                 | Animated cursors render        |
