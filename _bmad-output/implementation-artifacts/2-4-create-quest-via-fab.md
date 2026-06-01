---
baseline_commit: 7be1df9
---

# Story 2.4: Create Quest via FAB

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Ben**,
I want to create a Quest with title, difficulty, Skills, and optional due date,
So that I can log real tasks and assign them RPG meaning.

## Acceptance Criteria

1. **Given** an authenticated user on Quest Board **When** they tap the FAB **Then** the Create Quest sheet opens directly with no Tutorial gate (FR5, UX-DR8).

2. **And** fields appear in order: title → difficulty → skill chips → due date (UX-DR14).

3. **And** save is disabled until non-empty trimmed title and ≥1 Skill selected; max 3 Skills enforced in UI (fourth tap ignored or blocked).

4. **And** due date is optional with helper copy nudging scheduling for full XP (FR5, PRD FR-5 — "Scheduled quests keep full XP through the due date.").

5. **When** they save a valid Quest **Then** `tasks.create` persists the Quest with `status = 'open'`, `owner_id = ctx.user.id`, and 1–3 `task_skills` rows **And** a success toast shows Quest-created nudge to complete for XP (UX-DR24, UX-DR27) **And** the new Quest appears on Quest Board without manual reload.

6. **When** network fails on save **Then** the Quest is not created **And** an error toast with retry hint appears (NFR2, UX-DR23) — no silent fail.

7. **And** FAB is 56×56px circular, primary teal, bottom-trailing, shadow `0 4px 20px rgba(13, 148, 136, 0.35)` (light) per UX-DR8 / DESIGN.md `components.fab`.

8. **And** Create Quest sheet uses shadcn `Sheet`: `side="bottom"` on `< md`, `side="right"` on `≥ md` (UX-DR14); save button uses primary styling, min 44px height.

9. **And** form fields have visible labels; skill toggles are keyboard-accessible with `aria-pressed` (UX-DR26).

10. **And** integration tests cover `tasks.create` auth, validation, persistence, and owner scoping; smoke script updated.

## Tasks / Subtasks

- [x] **Task 1: `TaskCreateSchema` in validators** (AC: #3, #5)
  - [x] Create `packages/validators/src/task.ts` — export `TaskCreateSchema`, `TaskCreateInput`, `TaskDifficultySchema`
  - [x] `title`: `z.string().trim().min(1).max(200)` (pick max aligned with DB `text` — 200 is safe MVP cap)
  - [x] `difficulty`: `z.enum(['trivial', 'easy', 'medium', 'hard'])`
  - [x] `skillCodes`: `z.array(SkillCodeSchema).min(1).max(3)` + `.refine` unique codes
  - [x] `dueDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()` — omit or `null` = undated
  - [x] Export from `packages/validators/src/index.ts`

- [x] **Task 2: Repository `createTaskForOwner`** (AC: #5)
  - [x] Add `createTaskForOwner(db, ownerId, input: TaskCreateInput): Promise<TaskListItem>` in `packages/db/src/repositories/tasks.ts`
  - [x] Generate `id` with `crypto.randomUUID()`; set `createdAt` / `modifiedAt` to ISO UTC now
  - [x] Insert `tasks` row: `status: 'open'`, `deletedAt: null`, `dueDate` from input or null
  - [x] Insert `task_skills` rows in same **transaction** (Drizzle `db.transaction`)
  - [x] Return camelCase `TaskListItem` matching `listOpenTasksByOwner` shape (include sorted `skillCodes`)
  - [x] Reject invalid `skill_code` at DB FK — map to `TRPCError BAD_REQUEST` in router if needed

- [x] **Task 3: `tasks.create` tRPC procedure** (AC: #5, #6, #10)
  - [x] Extend `packages/api/src/routers/tasks.ts`: `create: protectedProcedure.input(TaskCreateSchema).mutation(...)`
  - [x] Scope: `ctx.user.id` only — never accept `ownerId` from client
  - [x] Export `TaskCreateInput` type from `@rpg-life/api` (infer from router or re-export validator type)
  - [x] Create `packages/api/src/__tests__/tasks-create.test.ts`:
    - unauthenticated → `UNAUTHORIZED`
    - empty title / zero skills / four skills / duplicate skill codes → `BAD_REQUEST`
    - valid create → returns `TaskListItem`; row exists; `task_skills` count matches
    - user A cannot create as user B (N/A if no ownerId input — assert `owner_id` on returned item)
  - [x] Add `tasks-create.test.ts` to root `package.json` `smoke` script

- [x] **Task 4: `FabCreateQuest` client island** (AC: #1, #7)
  - [x] Create `apps/web/src/components/quest-board/FabCreateQuest.tsx` — `"use client"`
  - [x] Fixed position: `fixed bottom-6 right-6 z-40` (or equivalent within viewport; respect AppShell padding)
  - [x] 56×56 circle, `bg-primary text-primary-foreground`, `shadow-[0_4px_20px_rgba(13,148,136,0.35)]`, `aria-label="Create quest"`
  - [x] `+` icon (Lucide `Plus` or text) — min 44×44 touch target met by 56px size
  - [x] Local state `sheetOpen`; FAB click sets open — **no** Tutorial check

- [x] **Task 5: `CreateQuestSheet` form** (AC: #2–#6, #8–#9)
  - [x] Create `apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx` — `"use client"`
  - [x] Props: `open`, `onOpenChange`, `onCreated?: () => void`
  - [x] Sheet title: "Create Quest" (UI copy uses Quest; code uses Task)
  - [x] Field order:
    1. Title — `Label` + `Input`, `autoFocus` on open
    2. Difficulty — four options (trivial/easy/medium/hard); segmented buttons or native `select` with labels from `getDifficultyLabel` pattern
    3. Skills — toggle grid from `SKILL_CATALOG`; reuse `SkillChip` visual with `aria-pressed`; max 3 selections
    4. Due date — `input type="date"` optional; helper: "Scheduled quests keep full XP through the due date." (EXPERIENCE.md voice table)
  - [x] Save disabled when `!title.trim() || selectedSkills.length === 0` or `create.isPending`
  - [x] `trpc.tasks.create.useMutation` — on success: `toast.success` with nudge copy; `onOpenChange(false)`; call `router.refresh()` from `next/navigation` so RSC list updates
  - [x] on error: `toast.error('Could not create quest. Check your connection and try again.')` — mirror `tutorial-sheet.tsx`
  - [x] Responsive `side`: `useMediaQuery('(min-width: 768px)')` → `right` else `bottom` (or CSS-only if already established elsewhere)

- [x] **Task 6: Wire into Quest Board** (AC: #1, #5)
  - [x] Create `apps/web/src/components/quest-board/QuestBoardFab.tsx` — client wrapper composing `FabCreateQuest` + `CreateQuestSheet`
  - [x] Update `QuestBoard.tsx` — render `<QuestBoardFab />` after list (FAB visible even when zero quests — Story 2.7 empty state copy deferred)
  - [x] Keep `QuestBoard` RSC; do not add `"use client"` to page or board shell

- [x] **Task 7: Optional form deps** (AC: #2)
  - [x] If using RHF per architecture: add `react-hook-form` + `@hookform/resolvers` to `apps/web/package.json` and wire `zodResolver(TaskCreateSchema)`
  - [x] **Acceptable MVP alternative:** controlled `useState` + validate with `TaskCreateSchema.safeParse` on submit — fewer deps; document choice in Dev Agent Record

- [x] **Task 8: Verification** (AC: all)
  - [x] `bun run type-check` green
  - [x] `bun run smoke` green
  - [x] Manual: FAB opens sheet; save disabled until valid; create with 1–3 skills; toast + row appears
  - [x] Manual: stop api → save shows error toast; no ghost row
  - [x] Manual: FAB works with zero quests placeholder still visible

### Review Findings

_Code review 2026-06-01 (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Scope: Story 2.4 uncommitted diff vs baseline `7be1df9`._

- [x] [Review][Patch] Save handler lacks in-flight guard — rapid double-click can create duplicate quests [`apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`:83]
- [x] [Review][Patch] Title input has no `maxLength={200}` — long paste passes UI gate then fails silently on `safeParse` [`apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`:117]
- [x] [Review][Patch] Client `safeParse` failure is silent — should toast when validation fails after Save [`apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`:91]
- [x] [Review][Patch] Validation tests do not assert `BAD_REQUEST` code (only `rejects.toMatchObject`) [`packages/api/src/__tests__/tasks-create.test.ts`:109]
- [x] [Review][Patch] No test for undated quest (`dueDate` omitted / null) [`packages/api/src/__tests__/tasks-create.test.ts`]
- [x] [Review][Patch] No test for malformed `dueDate` string [`packages/api/src/__tests__/tasks-create.test.ts`]
- [x] [Review][Defer] Invalid `skill_code` FK errors surface as raw DB errors, not `TRPCError` — Zod enum blocks normal clients; same class as Story 2.2 repository cast deferral
- [x] [Review][Defer] Shared in-memory test DB accumulates rows across tests — matches `tasks-list.test.ts` pattern; per-test userIds isolate assertions

## Dev Notes

### Brownfield Starting Point (Post Story 2.3)

| Exists today | Action |
|---|---|
| `tasks.list` + `listOpenTasksByOwner` | **Reuse** — sorting unchanged; refresh after create |
| `TaskListItem` type from `@rpg-life/api` | **Reuse** — return type for `tasks.create` |
| `SkillChip`, `SKILL_CATALOG`, `SkillCode` | **Reuse** — skill picker + chips on new row |
| `getDifficultyLabel` | **Reuse** — difficulty display labels |
| `QuestBoard.tsx` RSC + header + `QuestRow` | **Update** — mount FAB client island |
| `TutorialSheet` | **Keep** — independent; FAB must not wait for tutorial dismiss |
| `toast` + `Toaster` in `AppProviders` | **Reuse** — sonner via `@rpg-life/ui` |
| `Sheet`, `Button`, `Input`, `Label` in `@rpg-life/ui` | **Reuse** |
| `tasks.create` / `TaskCreateSchema` | **Create** — deferred since Story 2.1 |
| Edit sheet, row tap edit, filters, FR4 empty | **Defer** — Stories 2.5–2.7 |
| `focus.spend`, add-due-date Focus gate | **Defer** — Story 3.5 (create-time due date is **free** per FR-6) |

[Source: codebase read 2026-06-01; `2-3-quest-board-header-and-brand-components.md`]

### Binding: `tasks.create` Contract

**Procedure:** `tasks.create` — `protectedProcedure.mutation`, input `TaskCreateSchema`.

**Input (`TaskCreateInput`):**

```typescript
{
  title: string;           // trimmed, min 1
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  skillCodes: SkillCode[]; // 1–3 unique
  dueDate?: string | null; // YYYY-MM-DD or null/omitted
}
```

**Response:** `TaskListItem` (same shape as `tasks.list` items).

**Persistence rules:**

| Field | Rule |
|-------|------|
| `owner_id` | Always `ctx.user.id` |
| `status` | `'open'` |
| `deleted_at` | `null` |
| `due_date` | Input `dueDate` or `null` |
| `task_skills` | One row per selected code; FK to `skills.code` |
| Timestamps | ISO UTC strings in `created_at` / `modified_at` |

**Validation errors:** `TRPCError({ code: 'BAD_REQUEST', message })` — Zod failures surface via tRPC input parser.

**No Focus spend** on create with due date (FR-6: due date at create is free).

[Source: `epics.md` Story 2.4; `prd.md` FR-5–6; `architecture.md` L517–518]

### Post-Create List Refresh (Binding)

Quest Board page is RSC (`quest-board/page.tsx` fetches `tasks.list` server-side). After mutation success:

```typescript
import { useRouter } from 'next/navigation';
// onSuccess:
router.refresh();
```

Do **not** import `@rpg-life/db` in web. Do **not** manually append to local list unless `refresh()` proves insufficient in dev — prefer `router.refresh()` first (matches Next 15 + tRPC cookie session pattern).

[Source: `architecture.md` invalidation note; Story 2.2 RSC pattern]

### Toast Copy (Binding — UX-DR24, UX-DR27)

| Event | Copy |
|-------|------|
| Success title | `Quest created` |
| Success description | `Complete it when you're ready to earn XP and level up.` |
| Error | `Could not create quest. Check your connection and try again.` |

Tone: encouraging, never punitive. No "Task created successfully ✓".

[Source: `EXPERIENCE.md` UJ-1 step 5; Voice table; `tutorial-sheet.tsx` error pattern]

### FAB Styling (Binding — UX-DR8)

```tsx
// Tailwind approximation of mockup quest-board.html .fab
className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(13,148,136,0.35)]"
```

Dark mode: primary token already adapts (`#2DD4BF` on dark per DESIGN.md). FAB remains on Quest Board only — not global AppShell (Profile has no FAB).

[Source: `mockups/quest-board.html` L119–131; `DESIGN.md` components.fab]

### Create Quest Sheet Layout (Binding — UX-DR14)

```
SheetHeader: "Create Quest"
─────────────────────────
Title *          [ Input                    ]
Difficulty *     [ Trivial | Easy | Medium | Hard ]
Skills * (1–3)   [ SkillChip toggles × 7    ]
Due date         [ date input ]  (optional)
                 Helper: Scheduled quests keep full XP through the due date.
─────────────────────────
[ Save Quest ]  (primary, full-width mobile, disabled until valid)
```

- Default difficulty: `easy` (reasonable Ben default; not specified in epic — document in completion notes if changed)
- Skill toggles: clicking selected chip deselects; at 3 selected, ignore clicks on unselected (or disable unselected chips)
- `Esc` closes sheet (shadcn default); focus trap per Sheet primitive

**File naming:** Architecture references unified `QuestSheet.tsx` with `mode: 'create' | 'edit'`. For 2.4, implement **`CreateQuestSheet.tsx`** only; Story 2.5 can extract shared `QuestSheet` when edit lands — avoid premature edit/delete UI.

[Source: `architecture.md` L1020; `DESIGN.md` Create/Edit Quest sheet row]

### Skill Picker Implementation Hint

`SkillChip` is presentational (`<span>`). For the form, use `<button type="button">` wrappers with selected ring:

```tsx
className={cn(
  'rounded-sm border-2 transition-colors',
  selected ? 'border-primary' : 'border-transparent',
)}
aria-pressed={selected}
```

Inner content can match `SkillChip` styles or render `<SkillChip />` inside button (ensure no nested interactive elements).

### Difficulty Labels

| DB/API value | UI label |
|--------------|----------|
| trivial | Trivial |
| easy | Easy |
| medium | Medium |
| hard | Hard |

Reuse `apps/web/src/lib/difficulty-label.ts` for consistency with `QuestRow`.

### UI Scope Boundaries (Critical — Prevent Scope Creep)

**In scope (Story 2.4):**
- `TaskCreateSchema` + `tasks.create` + repository transaction
- FAB + Create Quest sheet (create only)
- Success/error toasts
- `router.refresh()` after create
- API integration tests + smoke

**Out of scope — do NOT implement:**
- Row tap → edit sheet (Story 2.5)
- Delete quest (Story 2.5)
- Quest Board filters (Story 2.6)
- FR4 "No quests yet" empty state (Story 2.7)
- Checkbox complete / confirm / reward (Epic 3)
- Focus-gated add-due-date on edit (Story 3.5)
- E2E Playwright UJ-1 (Epic 4)
- Unified `QuestSheet` edit mode (Story 2.5)
- `react-hook-form` is optional — do not block story on RHF if controlled state ships faster

**Zero quests:** Keep Story 2.3 placeholder (`Your quests will appear here.`) — FAB still visible so Ben can create first quest (UJ-1 step 3).

### Previous Story Intelligence (2.3)

- Brand layer ready: `SkillChip`, tokens, `format-due-date.ts`, `difficulty-label.ts`
- `QuestRow` is RSC; only `QuestRowActions` is client — follow same split for FAB/sheet
- `profile.get` + parallel fetch on page — **unchanged**; create does not need profile invalidation
- Review pattern: assert `UNAUTHORIZED` code explicitly in auth tests
- UTC date discipline on display — store `dueDate` as `YYYY-MM-DD` from `<input type="date">` without timezone shift

[Source: `2-3-quest-board-header-and-brand-components.md`]

### Previous Story Intelligence (2.2)

- `tasks-list.test.ts` patterns: in-memory SQLite, migrations split on `--> statement-breakpoint`, `seedSkills`
- Sort after create: new task appears in correct position when list refetches (`due_date` sort)
- Error boundary on fetch fail — separate from mutation toast (do not replace `error.tsx` with toast-only)

[Source: `2-2-list-open-quests-on-quest-board.md`]

### Git Intelligence

| Commit | Relevance |
|--------|-----------|
| `7be1df9` feat: quest board header | Baseline — FAB/sheet missing; Story 2.3 complete |
| `2252f15` feat: task visualization | `tasks.list`, Quest Board RSC |
| `af73294` feat: tasks and skills | Schema + seeds for `task_skills` FK |

### Latest Tech Notes

- **tRPC v11** + `@trpc/react-query` — `useMutation` + `router.refresh()` is established pattern; no `utils.invalidate` required for RSC lists
- **Zod 3** — share schema between API `.input()` and client `safeParse`
- **shadcn Sheet** — `side` prop; use `md` breakpoint 768px per DESIGN.md
- **sonner** — `toast.success(title, { description })` exported from `@rpg-life/ui`
- **No `@rpg-life/db` in apps/web** — enforced by eslint boundaries

### Anti-Patterns (Do Not)

- ❌ Gate FAB behind Tutorial `tutorial_seen_at`
- ❌ Accept `ownerId` / `userId` in `tasks.create` input
- ❌ Hard-delete tasks — always insert with `deleted_at: null`
- ❌ Allow 4+ skills because UI forgot to cap
- ❌ Silent failure on network error
- ❌ Convert `QuestBoard.tsx` to client component for one FAB
- ❌ Implement edit/delete/filter/empty-state in this story
- ❌ Charge Focus for due date on create
- ❌ Use `quest.create` procedure name
- ❌ Break `tasks.list` sort or filter semantics

### Project Structure Notes

Align with architecture tree:

```
apps/web/src/components/quest-board/FabCreateQuest.tsx
apps/web/src/components/quest-board/QuestBoardFab.tsx    # optional thin wrapper
apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx
packages/validators/src/task.ts
packages/db/src/repositories/tasks.ts                    # add createTaskForOwner
packages/api/src/routers/tasks.ts                        # add create
packages/api/src/__tests__/tasks-create.test.ts
```

Export types from `@rpg-life/api` alongside `TaskListItem`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.4, UX-DR8, UX-DR14, UX-DR24, UX-DR27]
- [Source: `_bmad-output/planning-artifacts/prds/prd-rpg-life-2026-05-29/prd.md` — FR-5, FR-6 due-date-at-create free]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/EXPERIENCE.md` — UJ-1, FAB, sheet, toast, voice]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/DESIGN.md` — fab, sheet, breakpoints]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-rpg-life-2026-05-29/mockups/quest-board.html` — FAB position/style]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — TaskCreateSchema, RSC/client split, naming]
- [Source: `_bmad-output/implementation-artifacts/2-3-quest-board-header-and-brand-components.md`]
- [Source: `_bmad-output/implementation-artifacts/2-2-list-open-quests-on-quest-board.md`]
- [Source: `_bmad-output/implementation-artifacts/2-1-tasks-schema-and-skill-catalog-seed.md` — schema deferred validators]
- [Source: `apps/web/src/components/tutorial/tutorial-sheet.tsx` — mutation + toast pattern]

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

- Skill codes in create response sorted by catalog order (lore before craft) — test expectation aligned

### Completion Notes List

- ✅ `TaskCreateSchema` + `TaskCreateInput` in `@rpg-life/validators`
- ✅ `createTaskForOwner` transactional insert; `tasks.create` tRPC procedure
- ✅ 7 integration tests in `tasks-create.test.ts`; added to root smoke
- ✅ `FabCreateQuest` + `QuestBoardFab` + `CreateQuestSheet` (controlled state, no RHF)
- ✅ Default difficulty `easy`; skill cap 3 with disabled unselected at max
- ✅ `router.refresh()` after successful create; binding toast copy
- ✅ `bun run smoke` + `bun run type-check` green
- ✅ Code review 2026-06-01: 6 patches applied (double-submit guard, title maxLength, parse toast, explicit BAD_REQUEST tests, undated + malformed dueDate tests)

### File List

- `packages/validators/src/task.ts`
- `packages/validators/src/index.ts`
- `packages/db/src/repositories/tasks.ts`
- `packages/db/src/index.ts`
- `packages/api/package.json`
- `packages/api/src/routers/tasks.ts`
- `packages/api/src/index.ts`
- `packages/api/src/__tests__/tasks-create.test.ts`
- `apps/web/package.json`
- `apps/web/src/components/quest-board/FabCreateQuest.tsx`
- `apps/web/src/components/quest-board/QuestBoardFab.tsx`
- `apps/web/src/components/quest-board/QuestBoard.tsx`
- `apps/web/src/components/create-quest-sheet/CreateQuestSheet.tsx`
- `package.json`
- `bun.lock`

## Change Log

- 2026-06-01: Story 2.4 — `tasks.create`, FAB, Create Quest sheet, integration tests
- 2026-06-01: Code review patches — submit guard, title maxLength, validation toast, expanded tests

## Story Completion Status

- Status: **done** — all ACs satisfied; code review patches applied 2026-06-01
- Next: `create-story` 2.5 (Edit and delete open Quests)
