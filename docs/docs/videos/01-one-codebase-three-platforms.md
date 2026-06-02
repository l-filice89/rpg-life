# Video 1: One Codebase, Three Platforms

## Concept

A fast-paced 30-second motion graphic showing a single TypeScript file splitting into three platform outputs — web, mobile, and desktop — all sharing the same tRPC API call. The visual metaphor: one source of truth fractures into three screens, each rendering the same data identically.

## Remotion Prompt

Create a 30-second motion graphic at 1920x1080, 30fps.

**Scene 1 (0–5s): The Source**
A single glowing TypeScript code block fades in center-screen on a dark zinc-950 background. The code shows a tRPC API call: `trpc.projects.list.useQuery()`. Use a monospace font (Geist Mono). The code block has a subtle violet-500 border glow that pulses once. Title text "One Codebase" appears below in Geist Sans, white, 48px, with a spring animation (stiffness: 200, damping: 20).

**Scene 2 (5–15s): The Split**
The code block duplicates into three copies using a staggered spring animation — each copy slides outward: left, center, right. As they move, device frames morph around each:

- Left: browser window chrome (Next.js logo badge) labeled "Web"
- Center: phone frame (Expo logo badge) labeled "Mobile"
- Right: desktop app frame (Electron logo badge) labeled "Desktop"

Each frame renders a identical project list UI with cards showing project names, status badges, and timestamps. Use a sequential reveal — cards slide in one by one with 100ms stagger. Color scheme: zinc-900 cards, violet-500 accent for active items, emerald-500 for status badges.

**Scene 3 (15–25s): The Proof**
Camera zooms out to show all three screens side by side. A dotted line traces from each screen back to a central node labeled "Shared Types · Shared Auth · Shared Logic" with the rpg-life logo. Each connection line animates with a traveling dot (violet-500). Stats counter animates in below: "15 packages · 350+ tests · 100% type-safe".

**Scene 4 (25–30s): CTA**
All three screens scale down and slide left. Right side shows:

- "rpg-life" in bold 64px
- "Ship to every platform. From one repo." in 24px zinc-400
- GitHub icon + "github.com/corbanb/rpg-life" fades in last

**Transitions:** Use Remotion spring() for all movements. No hard cuts — everything flows.

**Color Palette:** zinc-950 bg, white text, violet-500 primary accent, emerald-500 secondary, zinc-800 cards.

**Audio cue:** Design for a tech-forward synth beat (add separately).

## Key Message

You don't need three codebases. rpg-life gives you web, mobile, and desktop from a single TypeScript monorepo — fully type-safe, fully shared.

## Skills to Use

- `typography` — title reveals, code block styling
- `spring-physics` — all animation easing
- `sequencing` — staggered card reveals, scene transitions
- `transitions` — scene-to-scene flow
