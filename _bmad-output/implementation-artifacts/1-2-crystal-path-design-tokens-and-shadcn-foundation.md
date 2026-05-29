---
baseline_commit: ef86fd6b7da38aad12f307d2f75521f503deb652
---

# Story 1.2: Crystal Path Design Tokens and shadcn Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want the app to reflect the Crystal Path visual identity in light and dark mode,
So that rpg-life feels fresh, lightweight, and epic from the first screen.

## Acceptance Criteria

1. **Given** shadcn/ui + Tailwind v4 in `packages/ui` **When** design tokens from DESIGN.md are applied **Then** Crystal Path color tokens (primary teal, accent violet, focus-pill, xp-track, skill-chip, overdue-border) are available in light and dark variants (UX-DR1).

2. **And** typography tokens `display`, `display-sm`, and `hero-level` are configured (UX-DR2).

3. **And** spacing and radius tokens match DESIGN.md (UX-DR3).

4. **And** theme follows `prefers-color-scheme` with no forced default (UX-DR29).

5. **And** standard shadcn primitives (Dialog, Sheet, Toast, etc.) are installed without custom rebuilds (UX-DR28).

## Tasks / Subtasks

- [x] **Task 1: Establish `packages/ui` as the shadcn home** (AC: #1, #5)
  - [x] Add `packages/ui/components.json` per [shadcn monorepo docs](https://ui.shadcn.com/docs/monorepo) — `style: new-york`, `rsc: true`, `tailwind.config: ""`, CSS path → `src/styles/globals.css`
  - [x] Add runtime deps to `packages/ui`: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*` (as added by CLI), `lucide-react`
  - [x] Create `packages/ui/src/lib/utils.ts` with `cn()` helper
  - [x] Configure `packages/ui/package.json#exports` for `./globals.css`, `./lib/utils`, `./components/*`, and barrel `./index.ts`
  - [x] Add `@rpg-life/ui` workspace dep to `apps/web/package.json`
  - [x] Update `apps/web/tsconfig.json` paths if needed so web can import `@rpg-life/ui/*`
  - [x] **Migrate** `apps/web/components.json` aliases to point at `@rpg-life/ui` (CLI target = shared package, not `apps/web/src/components/ui`)

- [x] **Task 2: Apply Crystal Path CSS variables + Tailwind v4 theme** (AC: #1, #2, #3, #4)
  - [x] Create `packages/ui/src/styles/globals.css` as the **single source of truth** for theme tokens
  - [x] Map DESIGN.md frontmatter hex values → CSS custom properties on `:root` (light) and `@media (prefers-color-scheme: dark)` (dark) — **not** a manual `.dark` class toggle
  - [x] Override shadcn semantic tokens: `--background`, `--foreground`, `--primary`, `--accent`, `--muted`, `--border`, `--card`, `--destructive`, etc.
  - [x] Add brand extension tokens as CSS vars + `@theme inline` entries:
    - `--focus-pill-bg`, `--focus-pill-fg`
    - `--xp-track`, `--xp-fill-start`, `--xp-fill-end`
    - `--skill-chip-bg`, `--skill-chip-fg`
    - `--overdue-border`
    - `--background-dark`, `--foreground-dark` (for future Hero level-up overlay)
  - [x] Configure radius tokens: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-full: 9999px` (DESIGN.md `rounded` block)
  - [x] Configure spacing scale in `@theme`: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px` (DESIGN.md `spacing` block)
  - [x] Add typography utilities: `text-display` (28px/600/-0.02em), `text-display-sm` (20px/600), `text-hero-level` (13px/600/0.04em + uppercase)
  - [x] Load **Geist Sans** in `apps/web/src/app/layout.tsx` via `next/font/google` (or Geist package if already in scaffold) — body default per UX-DR2
  - [x] Replace `apps/web/src/styles/globals.css` content with `@import '@rpg-life/ui/globals.css'` (+ any web-only `@source` if required for app-level classes)
  - [x] Add `@source` directive so Tailwind v4 scans `packages/ui/src/**/*.{ts,tsx}` from the consuming CSS entrypoint

- [x] **Task 3: Wire system color-scheme (no in-app toggle)** (AC: #4)
  - [x] Set `<html>` to respect system theme only — e.g. `color-scheme: light dark` in base styles; **do not** add theme provider / toggle
  - [x] Use `@custom-variant dark (@media (prefers-color-scheme: dark))` (or equivalent) so `dark:` utilities track OS preference
  - [x] Remove/replace existing `.dark { ... }` class-block pattern in web globals if it forces manual dark mode
  - [x] Verify neither light nor dark is hard-coded as the only mode (NFR8)

- [x] **Task 4: Install shadcn primitives via CLI into `packages/ui`** (AC: #5)
  - [x] Run CLI from `packages/ui` workspace: `bunx --bun shadcn@latest add button checkbox dialog sheet sonner skeleton badge input label separator`
  - [x] Components land in `packages/ui/src/components/ui/` — **do not** fork/rebuild Dialog/Sheet/Toast internals (UX-DR28)
  - [x] Export installed primitives from `packages/ui/src/index.ts`
  - [x] Add `<Toaster />` (Sonner) to `apps/web/src/components/providers/app-providers.tsx` or a thin `UiProviders` wrapper — required for Toast primitive to function in later stories
  - [x] **Do not** install brand-layer components (XpBar, FocusPill, SkillChip, QuestRow, FAB) — those are UX-DR4–8, deferred to Epic 2/3 feature stories

- [x] **Task 5: Token verification surface** (AC: #1–#4)
  - [x] Update `apps/web/src/app/page.tsx` (temporary dev showcase until Story 1.4 shell) to render a **Token Showcase** section proving:
    - Primary teal button + accent violet badge
    - Swatches for focus-pill, xp-track gradient, skill-chip, overdue-border tokens
    - `text-display`, `text-display-sm`, `text-hero-level` samples
    - One openable Dialog and one Sheet using stock shadcn (smoke that primitives work)
  - [x] Page copy can note "foundation only — Quest Board lands in Epic 2"

- [x] **Task 6: Verification** (AC: #1–#5)
  - [x] `bun run type-check` passes for `packages/ui` + `apps/web`
  - [x] `bun run smoke` still passes (no api/db regressions)
  - [x] Manual: toggle OS light/dark → showcase reflects Crystal Path palette without reload hacks
  - [x] Manual: Dialog + Sheet open/close with focus trap (Radix default behavior)
  - [x] Confirm no duplicate shadcn copies under `apps/web/src/components/ui/`

## Dev Notes

### Brownfield Starting Point (Post Story 1.1)

| Exists today | Action |
|---|---|
| `packages/ui/` empty stub (`export {}`) | **Implement** — shadcn home + theme |
| `apps/web/src/styles/globals.css` | Default neutral oklch shadcn tokens | **Replace** — import shared Crystal Path theme |
| `apps/web/components.json` | Points to `@/components/ui` locally | **Retarget** to `@rpg-life/ui` |
| `apps/web/package.json` | No `@rpg-life/ui` dep | **Add** workspace dependency |
| `tooling/tailwind/` in architecture tree | **Not created in 1.1** | **Skip for now** — colocate theme in `packages/ui/src/styles/globals.css` per architecture L1010 alternative |
| Geist font | Not loaded in layout | **Add** in web layout |

[Source: Story 1.1 Dev Agent Record; `architecture.md` L1008–1013]

### Crystal Path Token Map (Binding — from DESIGN.md frontmatter)

**Light (`:root`):**

| Token | Hex |
|---|---|
| background | `#F6FAFB` |
| foreground | `#1A2830` |
| primary | `#0B7A70` |
| primary-foreground | `#FFFFFF` |
| accent | `#7C3AED` |
| accent-foreground | `#FFFFFF` |
| muted / muted-foreground | `#64748B` |
| border | `#D1E3E8` |
| card / card-foreground | `#FFFFFF` / `#1A2830` |
| destructive | `#BE4B4B` |
| focus-pill-bg / fg | `#E6F7F5` / `#0B7A70` |
| xp-track | `#D1E3E8` |
| xp-fill-start / end | `#0B7A70` / `#7C3AED` |
| skill-chip-bg / fg | `#F0F4F6` / `#64748B` |
| overdue-border | `#94A8B0` |

**Dark (`prefers-color-scheme: dark`):**

| Token | Hex |
|---|---|
| background | `#0F1720` |
| foreground | `#E2F0F5` |
| primary | `#2DD4BF` |
| primary-foreground | `#0F1720` |
| accent | `#A78BFA` |
| accent-foreground | `#0F1720` |
| muted / muted-foreground | `#7A8F9A` |
| border | `#1E3440` |
| card / card-foreground | `#162028` / `#E2F0F5` |
| destructive | `#E57373` |
| focus-pill-bg / fg | `#152830` / `#2DD4BF` |
| xp-track | `#1E3440` |
| xp-fill-start / end | `#2DD4BF` / `#A78BFA` |
| skill-chip-bg / fg | `#1C2830` / `#7A8F9A` |
| overdue-border | `#4A6270` |

Store brand extensions as Tailwind colors e.g. `bg-focus-pill-bg`, `text-focus-pill-fg`, `border-overdue-border`, `from-xp-fill-start`, `to-xp-fill-end`.

[Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` frontmatter]

### Typography + Spacing + Radius (UX-DR2, UX-DR3)

```css
/* Illustrative — implement via @theme inline + @utility */
.text-display       { font-size: 28px; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; }
.text-display-sm    { font-size: 20px; font-weight: 600; line-height: 1.25; }
.text-hero-level    { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
```

Radius: sm `8px`, md `12px`, lg `16px`, full `9999px`.  
Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40` px.

[Source: DESIGN.md `typography`, `rounded`, `spacing` blocks]

### Monorepo shadcn + Tailwind v4 Pattern

Architecture target:

```
packages/ui/
  components.json
  package.json          # exports for css, components, utils
  src/
    lib/utils.ts
    styles/globals.css  # Crystal Path tokens + @theme
    components/ui/      # shadcn CLI output
    index.ts            # re-exports
apps/web/
  components.json       # CLI aliases → @rpg-life/ui
  src/styles/globals.css → @import '@rpg-life/ui/globals.css'
  src/app/layout.tsx    # Geist + providers
```

**Critical Tailwind v4 monorepo rule:** Without `@source`, classes used only in `packages/ui` will be purged. Add to CSS entry:

```css
@import 'tailwindcss';
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

Adjust relative path from whichever file is the Tailwind entry (prefer keeping `@source` in `packages/ui/src/styles/globals.css` with `@source "./../**/*.{ts,tsx}"`).

[Source: `architecture.md` L724–738, L1008–1013; shadcn monorepo docs]

### Expected `components.json` Shape (packages/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Use `@/` paths **inside packages/ui** (map to `packages/ui/src/*` in that package's tsconfig).  
`apps/web/components.json` should mirror `style`, `iconLibrary`, `baseColor`, but point `ui`/`utils` aliases at `@rpg-life/ui/...`.

[Source: shadcn monorepo + components.json docs]

### shadcn Primitives to Install (UX-DR28)

| Component | Used by (soon) |
|---|---|
| `button` | Auth (1.3), sheets, CTAs |
| `input`, `label` | Auth sign-in (1.3), quest forms (Epic 2) |
| `checkbox` | Quest row complete (Epic 3) |
| `dialog` | Confirm complete, Focus spend (Epic 3) |
| `sheet` | Sidebar (1.4), Tutorial (1.5), Quest create/edit (Epic 2) |
| `sonner` (toast) | Mutation feedback (Epic 2+) |
| `skeleton` | Loading states (Epic 2) |
| `badge` | Difficulty chip (Epic 2) |
| `separator` | Layout dividers |

Install now; **do not** customize Dialog/Sheet/Toast source beyond theme tokens.

[Source: epics UX-DR28; DESIGN.md Components section]

### Explicit Scope Boundaries

**In scope (Story 1.2):**
- `packages/ui` shadcn foundation + Crystal Path theme tokens
- System `prefers-color-scheme` theming (NFR8, UX-DR29)
- shadcn primitive installation + export
- Geist Sans wiring
- Temporary token showcase on home page
- Toaster provider wiring

**Out of scope (later stories):**
- Brand-layer **XpBar**, **FocusPill**, **SkillChip**, **QuestRow**, **FAB** → UX-DR4–8 (Epic 2/3)
- `skill-icons.ts` map → needed for SkillChip (Epic 2); optional stub OK but not required by AC
- Auth sign-in page UI → **Story 1.3**
- App shell, sidebar overlay, route groups → **Story 1.4**
- Tutorial sheet content → **Story 1.5**
- Quest Board layout/mockup fidelity → **Epic 2**
- Playwright visual regression → **Epic 4**
- In-app theme toggle → post-MVP (NFR8 forbids in MVP)

### Anti-Patterns (Do Not)

- ❌ Leave shadcn components in `apps/web/src/components/ui/` — shared package only
- ❌ Custom-rebuild Dialog/Sheet/Toast from scratch (UX-DR28)
- ❌ Force dark or light via React theme toggle / `.dark` class only
- ❌ Use alarm red for overdue styling — `overdue-border` is muted gray-teal
- ❌ Per-skill rainbow chip colors — unified `skill-chip-*` tokens only
- ❌ Implement Quest Board / auth flows in this story
- ❌ Add tRPC or DB changes — UI-only story
- ❌ Use `drizzle-kit push` or alter migrations — unrelated

[Source: DESIGN.md Do's and Don'ts; architecture.md Anti-patterns]

### Cross-Story Handoff

| Downstream | Depends on 1.2 delivering |
|---|---|
| **1.3 Magic Link Sign-In** | `Button`, `Input`, `Label`, Crystal Path card/background tokens, `text-display-sm` for headline |
| **1.4 App Shell + Sidebar** | `Sheet` primitive themed; spacing/radius tokens |
| **1.5 Tutorial** | `Sheet` from bottom; typography tokens |
| **Epic 2 Quest Board** | All primitives + brand token CSS vars ready for XpBar/SkillChip/QuestRow composition |
| **Epic 3 Modals** | `Dialog`, toast patterns, xp/focus token vars |

### Testing Requirements (Story 1.2)

No new domain tests. Verification stack:

| Check | Expectation |
|---|---|
| `bun run type-check` | `packages/ui` + `apps/web` clean |
| `bun run smoke` | Existing 5 tests still pass |
| Manual OS theme | Light/dark swap updates CSS vars |
| Manual primitives | Dialog + Sheet open/close |
| Lint | No new eslint boundary violations importing ui across packages |

Playwright E2E pass gate remains **Epic 4** (NFR10).

[Source: Story 1.1 testing pattern; epics NFR9–NFR11]

### Previous Story Intelligence (1.1)

Key learnings that affect 1.2:

- **Package naming:** `@rpg-life/ui` workspace package; api server is `@rpg-life/server` — don't collide names
- **Bun everywhere:** use `bunx --bun shadcn@latest` on Windows
- **Review lesson:** keep scope tight — Story 1.1 review removed out-of-scope create-x4 UI routes; 1.2 should not re-introduce dashboard/auth shells beyond token showcase
- **Providers location:** `apps/web/src/components/providers/app-providers.tsx` is the correct place to add `<Toaster />`
- **Tailwind already in web:** `tailwindcss@^4`, `@tailwindcss/postcss`, `tw-animate-css` — reuse, don't downgrade
- **Current home page** explicitly says "Quest Board UI lands in Epic 1 stories 1.2–1.5" — replace with token showcase, not full shell

[Source: `1-1-scaffold-monorepo-and-development-infrastructure.md` Dev Agent Record]

### Git Intelligence

Recent commits:

- `ef86fd6` — monorepo scaffold (apps/web/api, packages including empty ui)
- `6ad1c0a` — planning artifacts (DESIGN.md, architecture)

Implementation should extend scaffold patterns (workspace imports, `@/` in apps/web, turbo scripts) rather than introducing parallel UI folders.

### Latest Tech Notes (shadcn + Tailwind v4 monorepo)

- shadcn CLI supports monorepos: each workspace needs its own `components.json`; align `style`, `baseColor`, `iconLibrary` across app + ui package
- Tailwind v4: leave `tailwind.config` empty in `components.json`
- Monorepo scanning requires explicit `@source` — automatic content detection often misses `packages/ui`
- Toast: shadcn now uses **Sonner** (`sonner` package + `<Toaster />`) — install via `shadcn add sonner`
- Use `moduleResolution: "bundler"` (already in web tsconfig) for package exports

[Source: https://ui.shadcn.com/docs/monorepo ; Tailwind v4 @source guidance]

### Project Structure Notes

- **`packages/ui`** — presentational only; no tRPC, no business logic, no domain imports [architecture L759]
- **Feature components** stay in `apps/web/components/{feature}/` starting Story 1.3+
- RSC rule unchanged: pages remain server components; client wrappers only where Radix/shadcn requires `"use client"`
- UI copy uses "Quest" in later stories; code stays `Task` — no user-facing copy required in token showcase beyond product name

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.2 AC, UX-DR1–3, UX-DR28–29]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — Crystal Path tokens, typography, components policy]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — packages/ui tree, design token layer L1008–1013, component boundaries]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/reconcile-architecture.md` — no UX/arch conflicts]
- [Source: `_bmad-output/implementation-artifacts/1-1-scaffold-monorepo-and-development-infrastructure.md` — scaffold baseline + review patches]
- [Source: `apps/web/components.json`, `apps/web/src/styles/globals.css` — current pre-1.2 state]
- [Source: shadcn monorepo docs — CLI routing + Tailwind v4 `@source`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor Agent)

### Debug Log References

- shadcn CLI added `next-themes` to sonner — removed; Toaster uses `theme="system"` directly (no ThemeProvider per UX-DR29)
- Web `tsc` failed on ui `@/` imports — fixed via explicit `@/lib/utils` and `@/components/ui/*` paths in `apps/web/tsconfig.json`
- Next build CSS failed resolving `tailwindcss` from ui package — added `tailwindcss` + `tw-animate-css` devDeps to `@rpg-life/ui`
- Next standalone build fails on Windows EPERM symlinks (pre-existing env issue); compile + type generation succeeded

### Completion Notes List

- ✅ `packages/ui` is shadcn home with Crystal Path tokens in `globals.css` (light + `prefers-color-scheme: dark`)
- ✅ Typography utilities (`text-display`, `text-display-sm`, `text-hero-level`), spacing scale, radius tokens per DESIGN.md
- ✅ 10 shadcn primitives installed via CLI; barrel exported from `@rpg-life/ui`
- ✅ Geist Sans via `geist` package; `<Toaster />` in AppProviders
- ✅ Token showcase page with Dialog/Sheet demos; no duplicate `apps/web/src/components/ui/`
- ✅ Code review 2026-05-29: 6 patches applied — literal @theme radii, removed hooks export, sonner theme lock + CSSProperties import, xp-track swatch, shadow-xs token, toast demo; type-check + smoke green

### File List

- `bun.lock`
- `apps/web/components.json`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/providers/app-providers.tsx`
- `apps/web/src/components/token-showcase.tsx`
- `apps/web/src/styles/globals.css`
- `packages/ui/components.json`
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/lib/utils.ts`
- `packages/ui/src/lib/utils.test.ts`
- `packages/ui/src/styles/globals.css`
- `packages/ui/src/components/ui/badge.tsx`
- `packages/ui/src/components/ui/button.tsx`
- `packages/ui/src/components/ui/checkbox.tsx`
- `packages/ui/src/components/ui/dialog.tsx`
- `packages/ui/src/components/ui/input.tsx`
- `packages/ui/src/components/ui/label.tsx`
- `packages/ui/src/components/ui/separator.tsx`
- `packages/ui/src/components/ui/sheet.tsx`
- `packages/ui/src/components/ui/skeleton.tsx`
- `packages/ui/src/components/ui/sonner.tsx`

## Change Log

- 2026-05-29: Story 1.2 — Crystal Path design tokens, shadcn foundation in `packages/ui`, token showcase, system color-scheme theming
- 2026-05-29: Code review — 6 patch findings applied (radius tokens, hooks export, sonner, xp-track swatch, shadow-xs, toast demo); status → done

### Review Findings

_Code review 2026-05-29 (3 layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 1.2 diff vs baseline `ef86fd6` (+ untracked ui/showcase files)._

#### Patch (all applied + verified 2026-05-29)

- [x] [Review][Patch] `@theme inline` radius tokens self-reference (`--radius-sm: var(--radius-sm)`) — use literal px values in `@theme` to avoid circular custom properties [`packages/ui/src/styles/globals.css`:150-154]
- [x] [Review][Patch] Phantom `./hooks/*` export with no `src/hooks/` directory — remove export or add stub [`packages/ui/package.json`:11]
- [x] [Review][Patch] `sonner.tsx` references `React.CSSProperties` without React import; `{...props}` after `theme="system"` allows prop override [`packages/ui/src/components/ui/sonner.tsx`:12-33]
- [x] [Review][Patch] Token showcase "XP track" swatch uses fill gradient instead of `bg-xp-track` [`apps/web/src/components/token-showcase.tsx`:58-61]
- [x] [Review][Patch] shadcn components use `shadow-xs` but theme defines no shadow scale — controls render flat [`packages/ui/src/styles/globals.css` + button/input/checkbox]
- [x] [Review][Patch] Toast primitive wired but not smoke-tested on showcase (AC5 partial) — add demo `toast()` trigger [`apps/web/src/components/token-showcase.tsx`]

#### Deferred

- [x] [Review][Defer] `apps/web/tsconfig.json` hijacks `@/lib/utils` and `@/components/ui/*` into `packages/ui` — fragile for second consumer; acceptable for single-app MVP until Story 1.4+ [`apps/web/tsconfig.json`:16-17]
- [x] [Review][Defer] `tailwindcss`/`tw-animate-css` in ui `devDependencies` — Docker build works today (`bun install` full) but breaks if production-only prune added [`packages/ui/package.json`:35-36]
- [x] [Review][Defer] CI runs type-check/lint only, not `next build` — CSS regressions caught late; Epic 4 scope
- [x] [Review][Defer] `/` renders token showcase until Story 1.4 shell — intentional per story Task 5
- [x] [Review][Defer] No automated OS theme-switch test — manual only; Epic 4 E2E

_Dismissed as noise (6): `--muted` surface vs DESIGN frontmatter (shadcn semantic split matches DESIGN prose); no in-app theme toggle (UX-DR29 required); raw TSX package exports (monorepo pattern); dual `components.json` workflow risk (document only); destructive `text-white` (shadcn default); brief Sonner first-paint flash._
