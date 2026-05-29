# Spine Pair Review — rpg-life

- **DESIGN.md:** `ux-rpg-life-2026-05-29/DESIGN.md`
- **EXPERIENCE.md:** `ux-rpg-life-2026-05-29/EXPERIENCE.md`
- **Run at:** 2026-05-29

---

## Overall verdict

The spine pair is solid and implementation-ready for all core flows. Token coverage is comprehensive with consistent light/dark pairs; section order is canonical; board-clear timing ("immediately, no refresh") and dual copy are propagated consistently across all four specification surfaces (State Patterns, Component Patterns, Key Flow, and `.decision-log.md`). The most actionable gaps are: (1) typography cross-reference paths use `{display}` / `{display-sm}` where the design-md-spec requires `{typography.display}` — downstream code generators will fail to resolve; (2) primary teal `#0D9488` on white `#FFFFFF` yields ≈ 3.75:1 contrast, falling below WCAG AA for normal-weight text despite the stated AA target; (3) DESIGN.md Components table is missing entries for the board-clear empty state, Confirm modal, and Create/Edit Quest sheet; and (4) the `mockups/quest-board.html` visual reference still uses the pre-final Star Path exploration palette rather than the accepted Crystal Path tokens.

---

## 1. Flow coverage — strong

Checked: 4 named UJs (UJ-1 through UJ-4) + 2 named flows (Board clear, Sign in). Each has a named protagonist (Ben), numbered steps, a climax beat, and a failure path where applicable. All 12 IA surfaces are reachable from at least one flow or state. Board-clear is a standalone named flow confirming the recent change.

### Findings

- **medium** No dedicated key flow for Edit Quest. The surface appears in the IA table and Component Patterns with detailed behavioral rules but is never exercised as a full numbered flow with protagonist and failure path. *Fix:* Add `Flow — Ben edits an open quest and reschedules its due date` (triggers Focus spend; shares protagonist with UJ-4).

- **low** Focus spend prompt has three triggers documented in the decision log (reschedule overdue, delete overdue, add due date to undated), but only reschedule is walked in UJ-4. Delete overdue and add-due-date paths are unverified flows. *Fix:* Extend UJ-4 or add a second Focus flow covering the delete / add-due-date variants with their distinct copy.

- **low** Tutorial auto-open is embedded as step 1 of UJ-1, not a standalone flow. If the first-open sequence becomes a distinct feature (animated intro, skip gate), there is no named flow to anchor changes against. *Fix:* Promote to `Flow — Tutorial first open and dismiss` with its failure (user skips immediately → empty state).

---

## 2. Token completeness — adequate

Checked: all YAML frontmatter keys; every `{path.to.token}` reference in both spines. Light/dark pairs are provided for all load-bearing color tokens. Component token objects resolve cleanly.

### Findings

- **high** Typography cross-reference paths are malformed. Both spines write `{display}` and `{display-sm}` in prose (DESIGN.md Components reward-modal row; EXPERIENCE.md Component Patterns board-clear entry and Hero level-up row; Key Flows "Level up!" and "Quest board clear" climax beats). Per `references/design-md-spec.md`, the path must follow the YAML structure: `{typography.display}` and `{typography.display-sm}`. A downstream code generator or AI consumer sourcing the token will fail to resolve the short form. *Fix:* Replace all occurrences of `{display}` → `{typography.display}` and `{display-sm}` → `{typography.display-sm}` in both files (≥ 6 call sites).

- **high** Primary button contrast is below WCAG AA for normal-weight text. `{colors.primary}` = `#0D9488` on `{colors.primary-foreground}` = `#FFFFFF` yields ≈ 3.75:1. WCAG 2.2 AA requires 4.5:1 for normal text (< 18px or < 14px bold) and 3:1 for large text (≥ 18px or ≥ 14px bold). Quest titles in Create/Edit sheet use 16px medium weight — this pairing fails AA at that size. EXPERIENCE.md explicitly states "WCAG 2.2 AA target." *Fix:* Darken `primary` to ≈ `#0B7A70` (contrast ≈ 4.5:1 on white) or add a `note` to the component spec stating that primary button text must be set ≥ 18px or bold where contrast cannot be raised.

- **medium** `muted-foreground-dark` is absent from the frontmatter. Both `muted: '#64748B'` and `muted-foreground: '#64748B'` share the same light value (unusual — shadcn typically separates background-muted from text-muted); `muted-dark: '#7A8F9A'` is defined but `muted-foreground-dark` is missing entirely. Dark-mode consumers that apply `muted-foreground` to secondary copy will have no resolved dark value. *Fix:* Add `muted-foreground-dark: '#7A8F9A'` (or a deliberately different value if the two tokens are meant to diverge in dark mode).

- **low** `typography.hero-level.textTransform: uppercase` is not a valid typography token field per design-md-spec.md (permitted: `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`). It will not be consumed by standard token parsers. *Fix:* Remove from frontmatter; document the uppercase rule in the Typography body section as a prose annotation. Implementation adds `text-transform: uppercase` as a utility.

- **low** `components.reward-modal-levelup.fullScreen: true` is a boolean behavioral flag in a visual token object. Token parsers will not know what to do with it. *Fix:* Remove from frontmatter; document full-viewport behavior in DESIGN.md Components prose and EXPERIENCE.md Component Patterns (already present there).

---

## 3. Component coverage — adequate

Checked: every component name appearing in DESIGN.md frontmatter, body, IA table, Component Patterns, State Patterns, and Key Flows. EXPERIENCE.md coverage is strong — every component has real behavioral rules. DESIGN.md Components table covers brand-layer overrides well but is missing entries for several surfaces that appear in EXPERIENCE.md.

### Findings

- **high** Board-clear empty state has no visual spec in DESIGN.md. It is correctly detailed in EXPERIENCE.md Component Patterns (celebratory headline, dual copy, primary "Add a quest" CTA, optional My Profile link) and Do's and Don'ts mentions "`{display-sm}` on board-clear headlines," but there is no component table row specifying the layout: which headline level, whether the cosmic motif is present, how the primary CTA is rendered (standalone Button vs. FAB echo vs. inline link). This is the most recently specified surface and the most likely to be mis-implemented without a visual spec. *Fix:* Add a `board-clear-empty` row to DESIGN.md Components: `{typography.display-sm}` headline, celebratory one-liner at `body/muted`, primary `Button` (teal, full-width mobile), optional muted text link to My Profile. Cross-ref `{components.button-primary}`.

- **medium** Confirm complete modal is absent from DESIGN.md Components. It appears in the IA table, Component Patterns, and Key Flows (UJ-2 step 2). A standard shadcn `Dialog` is implied but the spec does not say so, does not name the two button labels, and does not specify whether the footer is horizontal or stacked on mobile. *Fix:* Add a row: "shadcn `Dialog`; two actions: primary 'Yes' (`{components.button-primary}`) + secondary 'No' (outline); no icon; mobile-friendly footer stacking."

- **medium** Create/Edit Quest sheet is absent from DESIGN.md Components. EXPERIENCE.md Component Patterns has detailed behavioral rules (title required, 1–3 Skills required, save-disabled-until-valid, completed quests locked) but there is no visual spec for the form layout: field order, Skills selector pattern (chips vs. checkboxes), due-date input styling, or save/cancel button placement. *Fix:* Add a brief row or short section specifying: shadcn `Sheet` (bottom on mobile, right on desktop); field order (title → difficulty → skills → due date); Skills selector as chip-multi-select using `{components.skill-chip}` styling; primary save button `{components.button-primary}`; destructive delete only in edit mode.

- **low** Focus spend prompt is absent from DESIGN.md Components. Low risk — a standard Dialog — but the cost display ("1 Focus") and the "insufficient Focus" branch copy variant are not spec'd visually. *Fix:* One-line row: "shadcn `Dialog`; cost displayed in `{components.skill-chip}` styling; insufficient state swaps confirm button to ghost + earn-path muted copy."

- **low** Tutorial sheet is absent from DESIGN.md Components. *Fix:* One-line row: "shadcn `Sheet` (bottom); no overrides; dismiss button standard."

---

## 4. State coverage — strong

Checked: all 12 IA surfaces against applicable states (empty, cold-load, focus, error, offline, permission-denied). The State Patterns table is the most comprehensive section of EXPERIENCE.md — 12 named states with explicit treatments. Board clear's "shows as soon as Reward modal dismisses" is correctly stated.

### Findings

- **medium** Quest Board load error on cold fetch is not listed in State Patterns. "Cold load" is covered (skeleton rows) but the fetch-failure branch — what happens if the initial Quest Board load fails — is absent. The "Network error (write)" state is covered; the read-path error is not. *Fix:* Add row: "Quest Board fetch fail → skeleton replaced by error banner + retry CTA; no empty state shown."

- **low** Sign in form validation error (malformed email) is not listed. Low risk — standard HTML5 + shadcn `Input` error state — but the RPG-voice copy for the error message is unspecified. *Fix:* Add one-liner in State Patterns or Voice and Tone table: "'Enter a valid realm address'" or equivalent anti-shame phrasing.

---

## 5. Visual reference coverage — thin

Mockups folder contains: `quest-board.html`, `reward-modal.html`, `auth-sign-in.html`, `color-themes-exploration.html` (4 files). DESIGN.md correctly lists all 4 with spines-win-on-conflict stated. EXPERIENCE.md references 3 (omitting the color exploration, which is acceptable).

### Findings

- **high** Board-clear empty state has no mockup. This is the focal surface of the recent change to verify. The dual-copy layout (celebrate + primary CTA + optional profile link) is fully specified in prose but has never been rendered. Without a reference, implementers must derive the visual treatment from prose alone, increasing misinterpretation risk. *Fix:* Create `mockups/board-clear-empty.html` showing both light and dark modes; link from EXPERIENCE.md Key Flows board-clear section.

- **medium** `mockups/quest-board.html` uses the pre-final Star Path exploration palette (`background: #0B0E17`, XP glow `#7B8CFF → #B4A0FF`, text `#E4E8F4`) rather than the accepted Crystal Path tokens (`background-dark: #0F1720`, `primary-dark: #2DD4BF`, `foreground-dark: #E2F0F5`). "Spines win on conflict" means this will not break implementation, but it actively misleads developers inspecting the HTML for color values. It also does not show the light-mode Crystal Path state at all. *Fix:* Update quest-board.html to use final Crystal Path tokens; add a light-mode panel alongside the dark panel, consistent with `reward-modal.html` which already shows both.

- **medium** My Profile surface has no mockup. The 7-Skill XP bar grid (all Skills at 0 if untrained), Focus balance/cap display, and the `≥ lg` optional two-column layout are fully prose-specified but not visualized. Risk: inconsistent Skill bar spacing and Focus cap rendering. *Fix:* Create `mockups/my-profile.html`; link from EXPERIENCE.md UJ-3.

- **medium** Create/Edit Quest sheet has no mockup. The Skills chip-multi-select and due-date field layout require visual reference to implement without ambiguity. *Fix:* Add to the quest-board.html mockup as an overlaid sheet panel, or create a separate `mockups/create-quest-sheet.html`.

- **low** Sidebar overlay, Focus spend prompt, and Tutorial sheet have no mockups. All are standard shadcn Sheet/Dialog; low implementation risk.

- **low** EXPERIENCE.md composition reference (line 44) omits `color-themes-exploration.html`. DESIGN.md references it correctly. Not load-bearing for behavior, but EXPERIENCE.md's reference list is now slightly out of sync.

---

## 6. Bloat & overspecification — strong

Both spines are tightly scoped. DESIGN.md prose carries appropriate editorial voice without padding. EXPERIENCE.md is mostly behavioral tables and numbered flows with minimal narrative excess.

### Findings

- **low** `textTransform: uppercase` in `typography.hero-level` frontmatter (see Token completeness §2 — same fix).

- **low** `fullScreen: true` in `components.reward-modal-levelup` frontmatter (see Token completeness §2 — same fix).

- **low** EXPERIENCE.md Component Patterns, Quest Board filters entry: "Session-only state" is an implementation/state management detail that belongs in architecture, not UX spine. *Fix:* Remove "Session-only state" clause; behavior (filter resets on navigation) can be noted in State Patterns or omitted — architecture already owns session persistence decisions.

---

## 7. Inheritance discipline — adequate

Frontmatter sources in EXPERIENCE.md resolve to named PRD and architecture artifacts. Glossary is consistent between spines for the primary terms (Quest Board, Hero, Focus pill, Skill chip, FAB, Quest row). One naming conflict and one systemic path syntax issue reduce the verdict from strong.

### Findings

- **high** Typography path syntax `{display}` / `{display-sm}` does not follow design-md-spec.md conventions (same finding as Token completeness §2 — counted once). All 6+ call sites across both spines must be corrected.

- **medium** "Hero level-up overlay" (EXPERIENCE.md IA, Component Patterns, State Patterns, Key Flows) vs "Reward modal (level-up)" (DESIGN.md Components table, frontmatter key `reward-modal-levelup`). These refer to the same surface using different names. A downstream developer cross-referencing both spines will encounter an apparent mismatch. *Fix:* Standardize. Recommended canonical name: "Hero level-up overlay" (more evocative, matches EXPERIENCE usage); update DESIGN.md Components table row label and frontmatter key from `reward-modal-levelup` to `hero-levelup-overlay` (or add a cross-reference note to the existing row).

---

## 8. Shape fit — strong

DESIGN.md sections follow canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. ✅

EXPERIENCE.md required sections all present: Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows. ✅

Required-when-applicable: Inspiration & Anti-patterns ✅ (decision log documents reference products and explicit rejects); Responsive & Platform ✅ (multi-surface breakpoints stated). ✅

No invented sections. No findings.

---

## Mechanical notes

- `{display}` / `{display-sm}` short-form token paths appear at the following locations (all need updating to `{typography.display}` / `{typography.display-sm}`):
  - DESIGN.md: Components table (reward-modal-levelup row visual spec); Do's and Don'ts table ("display-sm on board-clear and level-up headlines")
  - EXPERIENCE.md: Component Patterns board-clear empty row; Component Patterns Hero level-up overlay row; Key Flow UJ-2 step 4 ("full-screen, `{display}` 'Level up!'"); Key Flow Board clear step 4 ("`{display-sm}` 'Quest board clear'")
- Frontmatter key `reward-modal-levelup` (DESIGN.md) vs prose name "Hero level-up overlay" (EXPERIENCE.md) — unresolved alias; document or rename.
- `components.sidebar-overlay` and `components.auth-gate` have prose specs in DESIGN.md body but no frontmatter component token objects — consistent with shadcn inheritance approach; acceptable as-is if no brand-layer override is needed.
- EXPERIENCE.md frontmatter `sources` resolves to 5 named artifacts; DESIGN.md has no `sources` key — expected per design-md-spec.md (sources is EXPERIENCE.md convention).
