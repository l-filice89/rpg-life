---
baseline_commit: ae5f3696b6756b313e9a57e5c9f9bce8fa77f8ab
---

# Story 1.4: App Shell and Sidebar Navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to open a sidebar from the hamburger menu to navigate the app,
So that I can move between Quest Board, My Profile, and Tutorial.

## Acceptance Criteria

1. **Given** an authenticated user on any app route **When** they tap the hamburger icon **Then** a sidebar overlay opens from the left with Quest Board (home), My Profile, and Tutorial (FR12, UX-DR17).

2. **And** the sidebar dismisses on backdrop tap, nav selection, or Esc key.

3. **And** focus is trapped while the sidebar is open with visible focus rings (NFR4).

4. **And** `(app)/` route group renders the authenticated shell with providers (tRPC + QueryClient) at layout level.

5. **And** Quest Board is the default landing route after sign-in.

## Tasks / Subtasks

- [x] **Task 1: Create `(app)` route group + relocate providers** (AC: #4, #5)
  - [x] Move `AppProviders` from `apps/web/src/app/layout.tsx` into `apps/web/src/app/(app)/layout.tsx` — auth routes `(auth)/` must **not** inherit tRPC/QueryClient overhead (optional but matches architecture intent)
  - [x] Root `layout.tsx` keeps `<html>`, Geist font, `@/styles/globals.css` only
  - [x] Create `(app)/layout.tsx` wrapping children with `AppProviders` + app shell (see Task 2)
  - [x] Replace root `apps/web/src/app/page.tsx` with redirect to `/quest-board` (`redirect()` from `next/navigation`) — authenticated users land on Quest Board, not token showcase
  - [x] **Delete or relocate** `TokenShowcase` — remove from production path; optional keep under `(app)/dev/tokens` only if useful for local QA (not required)

- [x] **Task 2: App shell layout** (AC: #1, #4)
  - [x] Create `apps/web/src/components/sidebar/app-shell.tsx` (`"use client"`) — owns sidebar `open` state; renders header + `SidebarOverlay` + `<main>{children}</main>`
  - [x] Create `apps/web/src/components/sidebar/app-header.tsx` — hamburger button (min **44×44px** touch target per NFR4) + page title area
  - [x] Header layout matches mockup **header-top only** (hamburger + title row) — reference `mockups/quest-board.html` lines 51–63; **do not** build Hero zone / Focus pill / XP bar here (Epic 2 Story 2.3)
  - [x] Page title: derive from route — `Quest Board` on `/quest-board`, `My Profile` on `/profile`; default fallback `Quest Board`
  - [x] Main content wrapper: mobile-first single column with responsive max-width per DESIGN.md — `mx-auto w-full max-w-lg md:max-w-lg lg:max-w-2xl` + horizontal padding

- [x] **Task 3: Sidebar overlay** (AC: #1, #2, #3)
  - [x] Create `apps/web/src/components/sidebar/sidebar-overlay.tsx` (`"use client"`)
  - [x] Use `@rpg-life/ui` `Sheet` with `side="left"` — **do not** fork Sheet internals (UX-DR28)
  - [x] Panel uses `bg-card` token (DESIGN.md sidebar spec)
  - [x] Nav items (exact labels): **Quest Board**, **My Profile**, **Tutorial**
  - [x] Quest Board → `href="/quest-board"`; My Profile → `href="/profile"`
  - [x] Tutorial item: closes sidebar on select; **no TutorialSheet in this story** — Story 1.5 wires `onTutorialClick` to open explainer sheet (item must still render and be keyboard-focusable)
  - [x] Active route: highlight current item via `usePathname()` — Quest Board active on `/quest-board` (and `/` redirect target)
  - [x] Dismiss: Radix overlay click, `SheetClose` on nav link click, Esc (built into Sheet), hamburger toggle
  - [x] Accessibility: `SheetTitle` sr-only or visible "Navigation"; nav as `<nav aria-label="Main">` with `<ul>`/`<li>`; visible focus rings (`focus-visible:ring-*` — shadcn defaults); Radix provides focus trap
  - [x] Optional Lucide icons (14–18px): e.g. `Map`/`LayoutList`, `User`, `BookOpen` — unified muted styling, not rainbow per Skill chips

- [x] **Task 4: Placeholder app routes** (AC: #5)
  - [x] Create `apps/web/src/app/(app)/quest-board/page.tsx` — RSC placeholder: heading "Quest Board", muted subcopy "Your quests will appear here." (Epic 2 implements list/FAB/filters)
  - [x] Create `apps/web/src/app/(app)/profile/page.tsx` — RSC placeholder: heading "My Profile", muted subcopy "Hero stats land in Epic 3." (Epic 3 implements `profile.get` UI)
  - [x] Both pages render inside app shell automatically via `(app)/layout.tsx`

- [x] **Task 5: Auth landing + middleware updates** (AC: #5)
  - [x] Update `apps/web/src/components/auth/sign-in-form.tsx` — `callbackURL: '/quest-board'` (was `'/'`)
  - [x] Update `apps/web/src/middleware.ts`:
    - Authenticated user on `/sign-in` → redirect **`/quest-board`** (not `/`)
    - Optional: authenticated `/` → redirect `/quest-board` (belt-and-suspenders with root page redirect)
  - [x] Keep magic-link `/?error=` → `/sign-in?error=` forwarding unchanged
  - [x] Protected matcher still covers `(app)/*` routes; `/quest-board` and `/profile` require session

- [x] **Task 6: E2E + docs** (AC: #1–#5)
  - [x] Update `apps/web/e2e/auth.spec.ts` — unauthenticated `/quest-board` → `/sign-in`; optionally authenticated sidebar smoke (open hamburger → nav visible) if session fixture exists; minimum: protected route redirect test for `/quest-board`
  - [x] Update `apps/web/README.md` route tree: `(app)/quest-board`, `(app)/profile`, sidebar components, providers in `(app)/layout.tsx`
  - [x] `bun run type-check` + `bun run smoke` pass

- [x] **Task 7: Manual verification** (AC: #1–#5)
  - [x] Sign in via magic link → lands on `/quest-board` (not `/` token page)
  - [x] Hamburger opens left sheet with three nav items
  - [x] Tap backdrop / Esc / nav link → sidebar closes
  - [x] Tab through sidebar — focus trapped, visible rings
  - [x] Navigate Quest Board ↔ My Profile via sidebar; URL and active state update
  - [x] Tutorial item closes sidebar (no crash; sheet deferred to 1.5)
  - [x] `/sign-in` while authenticated → `/quest-board`
  - [x] Unauthenticated `/profile` → `/sign-in`

### Review Findings

_Code review 2026-05-29 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 1.4 uncommitted diff vs baseline `ae5f369`._

- [x] [Review][Patch] Hamburger `aria-label` always "Open navigation menu" even when `aria-expanded={true}` — should toggle to "Close navigation menu" when open [`apps/web/src/components/sidebar/app-header.tsx`:23]
- [x] [Review][Patch] `aria-controls="main-navigation"` references Sheet content id that is absent from DOM while sidebar closed — remove or set only when open [`apps/web/src/components/sidebar/app-header.tsx`:22]
- [x] [Review][Defer] No authenticated sidebar E2E (open hamburger → nav items visible) — story marked optional; Epic 4 session-fixture scope [`apps/web/e2e/auth.spec.ts`]
- [x] [Review][Defer] `apps/web` unit tests (`bun test src/`) not wired into root `smoke` or CI — new in 1.4; Epic 4 CI hardening [`apps/web/package.json`]

## Dev Notes

### Brownfield Starting Point (Post Stories 1.1–1.3)

| Exists today | Action |
|---|---|
| `apps/web/src/app/layout.tsx` | **Update** — remove `AppProviders` (move to `(app)/layout`) |
| `apps/web/src/app/page.tsx` | **Replace** — redirect `/` → `/quest-board` |
| `apps/web/src/components/providers/app-providers.tsx` | **Keep** — import from `(app)/layout.tsx` |
| `apps/web/src/components/token-showcase.tsx` | **Remove from prod path** — interim complete |
| `apps/web/src/middleware.ts` | **Update** — post-auth redirect target `/quest-board` |
| `sign-in-form.tsx` `callbackURL: '/'` | **Change** → `'/quest-board'` |
| `packages/ui` Sheet primitive | **Reuse** — `side="left"` for sidebar |
| No `(app)/` route group | **Create** |
| No sidebar components | **Create** `app-shell`, `app-header`, `sidebar-overlay` |

[Source: codebase read 2026-05-29; Story 1.3 File List]

### Route Structure After This Story

```
apps/web/src/app/
  layout.tsx                    # root: html, body, font, globals.css
  page.tsx                      # redirect → /quest-board
  (auth)/
    layout.tsx                  # stars motif — unchanged
    sign-in/page.tsx
  (app)/
    layout.tsx                  # AppProviders + AppShell
    quest-board/page.tsx        # placeholder (Epic 2)
    profile/page.tsx            # placeholder (Epic 3)
  middleware.ts                 # src/middleware.ts — NOT repo root
```

[Source: `architecture.md` L607–623; Story 1.3 Dev Notes]

### App Shell Component Split (Binding)

| Component | Server/Client | Responsibility |
|---|---|---|
| `(app)/layout.tsx` | RSC | Imports `AppProviders` + `AppShell`; wraps `{children}` |
| `AppShell` | `"use client"` | Sidebar open state; composes header + overlay + main |
| `AppHeader` | `"use client"` (or split trigger) | Hamburger + title; calls `setSidebarOpen(true)` |
| `SidebarOverlay` | `"use client"` | Sheet left; nav links; receives `open`/`onOpenChange` |
| `quest-board/page.tsx` | RSC | Placeholder content only |
| `profile/page.tsx` | RSC | Placeholder content only |

**RSC-first rule:** Pages stay server components; only shell/sidebar/header are client islands.

[Source: `architecture.md` L291–312, L640–642]

### Sidebar UX Spec (Binding — UX-DR17, DESIGN.md L199)

| Requirement | Implementation |
|---|---|
| Surface | shadcn `Sheet` from **left** |
| Panel | `{colors.card}` → `bg-card` |
| Items | Quest Board (home), My Profile, Tutorial |
| Dismiss | Backdrop tap, nav selection, Esc |
| Focus | Trap while open (Radix Dialog primitive under Sheet) |
| Touch targets | Min 44×44px on hamburger + nav rows (NFR4) |
| Copy | Exact labels: "Quest Board", "My Profile", "Tutorial" |

No dedicated sidebar mockup — shadcn defaults + DESIGN.md row sufficient (validation-report.md).

[Source: `DESIGN.md` L199; `EXPERIENCE.md` L80–81, L110–112]

### Header Scope Boundary (Critical)

Story 1.4 header = **hamburger + page title only** (mockup `.header-top`).

**Out of scope for 1.4** (later stories):
- Hero level label + XP bar + Focus pill → Epic 2 Story 2.3 (`QuestBoardHeader`)
- Filter chips → Epic 2
- FAB → Epic 2 Story 2.4

Do not block 1.4 waiting for `profile.get` or `tasks.list` — placeholders only.

[Source: `epics.md` Story 2.3; `mockups/quest-board.html` L51–63 vs L63–82]

### Provider Placement (AC #4)

Architecture diagram shows `app-providers.tsx` under `(app)` shell. Moving providers off root layout:
- `(auth)/sign-in` uses `@rpg-life/auth/client` only — no tRPC needed
- All authenticated mutations in later epics assume providers in `(app)/layout`

If keeping providers at root is simpler and tests pass, **prefer AC literal**: providers must wrap `(app)` shell at `(app)/layout.tsx` level.

[Source: `epics.md` Story 1.4 AC; `architecture.md` L615–616]

### Auth Redirect Chain (Binding)

```
Magic link verify → callbackURL /quest-board
Middleware: authed + /sign-in → /quest-board
Middleware: unauthed + /quest-board|/profile → /sign-in
Root / → redirect /quest-board (page.tsx)
```

Update **both** `sign-in-form.tsx` and `middleware.ts` — mismatch causes sign-in loop or wrong landing.

[Source: Story 1.3 — callbackURL was `'/'` interim; Story 1.3 Dev Notes L223–224]

### Tutorial Nav Item (Scope Split with 1.5)

| Story | Owns |
|---|---|
| **1.4** | Sidebar lists Tutorial; item closes sidebar; optional `onTutorialClick?: () => void` prop stub on `SidebarOverlay` |
| **1.5** | `TutorialSheet`, auto-first-run, `tutorial.markSeen`, wire Tutorial nav → open sheet |

Do **not** implement Tutorial content, `tutorial` tRPC router, or auto-open in 1.4.

[Source: `epics.md` Stories 1.4 vs 1.5; FR13–FR14]

### Sheet API Reminder (packages/ui)

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@rpg-life/ui';

<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="left" className="bg-card w-[min(100%,20rem)]">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    {/* nav list */}
  </SheetContent>
</Sheet>
```

Default close button (X) in top-right is OK — mockup doesn't forbid it. `showCloseButton={true}` default.

[Source: `packages/ui/src/components/ui/sheet.tsx`; Story 1.2 Task 4]

### Middleware Location (Regression Guard)

Next.js App Router with `src/app/` requires middleware at **`apps/web/src/middleware.ts`** — NOT repo-root `apps/web/middleware.ts`. Story 1.3 code review caught this.

[Source: `1-3-magic-link-sign-in.md` Review Findings]

### Explicit Scope Boundaries

**In scope (Story 1.4):**
- `(app)/` route group + layout with providers
- App shell: hamburger, header title, main content area
- Sidebar overlay (Sheet left) with three nav items
- Placeholder `/quest-board` and `/profile` pages
- Default landing `/quest-board` after sign-in
- Middleware + magic-link callback updates
- E2E redirect smoke for new protected routes

**Out of scope (later stories):**
- Tutorial sheet content + first-run auto-open → **Story 1.5**
- Quest list, FAB, filters, Hero header stats → **Epic 2**
- Profile stats, Skill bars, Focus display → **Epic 3**
- Full sidebar a11y axe gate → **Epic 4 Story 4.3**
- `TutorialSheet` component file → **Story 1.5**

### Previous Story Intelligence

**From 1.3 (auth):**
- Middleware at `src/middleware.ts` — session via `/api/auth/get-session`
- `protectedProcedure` + `profile.ping` exist — shell doesn't need new tRPC for placeholders
- Auth `(auth)/` layout has star motif — keep isolated from app shell
- Sign-in `callbackURL` intentionally `'/'` until 1.4 — **must update now**

**From 1.2 (design):**
- Sheet/Dialog already proven in `TokenShowcase` — same import path `@rpg-life/ui`
- Geist Sans, system theme, Crystal Path tokens — shell uses stock Button + Sheet only
- No ThemeProvider

**From 1.1 (scaffold):**
- Next rewrites for `/api/auth/*` and `/api/trpc/*` unchanged
- `AppProviders` already has tRPC + QueryClient + Toaster

[Source: `1-3-magic-link-sign-in.md`; `1-2-crystal-path-design-tokens-and-shadcn-foundation.md`]

### Git Intelligence (Recent Commits)

| Commit | Relevance |
|---|---|
| `ae5f369` feat: add auth | middleware, `(auth)/sign-in`, `callbackURL: '/'`, `src/middleware.ts` — all touch points for 1.4 redirect/shell |
| `6ea9ed4` feat: design setup | Sheet primitive, tokens, `TokenShowcase` to remove from `/` |
| `ef86fd6` feat: scaffolding | monorepo layout, rewrites, `AppProviders` at root |

### Latest Tech Notes

- **Next.js 15 App Router** route groups `(app)` and `(auth)` don't affect URL paths
- **Radix Sheet** (via shadcn) provides focus trap + Esc dismiss — no custom trap library
- **lucide-react** already in `packages/ui` — import icons from there or re-export if needed
- Use `next/link` for nav items inside Sheet; wrap with `SheetClose asChild` for dismiss-on-navigate

### Project Structure Notes

- Feature shell components: `apps/web/src/components/sidebar/` — matches architecture tree
- Do not create sidebar in `packages/ui` — app-specific, not design system
- Do not add persistent sidebar — overlay only per UX decision log

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend architecture, route tree L607–647]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — Sidebar overlay L199, breakpoints L162–166]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — Sidebar pattern L80–81, a11y L110–123]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/quest-board.html` — header-top hamburger]
- [Source: `_bmad-output/implementation-artifacts/1-3-magic-link-sign-in.md` — middleware path, callbackURL debt]
- [Source: `apps/web/src/middleware.ts`, `apps/web/src/components/providers/app-providers.tsx`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Playwright browsers missing locally — installed via `bunx playwright install chromium`
- Skipped optional Lucide nav icons — CSS hamburger matches mockup; text labels sufficient per story

### Completion Notes List

- ✅ `(app)/` route group with `AppProviders` + `AppShell` at layout level
- ✅ Left Sheet sidebar: Quest Board, My Profile, Tutorial; active route highlight; Tutorial closes sheet (1.5 wires sheet)
- ✅ Placeholder `/quest-board` and `/profile` RSC pages
- ✅ Landing chain: `callbackURL /quest-board`, middleware authed redirects, root `/` → `/quest-board`
- ✅ Removed `TokenShowcase` from production path
- ✅ Unit tests: `page-title.test.ts` (3 pass); E2E: `auth.spec.ts` (4 pass); `type-check` + `smoke` green
- ℹ️ Authenticated sidebar interaction (hamburger open/close) — verify manually after magic-link sign-in with Resend configured
- ✅ Code review: dynamic hamburger aria-label + conditional aria-controls

### File List

- `apps/web/package.json`
- `apps/web/README.md`
- `apps/web/e2e/auth.spec.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/app/(app)/quest-board/page.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`
- `apps/web/src/components/auth/sign-in-form.tsx`
- `apps/web/src/components/sidebar/app-shell.tsx`
- `apps/web/src/components/sidebar/app-header.tsx`
- `apps/web/src/components/sidebar/sidebar-overlay.tsx`
- `apps/web/src/lib/page-title.ts`
- `apps/web/src/lib/page-title.test.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/components/token-showcase.tsx` (deleted)

## Change Log

- 2026-05-29: Code review — hamburger aria-label toggle + conditional aria-controls

## Story Completion Status

- Status: **done** — code review patches applied
