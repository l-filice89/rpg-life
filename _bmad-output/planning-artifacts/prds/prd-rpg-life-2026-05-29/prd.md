---
title: rpg-life
status: final
created: 2026-05-29
updated: 2026-05-29
---

# PRD: rpg-life

## 0. Document Purpose

This PRD defines **rpg-life** for internal/learning build work: a browser-first habit RPG where completing real tasks trains Skills and advances **Hero level**. Primary reader: the builder implementing MVP. Structured with Glossary-anchored terms, journey-linked FRs, and technical depth in `addendum.md`.

**Inputs:** brainstorming session 2026-05-28 (reconciled in `reconcile-brainstorm.md`). **Companion:** `addendum.md` (formulas, schema sketch, API, auth).

## 1. Vision

**rpg-life** gamifies your task list so getting things done feels fun—not like homework. Every **Quest** you complete trains one or more **Skills**, and **My Profile** shows where that effort actually went: a living picture of your strengths, gaps, and momentum through skill levels and XP bars—not just a checked box.

Unlike a plain to-do app or a tracker you forget after a week, rpg-life ties real work to RPG progression you can *feel*: complete a Quest, see Skills move, and raise **Hero level**. The differentiation is legible self-knowledge—*“I’m leveling Concentration and Resolve, not just clearing chores”*—not avatar dress-up or punitive streaks. Narrative **Story** chapters are planned after MVP; the first release proves the core loop: plan → do → reward → reflect in skill stats.

The product is built for **daily use** by people who struggle to follow through on meaningful tasks and enjoy game-like feedback loops. It may resonate with people who find traditional productivity tools hard to sustain (including those with ADHD-like attention patterns), but **rpg-life makes no medical or therapeutic claims**—it is a motivation and clarity tool, not treatment. Success for MVP is personal: the builder (and users like Ben) keep opening the app because progress is **reflected in skill distribution**, not buried in a log. The product must never become a **guilt machine** (shame copy, punishment spirals) or a **forgettable tracker** (numbers without meaning).

## 2. Target User

### 2.1 Jobs To Be Done

- **Motivation to start:** When I want to get something done, I log it in the app to get the motivation to actually do it.
- **Reward for hard work:** When I complete a tough task that has no inherent reward, I want to feel rewarded for the effort.
- **Orientation:** When I need to plan my week, I want a quick overview of what I have to do in the upcoming days.

### 2.3 Key User Journeys

- **UJ-1. Ben plants his first quest and commits to finishing it.**
  - **Persona + context:** Ben has a busy life and keeps deferring long-lasting tasks; he likes games and wants productivity to feel like progress, not guilt.
  - **Entry state:** First install, first open, no account data yet; mobile browser (primary).
  - **Path:**
    1. **First open:** **Tutorial explainer sheet** appears automatically (Quests, Skills, scheduling, XP freshness — dismissible; not auto-shown again).
    2. Lands on **Quest Board** with **empty state** (“No quests yet” + CTA to add).
    3. Taps **FAB** → **Create Quest** sheet (no explainer gate on FAB).
    4. Enters title, difficulty, **1–3 Skill tags** (save disabled until title + ≥1 Skill); optional due date encouraged in copy.
    5. Saves → **toast**: Quest created + nudge to complete Quests to level up.
    6. Quest appears on **Quest Board**; motivated, he **blocks time** to do it later (journey ends at commitment, not completion).
  - **Climax:** Toast + first Quest on Quest Board makes the loop legible: *do real things → train Skills → level up*.
  - **Resolution:** One open Quest with Skills assigned; Ben knows the next move is to complete it when ready.
  - **Edge case:** No network on save → Quest is **not created**; show clear error + retry (online-only MVP).

- **UJ-2. Ben completes a quest and collects his rewards.**
  - **Persona + context:** Same Ben; he finished the real-world work and returns to the app to mark progress.
  - **Entry state:** Returning user; **Quest Board** shows open Quests **sorted by nearest due date** (nulls last); overdue visible via filter/section.
  - **Path:**
    1. Finds his Quest in the list; taps **checkbox**.
    2. **Confirmation modal** (“Mark this quest complete?”) → taps **Yes**.
    3. Quest completes; **Reward modal** shows per-Skill XP gains (including any **freshness reduction** applied), Focus earned (if medium/hard), Hero XP progress.
    4. If **Hero level** increased: **Level up!** banner on the Reward modal; dismiss with **Continue**.
  - **Climax:** Reward modal — Skill icons lighting up, XP numbers, optional **Level up!** banner.
  - **Resolution:** Quest removed from open list (or hidden by active filters); header reflects new XP/Focus/Hero level; Ben returns to Quest Board.
  - **Edge case:** User taps **No** on confirm → modal dismisses, Quest stays open. Network failure on complete → error + retry; idempotent re-complete must not double-award.

- **UJ-3. Ben checks his hero stats on My Profile.**
  - **Persona + context:** Same Ben; curious how much he’s grown after several completed Quests.
  - **Entry state:** Returning user; authenticated session; lands on **Quest Board** (or any main screen).
  - **Path:**
    1. Opens **hamburger menu** → **sidebar overlay** (primary app navigation; extensible for future destinations).
    2. Taps **My Profile**.
    3. **My Profile** shows: **Hero level**, **XP remaining to next Hero level** (progress bar), **each Skill’s level with XP bars** (all seven, including untrained at 0), and **Focus balance / cap**. `[Perk constellation/tree deferred — see §6.2]`
  - **Climax:** Ben sees concrete progress — how close he is to the next Hero level-up and which Skills he’s actually training.
  - **Resolution:** Mental model refreshed; returns to **Quest Board** to keep working Quests.
  - **Edge case:** Stale data after a recent complete → page refreshes on open (or pull-to-refresh); loading skeleton while profile data loads.

- **UJ-4. Ben reschedules an overdue quest with Focus.** *(supports JTBD orientation + anti-shame)*
  - **Persona + context:** Ben missed a due date; he wants to replan without a guilt spiral.
  - **Entry state:** Quest Board with **overdue filter/section** active; Quest has `due_date` in the past.
  - **Path:**
    1. Opens overdue Quest (row action or detail).
    2. Chooses **Reschedule** → prompted: “Spend 1 Focus to reschedule without penalty.”
    3. Picks new due date → confirms → Focus debited, due date updated.
  - **Climax:** Neutral copy (“Quest rescheduled”) — Quest leaves overdue styling.
  - **Resolution:** Quest Board reflects new due date ordering; Focus balance updated on header/profile.
  - **Edge case:** Insufficient Focus → explain how to earn Focus (complete medium/hard Quests); no shame language.

## 3. Glossary

- **Quest** — A user-facing **Task** (RPG-framed copy). One entity in data/API: `Task`.
- **Task** — A to-do item: title, difficulty, optional due date, 1–3 Skills, status (`open` | `completed` | `cancelled`).
- **Quest Board** — Primary home screen listing open Quests — where you pick what to do next. Not limited to “today”; default sort is nearest due date. Supports overdue visibility and upcoming-day range filters. Realizes UJ-1, UJ-2, JTBD orientation.
- **Skill** — One of seven tag categories. Quest completion awards XP split across linked Skills.
- **Hero level** — Overall level derived from total Skill XP across all Skills. Computed at read time; not stored as source of truth.
- **Skill level** — Per-Skill level derived from that Skill’s XP. Computed at read time.
- **XP** — Experience points awarded on Quest completion; split evenly across linked Skills. Subject to **XP freshness** rules (see **XP freshness** below and `addendum.md`).
- **XP freshness** — Multiplier applied to base XP at completion to reward scheduled work and timely action. **Dated** Quests earn full XP through the due date; XP reduces only after the due date passes. **Undated** Quests earn less XP as time passes since creation. Never zero — see `addendum.md`. UI explains reductions neutrally (incentive to schedule, not punishment).
- **My Profile** — Stats screen: Hero level, XP-to-next Hero level, all Skill XP bars, Focus balance/cap.
- **FAB** — Floating Action Button to create a new Quest.
- **Focus** — Meta currency (distinct from the Concentration Skill). Earned on medium/hard Quest completion; spent on **system bypass** actions (MVP: reschedule overdue, delete overdue, add due date to previously undated Quest). Cap scales slowly with Hero level. Skill edits are free in MVP.
- **Reward modal** — Post-completion sheet showing XP gains, Focus earned, freshness notes if XP was reduced, and Hero level-up feedback.
- **Tutorial** — First-run explainer content; auto-shown once on first open; reopenable from sidebar **Tutorial** menu item.

**Skill catalog (MVP — seven Skills, fixed):**

| Skill | One-line definition |
|-------|---------------------|
| **Concentration** | Sustained attention on one important thing |
| **Vitality** | Body, energy, recovery |
| **Lore** | Learning and knowledge |
| **Presence** | People and communication |
| **Order** | Structure, planning, maintenance |
| **Resolve** | Uncomfortable or high-friction actions |
| **Craft** | Practical execution and finishing |

## 4. Features

### 4.1 Quest Board

**Description:** The app home surface. Shows open Quests for planning and completion—not only items due today. Default list order is **nearest due date** (Quests with no due date last). Users can surface **overdue** Quests and constrain how many **upcoming days** of future-dated Quests appear. Header shows Hero level progress and Focus pill. Realizes UJ-1, UJ-2, orientation JTBD.

**Functional Requirements:**

#### FR-1: View open Quests on Quest Board

Authenticated user can view all open Quests on **Quest Board**, sorted by nearest `due_date` ascending, with undated Quests after dated ones. Realizes UJ-2.

**Consequences (testable):**
- Quest with due date 2026-05-30 appears before Quest due 2026-06-05.
- Quest with `due_date = null` appears after all dated open Quests.
- Soft-deleted Quests never appear.

#### FR-2: Filter overdue Quests on Quest Board

User can toggle or apply a filter to show **overdue** open Quests (`due_date` before today). Realizes UJ-2, UJ-4.

**Consequences (testable):**
- Overdue filter shows only open Quests whose due date is strictly before the user’s current local date.
- Overdue section/filter hidden or empty when count is zero.
- Overdue copy uses neutral language (no “failed”, “missed”, “penalty”).

#### FR-3: Limit upcoming Quests by day range

User can set a filter limiting displayed future Quests to an **upcoming-day range** (default **7 days** when the filter is active). When no range filter is applied, all open Quests are shown.

**Consequences (testable):**
- With range = 7, Quest due in 8 days is hidden unless filter widened or cleared.
- **Undated Quests always remain visible** when range filter is active.
- Filter state persists for the session `[ASSUMPTION: session-only, not cross-device]`.

#### FR-4: Quest Board empty state

First-time user sees Tutorial explainer on first open (see FR-13); zero-Quest user sees empty state with CTA to add first Quest via FAB. Realizes UJ-1.

**Consequences (testable):**
- Copy includes RPG framing (“No quests yet”) and primary CTA to create a Quest.

---

### 4.2 Quest creation and editing

**Description:** Users create and maintain Quests with title, difficulty, optional due date, and 1–3 Skills. Scheduling a due date preserves full XP through that date (see **XP freshness**). Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Create Quest via FAB

User can create a Quest from **FAB** with title, difficulty (`trivial` | `easy` | `medium` | `hard`), optional due date, and **1–3 unique Skills**.

**Consequences (testable):**
- Save disabled until non-empty title and ≥1 Skill selected.
- Fourth Skill cannot be selected (max 3 enforced in UI).
- Successful create shows toast encouraging completion to level up; Quest appears on Quest Board.
- Create sheet copy nudges adding a due date (scheduling earns full XP longer than leaving undated).
- FAB always opens create sheet directly (Tutorial is separate — FR-13/FR-14).

#### FR-6: Edit and delete open Quests

User can edit open Quest fields and Skill tags; user can soft-delete an open Quest with confirmation. **Skill tag edits are free** in MVP.

**Consequences (testable):**
- Completed Quests cannot be edited (status locked).
- Changing Skills on an open Quest does not alter XP already awarded from prior completions.
- **Due date at create:** setting `due_date` on new Quest is **free**.
- **Add due date later:** adding `due_date` to an open Quest that was created **without** one costs **1 Focus** (prevents retroactive scheduling exploit vs XP freshness).
- **Delete non-overdue** open Quest: **free**.
- **Delete overdue** open Quest: costs **1 Focus** (closes delete-and-recreate workaround for reschedule).
- Deleted Quests excluded from Quest Board default views.

---

### 4.3 Quest completion and rewards

**Description:** Completing a Quest awards split Skill XP (after **XP freshness** multiplier), may earn Focus, and updates Hero level. Confirmation before complete; Reward modal after. Realizes UJ-2, reward JTBD.

**Functional Requirements:**

#### FR-7: Confirm then complete Quest

User completes an open Quest via checkbox → confirmation modal → **Yes** triggers completion.

**Consequences (testable):**
- **No** dismisses modal; Quest remains open.
- Completion rejected with clear error if Quest has zero Skills (should be blocked at create/edit).
- Repeat complete on already-completed Quest is idempotent (no double XP; same `xpAward` as first completion).

#### FR-8: Apply XP freshness and show Reward modal

On successful completion, system computes `xpAward = baseXp[difficulty] × freshnessMultiplier` (see `addendum.md`), splits across linked Skills, updates Hero level, and displays **Reward modal** with per-Skill gains and Hero progress.

**Consequences (testable):**
- **Dated Quest:** `freshnessMultiplier = 1.0` when completed on or before `due_date` (local date); reduces only for days **after** due date.
- **Undated Quest:** `freshnessMultiplier` decreases as days since `created_at` increase (100% on creation day; decays daily thereafter, floored at `minFreshness`).
- Reward modal shows base XP, multiplier, and final XP when multiplier < 1.0 — neutral copy (e.g. “Scheduled quests keep full XP” / “Quest aged — partial XP”), never shame framing.
- Medium/hard completion shows Focus earned (+1) when under cap; trivial/easy show 0 Focus earned.
- If Hero level increases, Reward modal shows **Level up!** banner.
- Reward feedback visible within 1s of successful API response under normal network `[NFR target]`.

---

### 4.4 My Profile

**Description:** Sidebar destination showing Hero level, XP-to-next, all Skill bars, Focus balance/cap. Skill bars in MVP; perk constellation/tree deferred. Realizes UJ-3.

**Functional Requirements:**

#### FR-9: View Hero and Skill stats

User can open **My Profile** from sidebar and see Hero level, XP remaining to next Hero level, all seven Skills with XP bars (0 XP if never trained), and Focus balance/cap.

**Consequences (testable):**
- All seven Skills always rendered even at 0 XP.
- Data refreshes on page open after a recent completion (no stale Hero level after complete flow).

---

### 4.5 Focus currency

**Description:** Focus is earned from medium/hard Quest completions and spent on actions that bypass normal constraints (anti-exploit + replanning). MVP spends: **reschedule overdue**, **delete overdue**, **add due date to previously undated Quest**. Stabilize streak and XP boost deferred. Realizes UJ-4.

**Functional Requirements:**

#### FR-10: Earn Focus on medium/hard completion

User earns +1 Focus when completing a medium or hard Quest, subject to Focus cap (`3 + floor(Hero level / 3)` per `addendum.md`).

**Consequences (testable):**
- Trivial/easy completion never increases Focus.
- Focus never exceeds cap after earn.
- At Hero level 1, cap is **3**; at Hero level 10, cap is **6**.

#### FR-11: Spend Focus on system bypass actions

User can spend **1 Focus** per action for:

| Action | When | Cost |
|--------|------|------|
| **Reschedule overdue** | Open Quest with `due_date` before today | 1 Focus |
| **Delete overdue** | Open Quest with `due_date` before today | 1 Focus |
| **Add due date** | Open Quest created without `due_date`; user adds first `due_date` | 1 Focus |

**Consequences (testable):**
- Spend rejected with actionable message when Focus balance < 1 (explain medium/hard completions earn Focus).
- **Reschedule:** Quest not overdue after new date; **XP freshness** uses new due date (full XP through that date).
- **Delete overdue:** Quest soft-deleted; Focus debited (same cost as reschedule — no delete-and-recreate loophole).
- **Add due date:** `due_date` set; future completions use **dated** freshness rules (full XP through due date); does not reset undated age already accrued at completion time for past days — only dated path applies from that due date forward.
- All spends use neutral copy; no shame framing.
- Focus balance decrements by 1 on each successful spend.

---

### 4.6 Navigation and shell

**Description:** Hamburger opens sidebar overlay; Quest Board is default home. Mobile-first layout. Realizes UJ-1–UJ-4.

**Functional Requirements:**

#### FR-12: Sidebar navigation

User opens hamburger menu to reveal **sidebar overlay** with **Quest Board** (home), **My Profile**, and **Tutorial**.

**Consequences (testable):**
- Sidebar dismisses on backdrop tap or navigate action.
- Keyboard and screen-reader accessible (focus trap while open, visible focus states).

#### FR-13: First-run Tutorial on app open

On **first ever app open**, user sees **Tutorial** explainer sheet automatically before interacting with Quest Board.

**Consequences (testable):**
- Explainer shown exactly once per user/account (tracked server- or client-side).
- Dismissing explainer lands user on Quest Board (empty state if no Quests).
- Subsequent app opens do not auto-show Tutorial.

#### FR-14: Reopen Tutorial from sidebar

User can open **Tutorial** from sidebar at any time to replay explainer content (same content as first-run).

**Consequences (testable):**
- Tutorial from menu does not mutate first-run “already seen” state.
- Tutorial covers: Quests, Skills, Hero level, due dates vs undated XP freshness, Focus earn/spend rules (schedule at create = free; overdue replan, delete, or add-date = Focus).

---

### 4.7 Cross-cutting NFRs

**Description:** System-wide quality attributes for MVP. Aligns with `_bmad-output/project-context.md`.

**Non-functional requirements:**

- **Platform:** Browser-first; **mobile-primary** layout with responsive desktop enhancement.
- **Connectivity:** Online-only MVP; failed requests show retry UI (no silent failure).
- **Performance:** Reward modal visible within 1s of successful complete under normal network (FR-8).
- **Accessibility:** Semantic HTML, keyboard navigation, visible focus, screen-reader labels on Quest Board actions, sidebar, modals, and FAB; touch targets sized for mobile.
- **Security:** Auth via better-auth magic link; all mutations scoped to authenticated user; no client-trusted XP or Focus writes.
- **Auth:** Session cookie; better-auth magic link (see `addendum.md`).

---

## 5. Non-Goals (Explicit)

- **Not a guilt machine** — no shame copy, streak punishment, or penalty framing on overdue Quests.
- **Not a medical/adherence product** — no therapeutic or ADHD treatment claims.
- **Not a social/multiplayer RPG** — single-player only in MVP.
- **Not a Story/narrative product in MVP** — no chapters, choices, or story DB fields in v1 schema.

## 6. MVP Scope

### 6.1 In Scope

- Quest Board (sort, overdue filter, upcoming-day range filter — 7-day default; undated always visible)
- Quest CRUD with 1–3 Skills, difficulties, optional due dates
- Complete flow (confirm → reward modal → Hero/Skill XP with **XP freshness** rules)
- My Profile (Hero level, Skill XP bars, Focus display)
- Focus earn + spend (reschedule overdue, delete overdue, add due date to undated)
- Hamburger sidebar navigation (Quest Board, My Profile, **Tutorial**), FAB create
- First-run Tutorial auto on first open; Tutorial replay from menu
- **Online-only** MVP (clear errors + retry on network failure)
- **Auth:** magic link via **better-auth**

### 6.2 Out of Scope for MVP

| Item | Reason |
|------|--------|
| Story chapters, choices, `story_flags` | Post-MVP narrative layer; schema added later |
| Perk constellation / perk tree UI | Deferred until perks system exists |
| Focus: stabilize streak, boost next Quest XP | Utility spends — v1.1 |
| Focus to edit Skill tags | Deferred; free edits in MVP |
| Skill perks at level thresholds | v2 |
| Fortune / luck Skill | v2 |
| Offline-first queue | Online-only for MVP (decided) |
| Multiplayer, parties, guilds | Non-goal |

## 7. Success Metrics

**Primary**

- **SM-1:** Builder uses rpg-life at least **4 days per week** for 4 consecutive weeks post-MVP. Validates core habit loop (FR-1, FR-7, FR-8).

**Secondary**

- **SM-2:** After 2 weeks of use, Skill XP distribution is **non-uniform** (user reflects real work mix, not tag spam). Validates FR-5, FR-8, FR-9.

**Counter-metrics (do not optimize)**

- **SM-C1:** Raw Quest completion count without Skill diversity — avoid encouraging trivial Quest spam or single-Skill grinding.

## 8. Resolved Decisions

1. **Online-only for MVP** — no offline queue; network errors show retry UI (UJ-1, UJ-2 edge cases).
2. **XP freshness rates locked** — `undatedDecayPerDay = 0.02`, `overdueDecayPerDay = 0.05`, `minFreshness = 0.5` (`addendum.md`).
3. **Auth:** magic link via **better-auth** (session/cookie); sufficient for learning MVP.

## 9. Assumptions Index

- **§4.1 FR-3:** Default upcoming window = 7 days when range filter active; undated Quests always visible; session-only filter persistence.
- **§4.3 FR-8:** Reward modal within 1s under normal network.
- **§4.5 FR-10:** Focus cap `3 + floor(Hero level / 3)` — slower cap growth than `/2` to limit system gaming.
