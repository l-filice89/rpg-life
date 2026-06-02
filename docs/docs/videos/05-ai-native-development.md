# Video 5: AI-Native Development — Build With Your Agent Team

## Concept

A 40-second video showing the conversational development loop: a developer describes what they want in natural language, and the x4 agent team builds it — brainstorming, planning, coding, testing, and shipping. The visual style: a chat interface on the left, a live code/app preview on the right that updates as agents work. The emotional hook: "Describe it. Watch it build."

## Remotion Prompt

Create a 40-second motion graphic at 1920x1080, 30fps.

**Layout:** Split screen throughout. Left 45%: dark chat interface (zinc-950). Right 55%: live preview area (zinc-900).

**Scene 1 (0–8s): The Prompt**
Left panel: A chat interface with a text input at the bottom. The user's message types in:

> "I need a dashboard that shows my team's projects with status filters, a search bar, and the ability to create new projects with a form."

The message bubble appears with a spring animation (zinc-800 bg, white text, rounded-2xl). A small avatar labeled "You" sits left of the bubble.

Right panel: Empty state — just a faint grid pattern and text "Preview" in zinc-700.

**Scene 2 (8–16s): Brainstorm + Plan**
Left panel: Agent responses stream in sequentially:

**Brainstorm Agent** (purple avatar, sparkle icon):

> "Breaking this down: filterable data table, search with debounce, create form with validation, status enum filter. Let me plan the architecture."

**Plan Agent** (blue avatar, blueprint icon):

> "Implementation plan:
>
> 1. ProjectSchema + ProjectStatus enum (Zod)
> 2. projects table (Drizzle)
> 3. projects.list / projects.create (tRPC)
> 4. /dashboard page with filters (Next.js)
> 5. Tests for router + schema"

Each message bubble slides in with stagger. Progress indicator shows "Planning..." with an animated ellipsis.

Right panel: A wireframe sketch fades in — boxes and lines showing the dashboard layout (header, search bar, filter tabs, card grid, floating action button). Drawn in zinc-600 strokes with a hand-drawn/sketch feel.

**Scene 3 (16–30s): The Build — Agents Working**
Left panel: Agent work streams appear as compact status cards:

**Backend Agent** (blue shield):

```
✓ Created ProjectSchema (packages/shared/)
✓ Created projects table (packages/database/)
✓ Created projects router (apps/api/)
  → list, create, update, delete procedures
```

**Frontend Agent** (purple component):

```
✓ Created /dashboard page
✓ Added ProjectCard component
✓ Added StatusFilter + SearchBar
✓ Added CreateProjectSheet (form)
```

**Test Runner** (green check):

```
✓ 23/23 tests passing
  → 8 router tests, 6 schema tests, 9 component tests
```

Each block slides in with 1s gaps. Checkmarks animate with spring bounce.

Right panel: The wireframe progressively fills in with real UI. This is the hero animation — timed to match the agent output:

1. (16s) Navigation bar renders with logo and user avatar
2. (19s) Search bar and filter tabs appear ("All", "Active", "Archived")
3. (22s) Project cards populate in a grid — 6 cards with titles, status badges (emerald for active, zinc for archived), dates, and member avatars
4. (26s) A floating "+" button appears bottom-right, click animation triggers a slide-over form with fields: Name, Description, Status dropdown, Submit button
5. (28s) The "Active" filter tab gets clicked — cards filter with a layout animation, 2 archived cards fade out

The wireframe-to-real-UI transition should feel like watching a Polaroid develop.

**Scene 4 (30–37s): Ship It**
Left panel: One final message:

**Ship Agent** (emerald rocket):

> "Branch `feat/dashboard` created. PR #42 opened. All CI checks passing. Ready to merge."

A GitHub PR card appears inline: title, green merge badge, "3 files changed, +247 lines".

Right panel: The preview URL bar changes from `localhost:3000` to `my-app.vercel.app/dashboard`. A deployment progress bar fills, then a confetti particle burst. The final dashboard is fully rendered and interactive-looking.

**Scene 5 (37–40s): CTA**
Both panels slide apart. Center:

- "Describe it. Watch it build." in 56px bold, white
- "rpg-life + Claude Code Agent Plugins" in 24px zinc-400
- "25+ skills · 9 agents · Your entire dev workflow, automated." in 20px zinc-500
- GitHub links for both repos fade in with stagger

**Typography:** Geist Sans for all UI text. Geist Mono for code snippets in agent messages. Chat bubbles use 16px, code blocks use 14px.

**Color Palette:**

- Chat bg: zinc-950
- User bubble: zinc-800
- Agent bubbles: zinc-900 with left accent border matching agent color
- Preview bg: zinc-900
- UI preview: zinc-800 cards, violet-500 primary buttons, emerald-500 status
- CTA: white text on zinc-950

**Animation Details:**

- Chat messages: slide-up + fade-in with spring (stiffness: 180, damping: 22)
- Preview UI elements: scale-from-zero with spring (stiffness: 200, damping: 25)
- Filter transition: layout animation with 300ms duration
- Confetti: 30 particles, random colors (violet, emerald, blue, yellow), gravity fall

## Key Message

This isn't autocomplete — it's an AI development team. Describe your feature in plain English, and x4's agent plugins brainstorm, plan, build, test, and ship it. You stay in control, but the busywork disappears.

## Skills to Use

- `typography` — chat messages, code snippets
- `spring-physics` — all element entrances, confetti
- `sequencing` — tightly timed agent→preview sync
- `transitions` — wireframe-to-UI "developing" effect
- `messaging` — chat bubbles, status cards, notification badges
- `charts` — deployment progress bar
