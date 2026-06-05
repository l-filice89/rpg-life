# rpg-life

[![CI](https://github.com/l-filice89/rpg-life/actions/workflows/ci.yml/badge.svg)](https://github.com/l-filice89/rpg-life/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Browser-first habit RPG built on a Bun + Next.js + Hono + tRPC monorepo.

rpg-life turns your task list into an RPG. Each **Quest** you complete trains one or more **Skills** (Concentration, Resolve, Craft, and more) and earns XP toward your **Hero level**. **My Profile** shows where your effort went — skill levels, XP bars, and Focus balance — so progress is legible, not buried in a log. Built for daily use by people who want game-like feedback on real work; a motivation tool, not a tracker you forget after a week.

## Prerequisites

- [Bun](https://bun.sh) `1.3+`
- [Docker Desktop / Docker Engine + Compose](https://docs.docker.com/compose/)
- [Resend](https://resend.com) account (required even in local dev for magic-link auth)

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router (RSC-first), React 19, shadcn/ui + Tailwind CSS v4 |
| API | Hono + tRPC v11 on Bun |
| Auth | better-auth magic link + Resend |
| Database | SQLite via Drizzle ORM |
| State | Zustand (client-side only) |
| Testing | bun test, MSW, Playwright |

## Environment Variables

Copy `.env.example` to `.env.local` and fill the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path for API runtime (`file:../../data/rpg-life.db` local, `file:/data/rpg-life.db` docker) |
| `BETTER_AUTH_SECRET` | Yes | 32+ char random secret for signing auth tokens |
| `BETTER_AUTH_URL` | Yes | Public app URL for auth cookie/link generation (`http://localhost:3000`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | Client mirror of `BETTER_AUTH_URL` (optional — auth client can derive URL from window origin) |
| `RESEND_API_KEY` | Yes | Resend API key used for magic-link emails |
| `EMAIL_FROM` | Yes | Verified sender email in Resend (`onboarding@resend.dev` for sandbox) |
| `API_URL` | Yes | API base URL used by web server-side calls (`http://localhost:3002` local, `http://api:3002` in docker network) |
| `WEB_URL` | Yes | Public web origin used by API CORS/auth redirects (`http://localhost:3000`) |
| `PORT` | Recommended | Port injected by docker-compose into the API container (takes precedence over `PORT_API`; defaults to `3002`) |
| `PORT_API` | Recommended | API port for local dev — used when `PORT` is not set (defaults to `3002`) |
| `PORT_WEB` | Recommended | Web dev port (`3000`) |
| `NODE_ENV` | Recommended | Runtime mode (`development` locally, `production` in containers) |

## Local Development

1. Copy env and fill required values:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run DB migrations:
   ```bash
   bun db:migrate
   ```
4. Seed skills catalog (optional — the API seeds automatically on startup):
   ```bash
   bun db:seed
   ```
5. Start both web + api:
   ```bash
   bun dev
   ```

Service URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:3002`

Next.js rewrites proxy `/api/auth/*` and `/api/trpc/*` to the API service for same-origin cookies.

## Testing

```bash
bun run smoke                                        # unit + integration tests (fast, no browser)
bun test --coverage                                  # with HTML coverage report in coverage/
cd apps/web && bunx playwright install --with-deps   # first-time Playwright browser setup
cd apps/web && bunx playwright test                  # E2E (requires services running — see Docker)
cd apps/web && bunx playwright test --ui             # E2E interactive UI
```

## Docker

From repository root:

```bash
cp .env.example .env
# fill BETTER_AUTH_SECRET + Resend values in .env
docker compose up --build
```

Endpoints after startup:
- Web: `http://localhost:3000`
- API health: `http://localhost:3002/health`
- tRPC health via web proxy: `http://localhost:3000/api/trpc/health`

Notes:
- SQLite is persisted via a bind mount at `./data/rpg-life.db`. Your database file is **always safe** at that path — `docker compose down` and `docker compose down -v` do not remove it (those commands only affect named Docker volumes, not bind-mounted files on your host).
- To fully wipe local DB data: `docker compose down && rm -f ./data/rpg-life.db`

## Smoke Verification

Run the automated Docker smoke test:

```bash
bash scripts/smoke-docker.sh
```

Manual checks:

```bash
curl http://localhost:3002/health
curl http://localhost:3000/api/trpc/health
curl -sI http://localhost:3000/ | grep -i "location\|HTTP/"
```

## Project Structure

```text
apps/web        Next.js 15 App Router frontend (RSC-first)
apps/api        Bun + Hono + tRPC + better-auth API

packages/api         tRPC router definitions + shared API contracts
packages/auth        better-auth configuration + Resend integration
packages/db          Drizzle ORM + SQLite schema/migrations + seed logic
packages/domain      pure progression logic (XP, freshness, Focus, levels)
packages/ui          shadcn/ui components + Crystal Path design tokens
packages/validators  shared Zod schemas for API/forms

docs/ai-integration-log.md  key architecture and implementation decisions
```

## Architecture Decisions

Key decisions (SQLite over Postgres, tRPC v11, RSC-first data loading, domain isolation, E2E auth strategy, etc.) are documented in [`docs/ai-integration-log.md`](docs/ai-integration-log.md).

Planning and design artifacts (PRD, epics, UX designs, architecture doc) live in `_bmad-output/planning-artifacts/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch strategy, commit conventions, and the PR checklist.

## License

MIT — see [LICENSE](./LICENSE).
