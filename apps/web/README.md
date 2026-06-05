# @rpg-life/web

Primary web application built with **Next.js 15 App Router**.

## Overview

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS v4 (`@rpg-life/ui`)
- **Data**: tRPC client via `@trpc/react-query`
- **Auth**: better-auth magic link (`@rpg-life/auth/client`)
- **Port**: 3000 (override with `PORT_WEB` in root `.env`)

## Development

```bash
bun run dev          # Start on :3000 (via monorepo root)
bun run build        # Build for production
bun run test:e2e     # Run Playwright E2E tests
bun run test:e2e:ui  # Playwright interactive UI
```

For Docker Compose setup and smoke verification, see the [root README](../../README.md).

## Structure

```
src/
  app/           File-based routes (App Router, RSC-first)
    (auth)/      Auth gate layout + sign-in page
    (app)/       Authenticated shell: Quest Board, My Profile
  components/    React components (auth, sidebar, tutorial, providers)
  lib/           Pure utilities and server-side helpers
  middleware.ts  Session gate — redirects unauthenticated users to /sign-in
```

## Auth Flow

- Unauthenticated users hitting protected routes (`/quest-board`, `/profile`, etc.) are redirected to `/sign-in` by `middleware.ts`
- Sign-in uses `authClient.signIn.magicLink` with `callbackURL: '/quest-board'`
- Post-send confirmation stays on `/sign-in` (masked email + resend)
- Authenticated users on `/sign-in` redirect to `/quest-board`
- Session cookie is HttpOnly on the web origin; `/api/auth/*` and `/api/trpc/*` proxy to the api service
- Set `NEXT_PUBLIC_BETTER_AUTH_URL` to match `BETTER_AUTH_URL` (default `http://localhost:3000`)

## Tutorial Flow

- `(app)/layout.tsx` fetches `tutorial.getStatus` server-side and passes `initialTutorialSeen` to `AppShell`
- First visit (`tutorial_seen_at` null): bottom `TutorialSheet` auto-opens before Quest Board interaction
- Dismiss (first-run): calls `tutorial.markSeen` → writes `user_progress.tutorial_seen_at`
- Subsequent visits: no auto-open; sidebar **Tutorial** replays same content without calling `markSeen`

## E2E Tests

Playwright tests in `e2e/`:

- `auth.spec.ts` — redirect to sign-in, protected routes, email validation copy
- `accessibility.spec.ts` — axe-core audits for critical pages and flows

Run with `bun run test:e2e`. Config in `playwright.config.ts`.

First-time setup: `bunx playwright install --with-deps`
