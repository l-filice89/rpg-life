---
name: rpg-life
status: final
sources:
  - {planning_artifacts}/prds/prd-rpg-life-2026-05-29/prd.md
  - {planning_artifacts}/prds/prd-rpg-life-2026-05-29/addendum.md
  - {planning_artifacts}/prds/prd-rpg-life-2026-05-29/reconcile-brainstorm.md
  - {planning_artifacts}/architecture.md
  - {planning_artifacts}/brainstorming/brainstorming-session-2026-05-28-112057.md
updated: 2026-05-29
---

# rpg-life — Experience Spine

> Browser-first habit RPG. Mobile-primary, responsive to tablet and desktop. shadcn/ui + Tailwind v4 on Next.js. `DESIGN.md` is the visual identity reference; this spine owns behavior, IA, and interaction. **Spines win on conflict** with mocks in `mockups/`.

## Foundation

**Form-factor:** Mobile-first responsive web (no native apps). Primary interaction on phone browser; tablet and desktop use centered layouts with wider max-width.

**UI system:** shadcn/ui on Next.js 15 App Router + Tailwind v4. Brand-layer overrides in `DESIGN.md`; behavioral delta specified here. RSC-first architecture — reads server-rendered; mutations in client islands (modals, FAB, sidebar, forms).

**Theme:** Follow `prefers-color-scheme` (light Crystal Path / dark Crystal Path). No in-app theme toggle in MVP.

## Information Architecture

| Surface | Reached from | Purpose |
|---------|--------------|---------|
| **Sign in** | Unauthenticated app open | Magic link email capture (Auth B). After submit → **post-send confirmation** on the **same page** (star motif, masked email, resend). User then checks their **email app** for the link — not a separate in-app route. |
| **Quest Board** | App open (authenticated default) | Home — list, filter, complete Quests |
| **Create Quest sheet** | FAB | New Quest with title, difficulty, Skills, optional due date |
| **Edit Quest sheet** | Quest row tap (not checkbox) | Edit open Quest; delete; Focus-gated actions |
| **Confirm complete modal** | Quest checkbox | "Mark this quest complete?" |
| **Reward modal** | After confirm Yes | XP gains, Focus earned, Hero progress |
| **Hero level-up overlay** | Reward modal when Hero level increases | Full-screen epic celebration (Reward C) |
| **My Profile** | Sidebar → My Profile | Hero level, Skill XP bars (all 7), Focus balance/cap |
| **Sidebar overlay** | Hamburger | Nav: Quest Board, My Profile, Tutorial |
| **Tutorial sheet** | First app open (once) or sidebar | Explainer: Quests, Skills, freshness, Focus |
| **Focus spend prompt** | Reschedule / delete overdue / add due date | Confirm 1 Focus spend |

Modal stack: one level deep (confirm → reward replaces confirm; never two dialogs).

**Route vs state:** Some IA rows are **in-page states**, not separate routes. Post-send auth confirmation lives on `(auth)/sign-in` — the user action of checking their email inbox happens outside the app.

→ Composition: `mockups/quest-board.html`, `mockups/reward-modal.html`, `mockups/auth-sign-in.html`, `mockups/board-clear-empty.html`

## Voice and Tone

Microcopy. Brand aesthetic lives in `DESIGN.md`. RPG voice — encouraging, never punitive.

| Do | Don't |
|----|-------|
| "Quest complete!" | "Task completed successfully ✓" |
| "No quests yet" | "Your list is empty — get started!" |
| "Quest board clear" | "Inbox zero! 🎉" |
| "Every quest accounted for. Start another when you're ready." | "All done!" (too flat) |
| "Enter a valid realm address" | "Invalid email format" |
| "Spend 1 Focus to reschedule without penalty." | "You failed — pay to fix it." |
| "Scheduled quests keep full XP through the due date." | "You missed out on XP because you're lazy." |
| "Enter the realm" (auth) | "Sign up now!" |
| "Check your stars — link sent." | "Verification email dispatched." |
| Neutral overdue: "Overdue" section label | "Failed quests", "Missed", "Late penalty" |

## Component Patterns

Behavioral. Visual specs in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|-----------|-----|------------------|
| **Quest row** | Quest Board | Checkbox completes (→ confirm). Row body tap → edit sheet. Shows title, difficulty chip, 1–3 skill chips (icons), due date if set. Overdue: muted border only. |
| **Quest Board header** | Quest Board top | Hero level + `{components.xp-bar}` + Focus pill (read-only display; no tap action MVP). Refreshes after complete. |
| **Quest Board filters** | Below header | Toggle overdue filter; upcoming-day range (default 7 when active). Undated Quests always visible. |
| **FAB** | Quest Board | Always opens Create Quest sheet directly — no Tutorial gate. |
| **Create / Edit Quest sheet** | FAB / row tap | Title required; 1–3 Skills required; save disabled until valid. Due date optional; copy nudges scheduling. Edit: completed Quests locked. |
| **Confirm complete modal** | Checkbox tap | Yes → complete API; No → dismiss, Quest stays open. |
| **Reward modal (standard)** | Post-complete | Shows per-Skill XP (+ animated fill ~400ms), Focus if earned, freshness note if multiplier < 1, Hero XP bar. Continue dismisses. |
| **Hero level-up overlay** | Hero level increased | Replaces standard reward layout: full-screen, `{typography.display}` "Level up!", subtle confetti, extended beat. Continue returns to Quest Board. |
| **Skill chip** | Rows, forms, reward | Unified styling; Lucide icon + Skill name. Max 3 per Quest enforced in create/edit. |
| **Focus spend prompt** | Contextual | Shows cost, action, confirm/cancel. Insufficient Focus → explain earn path (medium/hard Quests). |
| **Sidebar overlay** | Hamburger | Focus trap while open; dismiss on backdrop or nav selection. Items: Quest Board, My Profile, Tutorial. |
| **Tutorial sheet** | First open / sidebar | Auto once per account; dismissible. Replay from sidebar does not reset seen flag. |
| **Auth gate** | Pre-session | Single route `(auth)/sign-in`: email → send magic link → post-send confirmation inline. User opens **email client** for link. RPG-framed copy (Auth B). |
| **Toast** | Create success, reschedule, errors | Quest created nudge; neutral success; error + retry hint for network failures. |
| **Empty state (zero Quests)** | Quest Board | "No quests yet" + FAB CTA; RPG one-liner. Shown after Tutorial dismiss on first open. |
| **Empty state (board clear)** | Quest Board after last complete | When completing the final open Quest (checkbox → confirm → reward dismiss), Quest Board shows celebratory empty immediately: headline "Quest board clear", body celebrates no open Quests **and** invites the next one (primary CTA → FAB / "Add a quest"). Secondary link to My Profile optional. Distinct from first-time empty ("No quests yet"). |

## State Patterns

| State | Surface | Treatment |
|-------|---------|-----------|
| Unauthenticated | Sign in | Auth gate; no app shell |
| Magic link sent | Sign in (post-send state) | Same page shows confirmation; resend link; user checks email app |
| Sign in validation | Sign in | Invalid email → "Enter a valid realm address" |
| First open | Tutorial → Quest Board | Tutorial sheet auto; then empty or list |
| Cold load | Quest Board | Skeleton rows; header skeleton |
| Quest Board fetch fail | Quest Board | Error banner + retry; do not show empty state |
| Empty (never created) | Quest Board | "No quests yet" + FAB |
| Board clear | Quest Board (post last complete) | Celebratory empty + add-quest CTA; shows as soon as Reward modal dismisses and list is empty |
| Has open Quests | Quest Board | Sorted nearest due date; nulls last |
| Overdue filter active | Quest Board | Section/filter; neutral copy; zero → hide section |
| Loading Profile | My Profile | Skeleton bars for Hero + 7 Skills |
| Stale Profile | My Profile | Refresh on open; optional pull-to-refresh |
| Complete in flight | Quest row | Row disabled until response; no double-submit |
| Network error (write) | Any mutation | Inline or toast error + retry; no silent fail |
| Insufficient Focus | Focus spend prompt | Block spend; explain earn path |
| Reduced motion | Reward / level-up | Skip fill animation and confetti; show final values |

## Interaction Primitives

**Touch-first (mobile primary):** minimum 44×44px tap targets on checkbox, FAB, nav items, primary buttons.

**Mouse / keyboard (desktop enhancement):** Tab order matches visual order; `Esc` closes topmost sheet/modal; Enter activates primary action in modals. Sidebar focus trap per PRD NFR.

**Quest Board gestures:** tap only in MVP — no swipe-to-complete, no swipe actions.

**Banned:** streak counters, shame copy, punishment spirals, double-modal stacks, client-trusted XP/Focus, offline silent queue.

## Accessibility Floor

- WCAG 2.2 AA target; contrast via `DESIGN.md` token pairs.
- Semantic HTML: lists for Quest Board, headings for sections, `aria-label` on checkbox ("Complete quest: {title}").
- Screen reader announces Reward modal content (XP gains, level-up).
- Focus trap in sidebar, sheets, modals; visible focus rings (shadcn `ring`).
- `prefers-reduced-motion`: disable XP fill animation and confetti.
- Form labels on Create/Edit and auth email field.

## Responsive & Platform

| Breakpoint | Behavior |
|------------|----------|
| `< md` | Single column; sidebar overlay; FAB bottom-trailing; Reward modal as bottom sheet |
| `md`–`lg` | Centered `max-w-lg`; same overlay nav |
| `≥ lg` | `max-w-2xl`; Reward modal as centered dialog; Profile may use two-column Skill grid |

Browser-only — no install prompt, no native shell. Online-only MVP: all writes show retry on failure.

## Inspiration & Anti-patterns

**Lifted — Habitica (concept only):** RPG framing for real tasks; rejected avatar dress-up and party systems for MVP.

**Lifted — Star Path mock:** cosmic minimal layout; luminous progress as "charting a constellation."

**Rejected — Guilt machine:** shame copy, red overdue alarms, streak punishment, "failed quest" language.

**Rejected — Forgettable tracker:** checkbox-only apps with no Skill reflection; rpg-life's Profile is the retention hook.

**Rejected — Bottom nav (brainstorm):** superseded by sidebar + Quest Board per PRD decision log.

**Rejected — Story modal MVP:** post-MVP narrative layer.

## Key Flows

### UJ-1 — Ben plants his first quest and commits to finishing it

1. Ben opens rpg-life in mobile browser — first visit. **Tutorial sheet** auto-opens (Quests, Skills, scheduling, XP freshness).
2. He dismisses Tutorial → **Quest Board** empty state: "No quests yet."
3. Taps **FAB** → **Create Quest sheet** (no explainer gate).
4. Enters title, difficulty, selects **Concentration** + **Lore**; adds due date encouraged by copy.
5. Saves → toast: Quest created + nudge to complete to level up.
6. **Climax:** Toast + first Quest visible on Quest Board — loop legible: *do real things → train Skills → level up.*
7. **Resolution:** One open Quest; Ben blocks time offline to do the work later.

**Failure:** No network on save → Quest not created; error + retry.

### UJ-2 — Ben completes a quest and collects his rewards

1. Ben returns to **Quest Board** — open Quests sorted by nearest due date.
2. Finds Quest; taps **checkbox** → **Confirm complete modal** → **Yes**.
3. **Reward modal (standard):** per-Skill XP (+12 each), +1 Focus, Hero bar progress; XP bars fill ~400ms.
4. If Hero level increased → **Hero level-up overlay** (full-screen, confetti, `{typography.display}` "Level up!").
5. **Climax:** Reward modal — Skills light up, numbers land, optional level-up takeover.
6. **Resolution:** Quest leaves open list; header XP/Focus updated. If last open Quest → **board clear empty** (celebrate + add-quest CTA). Else Ben continues on Quest Board.

**Failure:** No on confirm → Quest stays open. Network fail → error + retry; idempotent re-complete shows same reward, no double award.

### UJ-3 — Ben checks his hero stats on My Profile

1. Ben opens **hamburger** → **sidebar** → **My Profile**.
2. Sees Hero level, XP-to-next bar, all **seven Skills** with XP bars (0 if untrained), Focus balance/cap.
3. **Climax:** Concrete progress — which Skills he's training, how close to next Hero level.
4. **Resolution:** Returns to Quest Board motivated.

**Failure:** Stale data → refresh on open; skeleton while loading.

### UJ-4 — Ben reschedules an overdue quest with Focus

1. Ben activates **overdue filter** on Quest Board; opens overdue Quest.
2. Chooses **Reschedule** → Focus spend prompt: "Spend 1 Focus to reschedule without penalty."
3. Picks new due date → confirms → Focus debited.
4. **Climax:** Neutral toast "Quest rescheduled" — overdue styling removed.
5. **Resolution:** Quest Board re-sorted; Focus updated in header.

**Failure:** Focus < 1 → explain earning via medium/hard completions; no shame language.

### Flow — Board clear (celebratory empty on last complete)

1. Ben has one open Quest remaining on **Quest Board**.
2. Taps checkbox → confirm → **Reward modal** (UJ-2) → taps **Continue**.
3. Quest Board re-renders with zero open Quests — **board clear empty** appears immediately (no refresh required).
4. **Climax:** Celebratory empty — `{typography.display-sm}` "Quest board clear"; body celebrates every quest accounted for *and* invites the next ("Start another when you're ready."); primary **Add a quest** button + FAB remains visible. Optional secondary: "See your growth" → My Profile.

→ `mockups/board-clear-empty.html`
5. **Resolution:** Ben adds another Quest via FAB or steps away satisfied.

### Flow — Sign in (magic link, Auth B)

1. Unauthenticated Ben lands on **Sign in** — headline "Enter the realm", email field.
2. Submits → page shows **post-send confirmation** (same route): star motif, masked email, "Link sent." Ben checks his **email app** for the magic link.
3. Taps magic link in email → session established → **Quest Board** (Tutorial if first open).

**Failure:** Invalid/expired link → error with option to resend.
