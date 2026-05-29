# rpg-life — Executive Overview

## What It Is

rpg-life is a **production-ready, full-stack TypeScript monorepo boilerplate** for building multi-platform applications from a single codebase. It provides web, mobile, desktop, and API — all wired together with shared types, auth, database, and AI integration out of the box.

## Platform Coverage

| Platform      | Tech                          | Location           |
| ------------- | ----------------------------- | ------------------ |
| **API**       | Hono + tRPC v11 (Bun runtime) | `apps/api`         |
| **Web**       | Next.js 15 App Router         | `apps/web`         |
| **Mobile**    | Expo + React Native           | `apps/mobile-main` |
| **Desktop**   | Electron                      | `apps/desktop`     |
| **Marketing** | Next.js (static)              | `apps/marketing`   |
| **Docs**      | Fumadocs + OpenAPI/Scalar     | `apps/docs`        |

## Core Stack

- **Runtime**: Bun
- **Monorepo**: Bun workspaces + Turborepo
- **Database**: Neon (Postgres) + Drizzle ORM
- **Auth**: Better Auth (bearer tokens, session management)
- **AI**: Vercel AI SDK + Claude
- **Validation**: Zod (single source of truth for all types)
- **Styling**: Tailwind CSS v4

## Shared Packages

| Package                    | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `packages/shared`          | Types, validators, utils, UI components, hooks, API client |
| `packages/database`        | Drizzle schema, migrations, seed, DB client                |
| `packages/auth`            | Better Auth config, session management                     |
| `packages/ai-integrations` | AI provider configs, streaming helpers                     |

## Deployment

| Service   | Host    |
| --------- | ------- |
| Web       | Vercel  |
| API       | Railway |
| Marketing | Railway |
| Docs      | Railway |

All Railway services auto-deploy from GitHub on push to `main`.

## Extensibility

The `create-x4` CLI scaffolds new apps into the monorepo:

```bash
create-x4 add        # Add a new mobile or web app
```

## Project Status

All 16 PRDs are **complete**. The boilerplate is fully built and operational, covering: core API, auth, database, AI integration, multi-app support, OpenAPI docs, CI/CD, and deployment.

## Developer Tooling

- 9 Claude Code specialist agents (backend, frontend, database, testing, security, devops, docs, etc.)
- 25+ scaffolding skills (`/add-schema`, `/add-router`, `/add-table`, `/add-page`, etc.)
- PRD lifecycle management (`/new-prd`, `/implement-task`, `/check-prd`)
- Convention enforcement via ESLint boundaries + hookify rules
- Comprehensive test suite using Bun's built-in test runner
