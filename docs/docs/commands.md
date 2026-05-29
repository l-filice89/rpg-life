# Commands Reference

All available commands in the rpg-life monorepo.

## Root Commands

These run via Turborepo across all workspaces.

| Command          | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `bun dev`        | Start all workspaces in dev mode (API :3002, web :3000, marketing :3001) |
| `bun build`      | Build all workspaces                                                     |
| `bun test`       | Run tests across all workspaces                                          |
| `bun type-check` | TypeScript type checking across all workspaces                           |
| `bun lint`       | ESLint across all workspaces                                             |
| `bun clean`      | Remove all build artifacts and node_modules                              |

## Database Commands

| Command           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `bun db:generate` | Generate a Drizzle migration from schema changes                     |
| `bun db:push`     | Push schema directly to dev database (no migration file)             |
| `bun db:migrate`  | Run pending migrations against production database                   |
| `bun db:seed`     | Seed database with test data                                         |
| `bun db:studio`   | Open Drizzle Studio (database GUI at `https://local.drizzle.studio`) |

### Database Workflow

**Development**: Use `bun db:push` for quick iteration — it syncs schema directly without migration files.

**Production**: Use `bun db:generate` to create a migration, then `bun db:migrate` to apply it.

```bash
# Typical dev workflow
# 1. Edit packages/database/schema.ts
# 2. Push to dev DB
bun db:push

# Production workflow
# 1. Edit packages/database/schema.ts
# 2. Generate migration
bun db:generate
# 3. Review migration in packages/database/migrations/
# 4. Apply
bun db:migrate
```

## Per-Workspace Commands

### API (`apps/api`)

| Command                        | Description                      |
| ------------------------------ | -------------------------------- |
| `cd apps/api && bun run dev`   | Start API server with hot reload |
| `cd apps/api && bun test`      | Run API tests (123 tests)        |
| `cd apps/api && bun run build` | Build API for production         |

### Web (`apps/web`)

| Command                              | Description                       |
| ------------------------------------ | --------------------------------- |
| `cd apps/web && bun run dev`         | Start Next.js dev server on :3000 |
| `cd apps/web && bun run build`       | Build for production              |
| `cd apps/web && bun run test:e2e`    | Run Playwright E2E tests          |
| `cd apps/web && bun run test:e2e:ui` | Playwright interactive UI mode    |

### Mobile (`apps/mobile`)

| Command                             | Description             |
| ----------------------------------- | ----------------------- |
| `cd apps/mobile && bun run dev`     | Start Expo dev server   |
| `cd apps/mobile && bun run ios`     | Run on iOS simulator    |
| `cd apps/mobile && bun run android` | Run on Android emulator |

### Desktop (`apps/desktop`)

| Command                              | Description                |
| ------------------------------------ | -------------------------- |
| `cd apps/desktop && bun run dev`     | Start Electron in dev mode |
| `cd apps/desktop && bun run build`   | Build Electron app         |
| `cd apps/desktop && bun run package` | Package for distribution   |

### Marketing (`apps/marketing`)

| Command                              | Description                   |
| ------------------------------------ | ----------------------------- |
| `cd apps/marketing && bun run dev`   | Start marketing site on :3001 |
| `cd apps/marketing && bun run build` | Build static site             |

## Turborepo Filters

Run commands for specific workspaces:

```bash
# Single workspace
bun turbo dev --filter=@rpg-life/api
bun turbo test --filter=@rpg-life/shared

# Multiple workspaces
bun turbo dev --filter=@rpg-life/api --filter=@rpg-life/web
```
