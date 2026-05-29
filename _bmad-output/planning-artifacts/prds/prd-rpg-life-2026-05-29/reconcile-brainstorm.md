# Input Reconciliation — brainstorming-session-2026-05-28

**Input:** `_bmad-output/brainstorming/brainstorming-session-2026-05-28-112057.md`  
**Against:** `prd.md`, `addendum.md`

## Captured in PRD

| Brainstorm topic | PRD location |
|------------------|--------------|
| 7 Skills (Concentration–Craft), max 3 tags, split XP | §3 Glossary, addendum |
| Base XP by difficulty, skill/hero sqrt curves, `a_skill`/`a_user` | addendum |
| Focus earn medium/hard, cap scales with level | FR-10, addendum (cap formula updated) |
| Task complete idempotent, transactional XP | FR-7, FR-8 |
| Mobile-first, anti-shame overdue copy | FR-2, §5 Non-Goals |
| Reward modal on complete | UJ-2, FR-8 |
| SQLite/DTO/API sketch | addendum (Hero level naming, no story fields) |
| Create/edit task with skills | FR-5, FR-6 |

## Intentionally changed (decision log)

| Brainstorm | PRD decision |
|------------|--------------|
| Bottom nav (Today / Hero / FAB) | Hamburger sidebar + Quest Board + My Profile + Tutorial |
| "Today" home screen | **Quest Board** with filters |
| Campaign level | **Hero level** |
| Story chapters P0, level-up beats | **Post-MVP** |
| Hero constellation P0 | Skill **bars** MVP; constellation/perk tree later |
| Onboarding: empty Today, FAB tooltip | Tutorial on **first app open** + menu replay |
| Checkbox-only complete | **Confirm modal** then complete |
| Focus cap `5 + floor(level/2)` | `3 + floor(level/3)` |
| Focus spend: reschedule, stabilize, boost | MVP: reschedule + **delete overdue** + **add due date** |
| No XP freshness | **XP freshness** added (PRD innovation post-brainstorm) |

## Deferred / out of scope (documented §6.2)

- Story DB, chapters API, `story_flags`
- Perk constellation, skill perks, Fortune skill
- Focus stabilize streak, boost next task
- Offline-first queue
- Multiplayer

## Qualitative gaps (none blocking)

- Brainstorm UX copy examples ("Quest board clear", Focus sheet layout) → suitable for **UX spec**, not PRD
- Brainstorm field-level SQLite DDL → reference in addendum; implement from addendum + brainstorm doc
- Tone/voice for story chapters → deferred with Story feature

## Reconciliation verdict

**Complete.** All locked MVP scope from coaching is reflected. Brainstorm superseded where decision log records user overrides. No silent drops of in-scope brainstorm items.
