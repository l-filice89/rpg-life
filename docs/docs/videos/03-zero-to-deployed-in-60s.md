# Video 3: Zero to Deployed in 60 Seconds

## Concept

A 60-second screen-recording-style animation showing the full journey from empty terminal to a live deployed app. The visual style mimics a real terminal but with cinematic polish — commands type themselves, output streams, and UI previews pop in as picture-in-picture. The clock is always visible, counting real seconds.

## Remotion Prompt

Create a 60-second motion graphic at 1920x1080, 30fps.

**Persistent Element: Clock**
Top-right corner: a circular timer counting from 0:00 to 1:00 in real time. White text, zinc-800 circle border, violet-500 progress arc fills clockwise. Geist Mono font, 20px.

**Scene 1 (0–10s): Scaffold**
Full-screen terminal (zinc-950 bg, zinc-300 text, Geist Mono). A cursor blinks, then types:

```
$ npx create-x4 my-saas --preset saas
```

Output streams in rapidly (typewriter effect, 40 chars/sec):

```
◆ Creating my-saas with SaaS preset...
│ ✓ Scaffolding monorepo (15 packages)
│ ✓ Installing dependencies
│ ✓ Configuring TypeScript paths
│ ✓ Setting up Drizzle + Neon
│ ✓ Wiring Better Auth
│ ✓ Adding AI integrations
│ ✓ Generating CI workflows
└ Done in 8.2s
```

Each checkmark appears with a subtle green flash.

**Scene 2 (10–20s): Dev Server**
Terminal types: `$ cd my-saas && bun turbo dev`
Output shows 4 services starting simultaneously in colored text:

```
api    → http://localhost:3002 ✓
web    → http://localhost:3000 ✓
mobile → Expo DevTools ✓
docs   → http://localhost:3003 ✓
```

A browser window slides in from the right (picture-in-picture, 40% screen) showing a landing page with auth buttons, a dashboard skeleton, and a chat interface. The terminal shrinks to 55% left.

**Scene 3 (20–35s): Add a Feature**
Terminal types: `$ claude "add a projects CRUD feature"`
Agent output streams — this is the cinematic moment:

```
⠋ Planning... (Backend Agent)
  → Creating schema: packages/shared/types/project.ts
  → Creating table: packages/database/schema.ts
  → Creating router: apps/api/src/routers/projects.ts
  → Creating page: apps/web/src/app/projects/page.tsx
  → Running tests: 12/12 passing ✓
⠋ Reviewing... (Code Reviewer)
  → No issues found ✓
```

The browser PiP updates in real-time: a "/projects" page appears with a data table, create button, and edit forms. Cards with project names populate.

**Scene 4 (35–48s): Deploy**
Terminal types: `$ git push origin main`
Split view: left terminal shows git output, right shows two deployment panels:

- **Railway**: API deploying... → Live at `api.my-saas.up.railway.app` ✓
- **Vercel**: Web deploying... → Live at `my-saas.vercel.app` ✓

Both show green status badges with spring animation. The browser PiP updates its URL bar to the production domain.

**Scene 5 (48–55s): The Reveal**
Terminal fades out. Three device frames slide in (same layout as Video 1):

- Laptop showing the web dashboard
- Phone showing the mobile app (same data)
- Browser tab showing the API docs at `/docs`

Text above: "Full-stack. Multi-platform. Production-ready." in 36px.
Below the devices: a tech stack ribbon scrolls horizontally showing logos: TypeScript, React, Next.js, Expo, Hono, tRPC, Drizzle, Neon, Better Auth, Vercel AI SDK, Bun, Turborepo.

**Scene 6 (55–60s): CTA**
Clock hits 1:00 and pulses violet. Everything slides to background with blur.
Center: "60 seconds. That's it." in 64px bold.
Below: "rpg-life — the last boilerplate you'll need" in 24px zinc-400.
GitHub link and star count badge fade in.

**Typography:** Geist Mono for all terminal text, Geist Sans for overlay text.
**Color Palette:** zinc-950 terminal bg, zinc-300 terminal text, violet-500 accents, emerald-500 for success states, blue-500 for info.

## Key Message

From zero to a deployed, full-stack, multi-platform app in 60 seconds. Not a toy — production-grade with auth, AI, type safety, and CI/CD.

## Skills to Use

- `typography` — terminal typewriter effect, code styling
- `sequencing` — timed scenes synced to the clock
- `transitions` — PiP slides, terminal↔browser transitions
- `spring-physics` — badge bounces, device frame entrances
- `messaging` — deployment status notifications
