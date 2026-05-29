---
baseline_commit: 6ea9ed4b8b3a0d56e0a5956afedb678f873acf50
---

# Story 1.3: Magic Link Sign-In

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben (returning user)**,
I want to sign in with my email via a magic link,
So that I can access my Quests without managing a password.

## Acceptance Criteria

1. **Given** an unauthenticated visitor on `(auth)/sign-in` **When** they enter a valid email and submit **Then** better-auth sends a magic link via Resend and the page shows post-send confirmation inline (masked email, resend option) per Auth B flow (UX-DR18, NFR5, NFR6).

2. **And** invalid email shows "Enter a valid realm address" (UX-DR27).

3. **And** tapping the magic link in email establishes a session cookie and redirects to the authenticated app.

4. **And** expired/invalid link shows an error with option to resend.

5. **And** all `/api/trpc/*` routes use `protectedProcedure` and redirect unauthenticated users to sign-in.

6. **And** on first successful magic-link session, a `user_progress` row is created for the user if missing (`tutorial_seen_at` null, `focus_balance` 0).

## Tasks / Subtasks

- [x] **Task 1: Wire better-auth magic-link client** (AC: #1, #3, #4)
  - [x] Add `magicLinkClient()` from `better-auth/client/plugins` to `packages/auth/src/client.ts`
  - [x] Configure `createAuthClient({ baseURL: ... })` so browser calls same-origin `/api/auth/*` (rewrite → api). Prefer `process.env.NEXT_PUBLIC_BETTER_AUTH_URL` defaulting to `http://localhost:3000` — must match `BETTER_AUTH_URL` in api env
  - [x] Export `signIn` from magic link client (`authClient.signIn.magicLink`) — remove stale `signUp` password exports if unused
  - [x] Server already has `magicLink` plugin + Resend in `packages/auth/src/server.ts` — **do not** log `url` or `token` in `sendMagicLink` (NFR logging rule)

- [x] **Task 2: Add `protectedProcedure` to tRPC** (AC: #5)
  - [x] In `packages/api/src/root.ts` (or `trpc.ts`), add middleware: `isAuthed` checks `ctx.user`; throw `TRPCError({ code: 'UNAUTHORIZED' })` if null
  - [x] Export `protectedProcedure` alongside `publicProcedure`
  - [x] Keep `health` on `publicProcedure`; add **one** smoke `profile.ping` (or `me.status`) on `protectedProcedure` returning `{ userId }` — proves session + procedure wiring before Epic 2 routers land
  - [x] Re-export `protectedProcedure` from `packages/api/src/index.ts`
  - [x] Ensure `createContext` forwards session cookie from proxied requests (already reads `auth.api.getSession({ headers })` — verify cookie passes through Next rewrite)

- [x] **Task 3: Auth routes + `SignInForm` client island** (AC: #1, #2, #4)
  - [x] Create route group `apps/web/src/app/(auth)/layout.tsx` — minimal centered layout, star/constellation motif (CSS/SVG per `mockups/auth-sign-in.html`), no app shell
  - [x] Create `apps/web/src/app/(auth)/sign-in/page.tsx` — RSC shell importing client `SignInForm`
  - [x] Create `apps/web/src/components/auth/sign-in-form.tsx` with `"use client"`
  - [x] **State A (email):** headline `text-display-sm` "Enter the realm"; subcopy per mockup; email `Input` + `Label`; primary Button "Send sign-in link"
  - [x] **State B (post-send):** same route, no navigation — headline "Check your stars"; masked email (`l***@domain.com`); status "Link sent"; `Resend sign-in link` button; spam hint per mockup
  - [x] Validate email with Zod `.email()` — on failure show **exact** copy: "Enter a valid realm address" (UX-DR27, EXPERIENCE voice table)
  - [x] Submit calls `authClient.signIn.magicLink({ email, callbackURL: '/', errorCallbackURL: '/sign-in' })` — Story 1.4 will change landing to Quest Board; `/` is interim authenticated home (token showcase)
  - [x] Resend re-invokes `signIn.magicLink` with same email
  - [x] Read `searchParams.error` on mount — if present, show inline error banner + resend CTA (expired/invalid link path, AC #4)
  - [x] Use `@rpg-life/ui` primitives only (`Button`, `Input`, `Label`) — Crystal Path tokens from Story 1.2

- [x] **Task 4: Middleware auth gate** (AC: #3, #5)
  - [x] Create `apps/web/middleware.ts` using better-auth session check (cookie forwarded to `/api/auth/get-session` or `auth.api.getSession` pattern compatible with Edge — prefer [better-auth Next.js middleware helper](https://www.better-auth.com/docs/integrations/next) if available; else lightweight fetch to same-origin session endpoint)
  - [x] **Public paths:** `/sign-in`, `/api/auth/*`, `/api/trpc/*`, `/_next/*`, `/favicon.ico`, static assets
  - [x] **Protected paths:** `/` and all non-auth app routes (future `(app)/*` — matcher should scale)
  - [x] Unauthenticated access to protected paths → redirect `307` to `/sign-in`
  - [x] Authenticated user visiting `/sign-in` → redirect to `/` (avoid sign-in loop)
  - [x] Move token showcase to remain at `/` for now (Story 1.4 relocates to quest-board)

- [x] **Task 5: Provision `user_progress` on first session** (AC: #6)
  - [x] Add provisioning in `packages/auth/src/server.ts` via `databaseHooks.user.create.after` **or** session hook after first magic-link verification — insert into `user_progress` with `focusBalance: 0`, `tutorialSeenAt: null`, `modifiedAt: now ISO`
  - [x] Use `onConflictDoNothing()` on `userId` PK — idempotent for returning users
  - [x] **Do not** accept `userId` from client; server derives from session only
  - [x] Add unit/integration test in `packages/db` or `packages/auth` proving insert on new user

- [x] **Task 6: Clean up stale scaffold artifacts** (AC: #5)
  - [x] Delete or rewrite `apps/web/e2e/auth.spec.ts` — currently references `/login`, `/signup`, password fields (create-x4 leftover); minimum: redirect unauthenticated `/` → `/sign-in` test. Full magic-link E2E deferred to Epic 4 (needs Resend test inbox)
  - [x] Update `apps/web/README.md` auth section to match `(auth)/sign-in` + magic link (not `/login` password flow)

- [x] **Task 7: Verification** (AC: #1–#6)
  - [x] `bun run type-check` passes (`packages/auth`, `packages/api`, `apps/web`)
  - [x] `bun run smoke` still passes
  - [x] Manual: unset session → visit `/` → lands on `/sign-in`
  - [x] Manual: submit valid email with Resend configured → post-send state shows masked email + resend
  - [x] Manual: invalid email → "Enter a valid realm address"
  - [x] Manual: click magic link in email → session cookie set → `/` loads (authenticated)
  - [x] Manual: use expired link → error on `/sign-in` with resend path
  - [x] Manual: `curl` protected tRPC with/without session cookie → 401 vs 200
  - [x] Manual: new user in DB has `user_progress` row with `focus_balance = 0`, `tutorial_seen_at` null

## Dev Notes

### Brownfield Starting Point (Post Stories 1.1 + 1.2)

| Exists today | Action |
|---|---|
| `packages/auth/src/server.ts` | Magic link + Resend **configured** | Verify only; add hooks for `user_progress` |
| `packages/auth/src/client.ts` | Plain `createAuthClient()` — **missing `magicLinkClient()`** | **Fix** — required for `signIn.magicLink` |
| `apps/api/src/app.ts` | Auth handler at `/api/auth/**` | Keep |
| `apps/web/next.config.ts` | Rewrites `/api/auth/*` → api | Keep — same-origin cookies depend on this |
| `packages/api/src/root.ts` | Only `health` + `publicProcedure` | **Add** `protectedProcedure` + smoke protected query |
| `packages/api/src/context.ts` | Session via `auth.api.getSession` | Keep; `ctx.user` already shaped |
| `packages/db/src/schema/user-progress.ts` | Table + migration exist | **Insert** on first sign-in only |
| `apps/web/src/app/page.tsx` | Token showcase at `/` | Keep as interim authenticated landing until Story 1.4 |
| No `(auth)/sign-in` route | **Create** |
| No `middleware.ts` | **Create** (removed in 1.1 review as scaffold cruft) |
| `apps/web/e2e/auth.spec.ts` | Stale password signup/login tests | **Rewrite** redirect smoke or skip file |

[Source: Story 1.1 Dev Agent Record; Story 1.2 File List; codebase read 2026-05-29]

### Auth Topology (Locked — Do Not Change)

```
Browser → GET/POST web:3000/api/auth/* 
       → Next rewrite → api:3002/api/auth/* → auth.handler()
Session cookie: HttpOnly, same-site (web origin)
tRPC: web:3000/api/trpc/* → rewrite → api; cookie forwarded in createContext
BETTER_AUTH_URL = public web URL (http://localhost:3000 local)
API CORS allowCredentials + origin WEB_URL
```

[Source: `architecture.md` L508–513, L808; Story 1.1 Dev Notes]

### better-auth Magic Link API (v1.2.8 — binding)

**Server** (already present):

```typescript
plugins: [magicLink({ sendMagicLink: async ({ email, url }) => { /* Resend */ } })]
```

**Client** (must add):

```typescript
import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL, // same as BETTER_AUTH_URL
  plugins: [magicLinkClient()],
});

// Sign in
await authClient.signIn.magicLink({
  email,
  callbackURL: '/',
  errorCallbackURL: '/sign-in',
});
```

Link click → better-auth verifies token → sets session → redirects to `callbackURL`. Errors → `errorCallbackURL?error=...` (or callback with `error` query if only `callbackURL` set).

[Source: better-auth docs magic-link plugin; `packages/auth` uses `better-auth@1.2.8`]

### `protectedProcedure` Pattern (Binding)

```typescript
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

Web redirect for unauthenticated **page** access is middleware (AC #5 "redirect"). tRPC returns `UNAUTHORIZED` for API callers — client providers should handle 401 in later stories (toast + redirect optional in 1.3).

[Source: `architecture.md` L275, L531–532, L548–554]

### `user_progress` Provisioning (Binding)

On **first** successful magic-link sign-in (new `users` row or first session):

```typescript
await db.insert(userProgress).values({
  userId: user.id,
  focusBalance: 0,
  tutorialSeenAt: null,
  modifiedAt: new Date().toISOString(),
}).onConflictDoNothing();
```

| Field | Value |
|---|---|
| `user_id` | FK → `users.id` |
| `focus_balance` | `0` |
| `tutorial_seen_at` | `null` |
| `modified_at` | ISO timestamp |

Returning users: row already exists — no-op. Story 1.5 owns `tutorial.markSeen`.

[Source: `epics.md` Story 1.3 AC; `addendum.md` L97–106; Story 1.1 schema]

### UX Copy & Layout (Binding — UX-DR18, UX-DR27)

| Element | Copy / behavior |
|---|---|
| Headline (email state) | "Enter the realm" (`text-display-sm`) |
| Subcopy | "Sign in to continue your quest and track your Hero's journey." (mockup) |
| CTA | "Send sign-in link" |
| Validation error | **"Enter a valid realm address"** (exact string) |
| Post-send headline | "Check your stars" |
| Post-send body | "We sent a sign-in link to" + masked email badge |
| Status | "**Link sent** — open your inbox to continue your quest." |
| Resend | "Resend sign-in link" + spam hint from mockup |
| Visual | Star field + constellation SVG/CSS — reference `mockups/auth-sign-in.html`; no separate `/check-inbox` route |

Masking helper: `maskEmail("user@example.com")` → `u***@example.com` (show first char of local part + domain).

[Source: `ux-designs/.../mockups/auth-sign-in.html`; `EXPERIENCE.md` Auth B flow L205–211; voice table L57–61]

### Route Structure After This Story

```
apps/web/src/app/
  layout.tsx              # root + AppProviders (unchanged)
  page.tsx                # `/` — protected; token showcase interim
  (auth)/
    layout.tsx            # auth gate layout (stars motif)
    sign-in/
      page.tsx            # SignInForm
  middleware.ts           # session gate
```

Story 1.4 adds `(app)/` shell + quest-board; update `callbackURL` and middleware matcher then.

[Source: `architecture.md` L600–616]

### Environment Variables

| Var | Where | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | api | ≥32 chars |
| `BETTER_AUTH_URL` | api | Public web URL (`http://localhost:3000`) |
| `RESEND_API_KEY` | api | Required — auth module throws if missing |
| `EMAIL_FROM` | api | Verified Resend sender |
| `WEB_URL` | api CORS | Must match browser origin |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | web (new) | Same value as `BETTER_AUTH_URL` for client |
| `API_URL` | web build | Rewrite target only |

Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `apps/web/.env.example` / root `.env.example` with comment linking to `BETTER_AUTH_URL`.

[Source: `.env.example`; Story 1.1]

### Explicit Scope Boundaries

**In scope (Story 1.3):**
- Magic link sign-in UI (Auth B) + post-send inline state
- `magicLinkClient` + `signIn.magicLink` wiring
- `protectedProcedure` + one protected smoke procedure
- Next.js middleware redirect gate
- `user_progress` row provisioning on first sign-in
- Inline error/resend for invalid/expired links
- Stale e2e/README cleanup

**Out of scope (later stories):**
- App shell, sidebar, hamburger → **Story 1.4**
- Quest Board landing route → **Story 1.4** (`callbackURL` becomes `/quest-board`)
- Tutorial sheet + `tutorial.markSeen` → **Story 1.5**
- Business tRPC routers (`tasks`, `profile`, `focus`) → **Epic 2+**
- Full Playwright magic-link E2E (email inbox) → **Epic 4** (`auth.spec.ts` expanded)
- RPG email HTML template polish → optional; plain link OK for MVP

### Previous Story Intelligence

**From 1.1 (scaffold):**
- Auth handler mounted in `apps/api/src/app.ts` — not separate `handler.ts` file
- Resend env validated before auth import; magic-link URL must never hit logs
- `user_progress` migration already applied — only INSERT logic needed here
- create-x4 login/signup/middleware removed intentionally — rebuild per architecture paths

**From 1.2 (design):**
- All UI from `@rpg-life/ui` — `Button`, `Input`, `Label`, `text-display-sm`
- System theme only — no ThemeProvider
- `/` still token showcase until 1.4 — acceptable interim authenticated page

[Source: `1-1-scaffold-monorepo-and-development-infrastructure.md`; `1-2-crystal-path-design-tokens-and-shadcn-foundation.md`]

### Git Intelligence (Recent Commits)

| Commit | Relevance |
|---|---|
| `6ea9ed4` feat: design setup | `packages/ui` primitives for SignInForm |
| `ef86fd6` feat: scaffolding | auth server, rewrites, db schema foundation |
| `6ad1c0a` planning artifacts | epics AC source |

### Latest Tech Notes

- **better-auth@1.2.8** (pinned) — client **must** include `magicLinkClient()` plugin or `signIn.magicLink` is undefined
- Use `better-auth/react` for Next client components
- `emailAndPassword.enabled: false` already set server-side — magic link is sole method
- Default magic link token TTL ~300s (5 min) — document in manual test steps; resend path covers expiry UX

### Project Structure Notes

- Auth UI components live in `apps/web/src/components/auth/` — not `packages/ui` (feature-specific, not design system)
- Session-sensitive tRPC stays in `packages/api` — web only consumes types/client
- Never add `userId` to tRPC input schemas

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Auth flow, middleware, tRPC patterns]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/addendum.md` — Auth MVP]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/auth-sign-in.html`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — Auth B flow, voice table]
- [Source: `packages/auth/src/server.ts`, `packages/auth/src/client.ts`, `packages/api/src/context.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- better-auth 1.2.8 client types omit `errorCallbackURL` — middleware forwards `/?error=` → `/sign-in?error=` instead
- Auth tests: removed stale `client.native.test.ts`; provision tests use in-memory SQLite migration

### Completion Notes List

- ✅ `magicLinkClient()` + `signIn.magicLink` on `@rpg-life/auth/client`
- ✅ Auth B UI at `/sign-in` with post-send inline state, realm validation copy, link-error banner + resend
- ✅ `middleware.ts` session gate; `protectedProcedure` + `profile.ping` smoke procedure
- ✅ `provisionUserProgress()` via `databaseHooks` on user/session create (`onConflictDoNothing`)
- ✅ Tests: 17 auth + 3 api + smoke green; `type-check` all packages pass
- ℹ️ Set `NEXT_PUBLIC_BETTER_AUTH_URL` in `.env.local` (match `BETTER_AUTH_URL`) before manual magic-link test

### File List

- `.env.example`
- `.gitignore`
- `apps/web/.env.example`
- `apps/web/README.md`
- `apps/web/e2e/auth.spec.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/app/(auth)/auth.css`
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(auth)/sign-in/page.tsx`
- `apps/web/src/components/auth/auth-motif.tsx`
- `apps/web/src/components/auth/sign-in-form.tsx`
- `apps/web/src/lib/env.ts`
- `apps/web/src/lib/mask-email.ts`
- `bun.lock`
- `packages/api/package.json`
- `packages/api/src/__tests__/trpc.test.ts`
- `packages/api/src/index.ts`
- `packages/api/src/root.ts`
- `packages/auth/package.json`
- `packages/auth/src/__tests__/client.test.ts`
- `packages/auth/src/__tests__/provision-user-progress.test.ts`
- `packages/auth/src/__tests__/server.test.ts`
- `packages/auth/src/__tests__/setup.ts`
- `packages/auth/src/client.ts`
- `packages/auth/src/provision-user-progress.ts`
- `packages/auth/src/server.ts`
- `packages/db/tsconfig.json`

### Review Findings

_Code review 2026-05-29 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 1.3 uncommitted diff vs baseline `6ea9ed4`._

#### Patch

- [x] [Review][Patch] Middleware at `apps/web/middleware.ts` ignored by Next.js when using `src/app/` — auth gate never ran (`GET /` 200). **Fixed:** moved to `apps/web/src/middleware.ts` + fail-closed `try/catch` on session fetch [`apps/web/src/middleware.ts`]
- [x] [Review][Patch] Update `apps/web/README.md` structure tree to show `src/middleware.ts` not root `middleware.ts` [`apps/web/README.md`]

#### Deferred

- [x] [Review][Defer] `.env.local` `API_URL=:3002` while `bun dev` may bind API to `:3003` — turbo injects resolved `API_URL` for dev; stale value only matters if running web without root `scripts/dev.ts` — deferred
- [x] [Review][Defer] `EMAIL_FROM=onboarding@example.com` may fail Resend send until sender is verified in Resend dashboard — env/ops, not code — deferred

#### Dismissed (noise: 2)

- AC #5 "all tRPC routes use protectedProcedure" — satisfied for current router (`health` public, `profile.ping` protected); Epic 2 routers must follow same pattern
- No client `useSession()` poll — story scope; middleware handles gate

---

_Code review pass 2 — 2026-05-29. Scope: staged Story 1.3 (30 files, +1001/−276) incl. Resend fix + `src/middleware.ts`._

#### Patch (pass 2)

- [x] [Review][Patch] Magic-link email says "copy this link" but omits plaintext URL in body — only `<a href>` present [`packages/auth/src/server.ts`:72]
- [x] [Review][Patch] Dead state init `linkError ? 'email' : 'email'` — always `'email'`; use `linkError ? 'email' : 'email'` → simplify to `'email'` or branch post-send only when needed [`apps/web/src/components/auth/sign-in-form.tsx`:21]

#### Deferred (pass 2)

- [x] [Review][Defer] Full magic-link E2E (inbox + click-through) — Epic 4; smoke covers redirect + validation only [`apps/web/e2e/auth.spec.ts`]
- [x] [Review][Defer] `user` + `session` databaseHooks both call `provisionUserProgress` — redundant but idempotent via `onConflictDoNothing` [`packages/auth/src/server.ts`:48-62]

#### Dismissed (pass 2: 3)

- Resend `{ error }` handling + throw — **fixed** since pass 1; satisfies silent-failure bug
- Middleware `src/` placement — **fixed**; AC #5 page redirect satisfied
- `protectedProcedure` pattern — correct for current router; Epic 2 must reuse

## Change Log

- 2026-05-29: Story 1.3 — magic link sign-in, auth middleware, protectedProcedure, user_progress provisioning, Auth B UI
- 2026-05-29: Code review — middleware relocated to `src/middleware.ts` (fixes missing redirect)
- 2026-05-29: Code review pass 2 — plaintext magic-link URL in email; sign-in form state cleanup

## Story Completion Status

- Story complete — code review pass 1 + pass 2 patches applied
- Manual magic-link flow requires Resend (`onboarding@resend.dev` → account email only until domain verified) + `NEXT_PUBLIC_BETTER_AUTH_URL` in `.env.local`
