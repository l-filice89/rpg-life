# Video 4: The Type Safety Chain

## Concept

A 30-second visual explainer showing how a single Zod schema change propagates type safety from database → API → web → mobile → desktop. The metaphor: a chain of dominoes, where changing one schema tips a cascade of type-checks across every layer — and they all stay in sync. The emotional hook: "Change one thing. Break nothing."

## Remotion Prompt

Create a 30-second motion graphic at 1920x1080, 30fps.

**Scene 1 (0–8s): The Schema**
Dark zinc-950 background. A code block fades in center-screen showing a Zod schema:

```typescript
const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(['active', 'archived']),
});
```

The cursor blinks on the `status` line, then types a new value into the enum: `"paused"`. The line highlights violet-500 briefly. A ripple effect (concentric rings) emanates from the change point.

Title: "One schema change." in Geist Sans, 32px, appears above with spring animation.

**Scene 2 (8–20s): The Cascade**
Five horizontal layers appear stacked vertically, connected by vertical lines. Each layer is a card (zinc-900 bg, rounded):

1. **Zod Schema** (violet-500 accent) — the source, already glowing
2. **Drizzle Table** (blue-500 accent) — code: `status: text("status").$type<ProjectStatus>()`
3. **tRPC Router** (emerald-500 accent) — code: `input: ProjectSchema` → return type auto-inferred
4. **Next.js Page** (cyan-500 accent) — code: `const { data } = trpc.projects.list.useQuery()` — hover shows `status: "active" | "archived" | "paused"`
5. **Expo Screen** (orange-500 accent) — same code, same inferred type

Each layer activates in sequence (0.5s stagger) — the accent border lights up, a checkmark appears, and the connecting line pulses downward like electricity flowing through a circuit. The new `"paused"` value appears highlighted in each layer's code snippet.

Subtitle cascades in as layers activate: "Database. API. Web. Mobile. All updated. Zero codegen."

**Scene 3 (20–27s): The Counter-Example**
A split-screen wipe from right. Left side (the x4 chain, green tint, labeled "With x4"): all five layers connected, all green checks.

Right side (red tint, labeled "Without"): same five layers but the connections are broken red dashes. Red X marks on layers 3, 4, 5. A `TypeError: Property 'paused' does not exist` error message floats in with a shake animation.

Text: "Type errors at build time, not at 3 AM." in 28px.

**Scene 4 (27–30s): CTA**
Both panels slide out. Center:

- "End-to-end type safety." in 48px bold
- "Zod → Drizzle → tRPC → React — one source of truth." in 20px zinc-400
- rpg-life logo + GitHub link

**Animation Style:** Clean, technical, minimal. The cascade should feel like electricity flowing through a circuit board. Use spring physics for card activations and traveling dot animations for the connection lines.

**Color Palette:** zinc-950 bg, white text. Each layer has its own accent: violet (schema), blue (database), emerald (API), cyan (web), orange (mobile).

## Key Message

Type safety isn't a feature — it's the foundation. One Zod schema is the single source of truth from database to UI across every platform. Change it once, and TypeScript catches every consumer.

## Skills to Use

- `typography` — code blocks, syntax highlighting effect
- `sequencing` — layer-by-layer cascade timing
- `spring-physics` — card activations, checkmark bounces
- `transitions` — split-screen comparison wipe
- `messaging` — error message shake animation
