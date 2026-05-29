# Getting Started

Step-by-step checklist to go from `git clone` to a running dev environment.

## Week 1: Initial Setup

### Prerequisites

- [ ] Install [Bun](https://bun.sh) >= 1.1 (`curl -fsSL https://bun.sh/install | bash`)
- [ ] Install [Node.js](https://nodejs.org) >= 20 (needed for Expo and Electron)
- [ ] Install Git
- [ ] Create a [Neon](https://neon.tech) account and project (free tier works)
- [ ] Get an [Anthropic API key](https://console.anthropic.com) (for AI features)

### Clone and Install

- [ ] Clone the repository: `git clone <repo-url> my-project && cd my-project`
- [ ] Install dependencies: `bun install`
- [ ] Verify installation: `bun turbo type-check` (should show 13 tasks successful)

### Environment Configuration

- [ ] Copy the example env file: `cp .env.example .env.local`
- [ ] Set `DATABASE_URL` to your Neon connection string (find in Neon dashboard > Connection Details)
- [ ] Set `JWT_SECRET` to a random 32+ character string
- [ ] Set `BETTER_AUTH_SECRET` to a random 32+ character string
- [ ] Set `ANTHROPIC_API_KEY` to your Claude API key (starts with `sk-`)
- [ ] (Optional) Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for rate limiting
- [ ] See [docs/environment.md](environment.md) for the full variable reference

### Database Setup

- [ ] Push the schema to your Neon database: `bun db:push`
- [ ] Seed with test data: `bun db:seed`
- [ ] (Optional) Open Drizzle Studio to inspect: `bun db:studio`

### Start Development

- [ ] Start all workspaces: `bun dev`
- [ ] Verify API: open `http://localhost:3002/health` (should return `{"status":"ok"}`)
- [ ] Verify web: open `http://localhost:3000`
- [ ] Verify marketing: open `http://localhost:3001`

### Run Tests

- [ ] Run the full test suite: `bun test` (should show 351+ tests passing)
- [ ] Run type checking: `bun type-check`
- [ ] Run linting: `bun lint`

## Week 2: Deeper Understanding

### Explore the Architecture

- [ ] Read `CLAUDE.md` for the full project context and conventions
- [ ] Read `CONTRIBUTING.md` for the development workflow
- [ ] Browse the workspace structure in `apps/` and `packages/`
- [ ] Understand the dependency boundaries (see `CLAUDE.md` > Dependency Boundaries)

### Try Common Tasks

- [ ] Add a Zod schema in `packages/shared/types/` and infer a type
- [ ] Add a tRPC procedure to an existing router in `apps/api/src/routers/`
- [ ] Write a test using the `createCaller` + `createTestContext` pattern
- [ ] Create a new page in `apps/web/src/app/`

### Mobile and Desktop (Optional)

- [ ] **Mobile**: `cd apps/mobile && bun run dev` (requires Expo Go app on phone)
- [ ] **Desktop**: `cd apps/desktop && bun run dev` (opens Electron window)

## Ongoing

### Daily Workflow

1. Pull latest: `git pull`
2. Install if deps changed: `bun install`
3. Start dev: `bun dev`
4. Make changes
5. Run checks: `bun type-check && bun test`
6. Commit and push

### When Adding Features

1. Define types/schemas in `packages/shared/`
2. Add database tables in `packages/database/schema.ts` if needed
3. Add tRPC router in `apps/api/src/routers/`
4. Add UI in `apps/web/`, `apps/mobile/`, or `apps/desktop/`
5. Write tests alongside code
6. Run `bun test` to verify
