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

## Structure

```
src/
  app/
    layout.tsx              # Root layout + providers
    page.tsx                # Interim home (token showcase; Quest Board in Story 1.4)
    (auth)/
      layout.tsx            # Auth gate layout (star motif)
      sign-in/page.tsx      # Magic link sign-in + post-send state
  components/
    auth/sign-in-form.tsx   # Client island for Auth B flow
  lib/
    trpc-server.ts          # RSC tRPC caller
    env.ts                  # Validated env
  middleware.ts             # src/middleware.ts — session gate → /sign-in (must be under src/ when using src/app)
```

## Auth Flow

- Unauthenticated users hitting protected routes are redirected to `/sign-in` by `middleware.ts`
- Sign-in uses `authClient.signIn.magicLink` (Resend email; link opens on same origin via Next rewrite)
- Post-send confirmation stays on `/sign-in` (masked email + resend)
- Session cookie is HttpOnly on the web origin; `/api/auth/*` and `/api/trpc/*` proxy to the api service
- Set `NEXT_PUBLIC_BETTER_AUTH_URL` to match `BETTER_AUTH_URL` (default `http://localhost:3000`)

## E2E Tests

Playwright tests in `e2e/`:

- `auth.spec.ts` — redirect to sign-in, email validation copy
- Full magic-link inbox flow → Epic 4

Run with `bun run test:e2e`. Config in `playwright.config.ts`.
