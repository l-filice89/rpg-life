# rpg-life PRD Addendum

Technical depth companion to `prd.md`. Not duplicated in FR narrative.

## Progression constants (MVP — tunable)

| Constant | Role | Starter value |
|----------|------|---------------|
| `baseXp` | XP per difficulty | trivial 5, easy 10, medium 25, hard 50 |
| `a_skill` | Skill level curve | 25 |
| `a_user` | Hero level curve (slower) | 50 |
| `maxSkillsPerTask` | Cap tags per Quest | 3 |
| `minFreshness` | Floor multiplier (never 0 XP) | 0.5 |
| `undatedDecayPerDay` | Undated age decay rate | 0.02 (2% per day since creation) |
| `overdueDecayPerDay` | Dated post-due decay rate | 0.05 (5% per overdue day) |

Rates locked for MVP (2026-05-29).

## Base XP on completion

```
baseAward = baseXp[difficulty]
freshnessMultiplier = computeFreshness(task, completedAtLocalDate)
xpAward = max(1, floor(baseAward * freshnessMultiplier))
xpPerSkill = floor(xpAward / count(linked_skills))
```

## XP freshness

Goal: encourage **scheduling** (dated Quests keep full XP through due date) vs leaving Quests **undated** (slow decay from creation).

### Dated Quest (`due_date` set)

```
daysOverdue = max(0, completedLocalDate - due_date)  // calendar days
if daysOverdue == 0:
  freshnessMultiplier = 1.0
else:
  freshnessMultiplier = max(minFreshness, 1 - overdueDecayPerDay * daysOverdue)
```

- Full XP on or before due date (local calendar).
- Decay applies only **after** due date passes.
- Rescheduling to a future due date resets overdue decay; full XP through the new date.

### Undated Quest (`due_date` null)

```
daysSinceCreation = max(0, completedLocalDate - createdLocalDate)  // calendar days
freshnessMultiplier = max(minFreshness, 1 - undatedDecayPerDay * daysSinceCreation)
```

- Decay begins from creation day 0 (same-day complete = 100%; day 7 ≈ 86% at 2%/day).
- Undated always visible on Quest Board regardless of upcoming-day filter.

### Reward modal payload (suggested)

Include when `freshnessMultiplier < 1`:

```ts
freshness: {
  multiplier: number;
  reason: 'undated_age' | 'overdue';
  daysApplied: number;
  baseXp: number;
  finalXp: number;
}
```

## Hero / Skill levels

- **Skill level:** `floor(sqrt(skillXp / a_skill))`
- **Hero level:** `totalXp = sum(skillXp)`; `floor(sqrt(totalXp / a_user))`
- **Focus cap:** `3 + floor(heroLevel / 3)` — base 3, slow growth (Hero 1 → cap 3, Hero 6 → cap 5, Hero 10 → cap 6)
- **Focus earn:** +1 on medium/hard completion only, capped

### Focus spend (MVP — 1 Focus each)

| `type` | Purpose |
|--------|---------|
| `reschedule_overdue` | New due date for overdue open Quest |
| `delete_overdue` | Soft-delete overdue open Quest (anti-reschedule loophole) |
| `add_due_date` | First due date on Quest created undated |

Due date at **create time** is free; Skill edits are free in MVP.

## Data model (MVP — no Story fields)

**Stored source of truth:** `user_skills.xp` per (user, skill).

**Computed at read:** Skill level, Hero level, total XP, freshness at complete time.

**Required Task fields for freshness:** `created_at`, optional `due_date`, `completed_at`.

**Omitted for MVP (add post-Story):** `story_flags`, `last_story_level`, story chapter tables/APIs.

**User progress (MVP):** `user_progress.focus_balance`; optional `tutorial_seen_at` or client flag for first-run Tutorial.

### Core tables

- `users`
- `tasks` — title, difficulty, due_date, status, owner_id, **created_at**
- `skills` — seed catalog (7 rows)
- `task_skills` — junction, 1–3 per task
- `user_skills` — xp per user/skill
- `user_progress` — focus_balance (+ optional tutorial_seen)

See brainstorming session for field-level SQLite notes; drop story columns when implementing.

## Auth (MVP)

- **better-auth** with **magic link** email sign-in
- Session cookie; all API routes scoped to authenticated `user_id`
- Sufficient for internal/learning MVP; multi-user ready if needed later

## API sketch (MVP)

- `GET /api/v1/tasks` — list open Quests (Quest Board); query params: `overdue`, `upcomingDays` (default 7 when filter on)
- `POST /api/v1/tasks` — create
- `PATCH /api/v1/tasks/:id` — edit open Quest
- `DELETE /api/v1/tasks/:id` — soft delete
- `PATCH /api/v1/tasks/:id/complete` — complete (idempotent); response includes freshness breakdown
- `GET /api/v1/me` — Hero level, Skills, Focus
- `POST /api/v1/me/focus/spend` — `{ type: 'reschedule_overdue' | 'delete_overdue' | 'add_due_date', taskId, newDueDate? }`
- `PATCH /api/v1/me/tutorial` — mark Tutorial seen (if server-tracked)

DTO naming uses `Task` in API; UI copy uses Quest.
