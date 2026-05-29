---
name: rpg-life
description: Browser-first habit RPG. Crystal Path palette, Star Path composition — fresh, lightweight, epic.
status: final
updated: 2026-05-29
colors:
  # Brand overrides on shadcn defaults. Unlisted tokens inherit shadcn (background, foreground,
  # muted, muted-foreground, popover, card, border, input, ring, destructive).
  background: '#F6FAFB'
  foreground: '#1A2830'
  primary: '#0B7A70'
  primary-foreground: '#FFFFFF'
  accent: '#7C3AED'
  accent-foreground: '#FFFFFF'
  muted: '#64748B'
  muted-foreground: '#64748B'
  border: '#D1E3E8'
  card: '#FFFFFF'
  card-foreground: '#1A2830'
  destructive: '#BE4B4B'
  destructive-foreground: '#FFFFFF'
  background-dark: '#0F1720'
  foreground-dark: '#E2F0F5'
  primary-dark: '#2DD4BF'
  primary-foreground-dark: '#0F1720'
  accent-dark: '#A78BFA'
  accent-foreground-dark: '#0F1720'
  muted-dark: '#7A8F9A'
  muted-foreground-dark: '#7A8F9A'
  border-dark: '#1E3440'
  card-dark: '#162028'
  card-foreground-dark: '#E2F0F5'
  destructive-dark: '#E57373'
  focus-pill-bg: '#E6F7F5'
  focus-pill-bg-dark: '#152830'
  focus-pill-fg: '#0B7A70'
  focus-pill-fg-dark: '#2DD4BF'
  xp-track: '#D1E3E8'
  xp-track-dark: '#1E3440'
  xp-fill-start: '#0B7A70'
  xp-fill-end: '#7C3AED'
  xp-fill-start-dark: '#2DD4BF'
  xp-fill-end-dark: '#A78BFA'
  skill-chip-bg: '#F0F4F6'
  skill-chip-bg-dark: '#1C2830'
  skill-chip-fg: '#64748B'
  skill-chip-fg-dark: '#7A8F9A'
  overdue-border: '#94A8B0'
  overdue-border-dark: '#4A6270'
typography:
  # Body, label, caption inherit shadcn (Geist Sans). Display for epic moments only.
  display:
    fontFamily: 'Geist Sans, system-ui, sans-serif'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-sm:
    fontFamily: 'Geist Sans, system-ui, sans-serif'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.25'
  hero-level:
    fontFamily: 'Geist Sans, system-ui, sans-serif'
    fontSize: 13px
    fontWeight: '600'
    letterSpacing: 0.04em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  xp-bar:
    track: '{colors.xp-track}'
    fill: 'linear-gradient(90deg, {colors.xp-fill-start}, {colors.xp-fill-end})'
    height: 8px
    radius: '{rounded.full}'
    glow: '0 0 12px rgba(124, 58, 237, 0.35)'
  focus-pill:
    background: '{colors.focus-pill-bg}'
    foreground: '{colors.focus-pill-fg}'
    radius: '{rounded.full}'
    border: '1px solid {colors.border}'
  skill-chip:
    background: '{colors.skill-chip-bg}'
    foreground: '{colors.skill-chip-fg}'
    radius: '{rounded.sm}'
    iconSize: 14px
  quest-row:
    background: '{colors.card}'
    radius: '{rounded.md}'
    padding: '{spacing.4} {spacing.5}'
    border: '1px solid {colors.border}'
  fab:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
    shadow: '0 4px 20px rgba(13, 148, 136, 0.35)'
  reward-modal-standard:
    background: '{colors.card}'
    radius: '{rounded.lg}'
    maxWidth: 420px
  hero-levelup-overlay:
    background: '{colors.background-dark}'
    foreground: '{colors.foreground-dark}'
  board-clear-empty:
    headline: '{typography.display-sm}'
    body: muted body copy
    primaryCta: '{components.button-primary}'
    secondaryLink: muted text link to My Profile
---

## Brand & Style

**rpg-life** gamifies real tasks so getting things done feels like progress in a living RPG — not homework, not guilt, not a forgettable checklist. The brand posture is **RPG first, lightweight through speed**: Ben should feel he is charting a constellation (Star Path), not administering a productivity system.

Visual identity = **Crystal Path** tokens (cool teal + violet clarity) + **Star Path** composition (airy spacing, luminous XP bar, cosmic minimalism). Dark mode follows `prefers-color-scheme`; neither mode is forced as default.

The product inherits **shadcn/ui + Tailwind v4** on Next.js. This DESIGN.md specifies the brand-layer delta only. Standard shadcn components (`Button`, `Dialog`, `Sheet`, `Toast`, `Checkbox`, `Skeleton`, `Badge`) ship with shadcn defaults except where overridden below. Customization beyond the brand layer is out of scope.

→ Composition references: `mockups/quest-board.html`, `mockups/reward-modal.html`, `mockups/auth-sign-in.html`, `mockups/board-clear-empty.html`, `mockups/color-themes-exploration.html`. **Spines win on conflict** with any mock or exploration artifact.

## Colors

Two chromatic roles on a restrained neutral canvas:

- **Teal primary (`#0B7A70` light / `#2DD4BF` dark)** — primary actions, Hero level label, FAB, links. Meets WCAG AA on white for button labels.
- **Violet accent (`#7C3AED` light / `#A78BFA` dark)** — XP bar gradient terminus, level-up moments, subtle glow. Epic payoff.
- **Canvas (`#F6FAFB` / `#0F1720`)** — app background; fresh, not clinical.
- **Surface / card (`#FFFFFF` / `#162028`)** — quest rows, modals, sheets.
- **Muted (`#64748B` / `#7A8F9A`)** — secondary copy, overdue styling, skill chip text. Overdue uses muted borders — **never alarm red**.
- **Focus pill** — teal on tinted background (`#E6F7F5` / `#152830`); distinct from violet XP.
- **Skill chips** — unified neutral (`skill-chip-*`); Skills differ by icon, not hue.
- **Destructive** — shadcn-aligned red for irreversible confirms only; not for overdue states.

Avoid: streak-counter red, shame gradients, per-skill rainbow palettes, decorative gradients on chrome (XP bar gradient is the one exception).

## Typography

Geist Sans (shadcn default) for all body UI. **`display`** and **`display-sm`** for epic beats only: level-up headline, celebratory empty states, auth gate headline. **`hero-level`** for the compact "Hero Lv N" label above the XP bar.

Quest titles use body weight medium at 16px. Meta (due dates, difficulty) uses muted at 13px. **`hero-level`** label uses uppercase via CSS utility (not a typography token field).

## Layout & Spacing

**Mobile-first** single column. Star Path rhythm: generous `{spacing.5}`–`{spacing.6}` between quest rows; `{spacing.4}` internal row padding.

| Breakpoint | Behavior |
|------------|----------|
| `< md` (< 768px) | Full-width Quest Board; sidebar as overlay sheet; FAB bottom-trailing |
| `md`–`lg` (768–1023px) | Centered content `max-w-lg`; sidebar overlay unchanged |
| `≥ lg` (1024px+) | Content `max-w-2xl` centered; optional two-column Profile (Hero summary + Skill grid) |

Quest Board header stack: hamburger + title → Hero zone (level + XP bar) + Focus pill → filter chips → quest list.

## Elevation & Depth

Subtle elevation only. Quest rows: 1px `{colors.border}` + soft surface, no heavy shadow. FAB: `{components.fab.shadow}`. Modals/sheets: shadcn default overlay + `{rounded.lg}`. Level-up full-screen: deep `{colors.background-dark}` with violet glow — the one high-depth moment.

## Shapes

Softer than default shadcn — `{rounded.md}` (12px) on cards and sheets, `{rounded.full}` on XP bar and Focus pill. FAB circular. Checkboxes use shadcn default with `{rounded.sm}` touch padding.

## Components

Inherited unchanged from shadcn: `Checkbox`, `Dialog`, `Sheet`, `Toast`, `Skeleton`, `Badge`, `Input`, `Label`, `Separator`.

Brand-layer overrides:

| Component | Visual spec |
|-----------|-------------|
| **Button (primary)** | `{components.button-primary}` — teal fill, white text |
| **XP bar** | `{components.xp-bar}` — gradient teal→violet, glow on fill |
| **Focus pill** | `{components.focus-pill}` — compact, trailing header |
| **Skill chip** | `{components.skill-chip}` + Lucide icon 14px; unified palette |
| **Quest row** | `{components.quest-row}` — elevated card, checkbox leading |
| **FAB** | `{components.fab}` — `{colors.primary}`, bottom-trailing, 56px |
| **Reward modal (standard)** | `{components.reward-modal-standard}` — sheet on mobile, dialog on desktop |
| **Hero level-up overlay** | `{components.hero-levelup-overlay}` — full viewport takeover; `{typography.display}` headline; see EXPERIENCE.md |
| **Board-clear empty** | `{components.board-clear-empty}` — centered column; `{typography.display-sm}` "Quest board clear"; body "Every quest accounted for. Start another when you're ready."; full-width primary **Add a quest** button; optional muted "See your growth" link; subtle star motif; FAB remains visible |
| **Confirm complete modal** | shadcn `Dialog`; primary **Yes** + outline **No**; stacked footer on mobile |
| **Create / Edit Quest sheet** | shadcn `Sheet` (bottom mobile / right desktop); fields: title → difficulty → skill chips → due date; save uses `{components.button-primary}` |
| **Focus spend prompt** | shadcn `Dialog`; cost "1 Focus" in `{components.focus-pill}` styling |
| **Tutorial sheet** | shadcn `Sheet` (bottom); standard dismiss; no brand override |
| **Sidebar overlay** | shadcn `Sheet` from left; `{colors.card}` panel |
| **Auth gate** | Centered card on `{colors.background}`; star motif (CSS/SVG); `{typography.display-sm}` headline |

### Skill icons (Lucide, unified chip styling)

| Skill | Icon |
|-------|------|
| Concentration | `Target` |
| Vitality | `HeartPulse` |
| Lore | `BookOpen` |
| Presence | `Users` |
| Order | `LayoutList` |
| Resolve | `Shield` |
| Craft | `Hammer` |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Teal for action; violet for progress/payoff | Use red for overdue Quests |
| Unified skill chips with icons | Assign a unique hue per Skill |
| Glow XP bar on header and Profile | Gradient every surface |
| `{typography.display-sm}` on board-clear and level-up headlines | Display typography on every row |
| Board-clear empty: celebrate + primary add-quest CTA | Board-clear that only links away to Profile |
| Follow system dark/light | Force dark or light as only mode |
| Inherit shadcn for standard controls | Custom-rebuild Dialog/Sheet/Toast |
