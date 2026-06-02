# Video 2: The Agent Team — From Idea to Shipped PR

## Concept

A 45-second cinematic walkthrough of the 6-stage agent pipeline: Onboard → Scaffold → Capture → Plan → Build → Ship. Each stage is visualized as a node in a horizontal pipeline that lights up in sequence, with inner animations showing what happens at each step. The hero moment: a 5-agent team working in parallel during the Build stage.

## Remotion Prompt

Create a 45-second motion graphic at 1920x1080, 30fps.

**Scene 1 (0–8s): The Pipeline Appears**
Dark zinc-950 background. Six circles appear in a horizontal line, connected by thin zinc-700 lines. Each circle is labeled: Onboard, Scaffold, Capture, Plan, Build, Ship. They start dim (zinc-800 fill, zinc-600 border). Title above: "Your AI Development Team" in Geist Sans, 56px, white, fades in with spring animation. Subtitle: "6 stages. Zero busywork." in zinc-400, 24px.

**Scene 2 (8–14s): Onboard + Scaffold**
Circle 1 (Onboard) fills with blue-500 glow. Inside, small icons animate in: checkmarks next to "Bun ✓", "Git ✓", "Neon ✓", "Railway ✓". Spring bounce on each check.
Circle 2 (Scaffold) fills with blue-500 glow. A terminal window miniature appears showing `npx create-x4 my-app` with output lines streaming: "Creating project...", "Installing 15 packages...", "Done ✨". Connection line between 1→2 lights up with a traveling pulse.

**Scene 3 (14–20s): Capture + Plan**
Circle 3 (Capture) fills with yellow-500 glow. Sticky notes fly in from edges — "Add auth", "Payment flow", "Dashboard UI" — landing in a mini kanban board.
Circle 4 (Plan) fills with yellow-500 glow. The sticky notes transform into a structured PRD document outline with sections numbered 1–11. A "brainstorm → plan → PRD" label sequences in below.

**Scene 4 (20–35s): Build — The Hero Moment**
Circle 5 (Build) expands to fill 60% of the screen. Five agent avatars appear in a ring:

- Backend Agent (blue shield icon)
- Frontend Agent (purple component icon)
- Code Reviewer (orange magnifier icon)
- Test Runner (green checkmark icon)
- Performance Agent (red gauge icon)

Each agent has a name label and a status indicator. They activate in sequence (0.3s stagger), then all pulse simultaneously showing parallel work. Code snippets fly between agents — the Backend Agent passes a file to the Reviewer, who passes to the Test Runner, who shows a green "47/47 tests passing" badge.

A progress bar fills across the bottom: "Building feature: Payment Integration" with file counts ticking up.

**Scene 5 (35–42s): Ship**
Circle 6 (Ship) fills with emerald-500 glow. A miniature GitHub PR appears: title "feat: add payment integration", green "All checks passed" badge, merge button pulses. A Railway deployment indicator shows "Deploying..." → "Live ✓" with the URL appearing.

**Scene 6 (42–45s): CTA**
Pipeline shrinks to top of screen. Below:

- "x4 Agent Plugins" in 48px bold
- "Idea → Shipped. Orchestrated by AI." in 24px zinc-400
- "4 plugins · 25+ skills · 9 specialist agents"
- GitHub link fades in

**Color System:**

- Onboard/Scaffold: blue-500
- Capture/Plan: yellow-500
- Build: violet-500
- Ship: emerald-500
- Background: zinc-950
- Text: white / zinc-400

**Transitions:** Spring physics for all node activations. Traveling pulse dots along pipeline connections. Scale-up for Build expansion, scale-down for CTA.

## Key Message

x4 isn't just a boilerplate — it's an AI development team. Four Claude Code plugins coordinate specialist agents that take you from raw idea to merged PR.

## Skills to Use

- `spring-physics` — node activations, agent appearances
- `sequencing` — 6-stage progression, staggered reveals
- `transitions` — Build stage expansion/contraction
- `charts` — progress bar animation
- `messaging` — status indicators, notification badges
