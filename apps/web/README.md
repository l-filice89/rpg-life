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

## Docker Compose Workflow

### Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose plugin (Linux)
- A configured root `.env` file (copy from `.env.example`)
- Run these Docker commands from the monorepo root (`rpg-life/`)

### Environment setup

```bash
cp .env.example .env
# Required updates:
# - BETTER_AUTH_SECRET (32+ characters)
# - RESEND_API_KEY
# - EMAIL_FROM
```

### Start services

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:3002`
- SQLite data: `./data/rpg-life.db` (persisted via `./data:/data`)

### Smoke verification

```bash
bash scripts/smoke-docker.sh
```

Manual checks:

```bash
curl http://localhost:3002/health
curl http://localhost:3000
curl http://localhost:3000/api/trpc/health
```

### Stop services

```bash
docker compose down     # stop containers, keep database in ./data
rm -f ./data/rpg-life.db  # optional: wipe persisted sqlite data
```

## Structure

```
src/
  app/
    layout.tsx              # Root layout (html, font, globals)
    page.tsx                # Redirect / → /quest-board
    (auth)/
      layout.tsx            # Auth gate layout (star motif)
      sign-in/page.tsx      # Magic link sign-in + post-send state
    (app)/
      layout.tsx            # AppProviders + AppShell; RSC fetches tutorial.getStatus
      quest-board/page.tsx  # Quest Board placeholder (Epic 2)
      profile/page.tsx      # My Profile placeholder (Epic 3)
  components/
    auth/sign-in-form.tsx   # Client island for Auth B flow
    sidebar/
      app-shell.tsx         # Shell layout + sidebar + tutorial state
      app-header.tsx        # Hamburger + page title
      sidebar-overlay.tsx   # Left Sheet nav overlay
    tutorial/
      tutorial-sheet.tsx    # Bottom Sheet first-run + replay explainer
      tutorial-content.ts   # Shared five-topic copy
    providers/app-providers.tsx  # tRPC + QueryClient (used in (app)/layout)
  lib/
    page-title.ts           # Route → header title helper
    trpc-server.ts          # RSC tRPC caller
    env.ts                  # Validated env
  middleware.ts             # Session gate → /sign-in (must be under src/ when using src/app)
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
- Full magic-link inbox flow → Epic 4

Run with `bun run test:e2e`. Config in `playwright.config.ts`.
