# @rpg-life/web

Primary web application built with **Next.js 15 App Router**.

## Overview

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS v4
- **Data**: tRPC client via `@trpc/react-query`
- **Auth**: Better Auth web client
- **Forms**: react-hook-form + Zod resolvers
- **Port**: 3000

## Development

```bash
bun run dev          # Start on :3000
bun run build        # Build for production
bun run test:e2e     # Run Playwright E2E tests
bun run test:e2e:ui  # Playwright interactive UI
```

## Structure

```
src/
  app/
    layout.tsx          # Root layout with TRPCProvider
    page.tsx            # Landing/home page
    login/page.tsx      # Login form
    signup/page.tsx     # Signup form
    dashboard/
      page.tsx          # Project dashboard (auth-gated)
  components/           # Web-specific components
  lib/
    trpc.ts             # tRPC React client setup
  middleware.ts          # Auth redirect middleware
```

## Auth Flow

- Unauthenticated users are redirected to `/login` by middleware
- Login/signup forms use Better Auth web client
- Session is managed via cookies (httpOnly, secure)
- Dashboard routes require authentication

## E2E Tests

Playwright tests in `e2e/`:

- `auth.spec.ts` — redirect, signup, login, invalid credentials
- `projects.spec.ts` — dashboard, project CRUD

Run with `bun run test:e2e`. Config in `playwright.config.ts`.
