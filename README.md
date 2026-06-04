# rpg-life

Browser-first habit RPG built on a Bun + Next.js + tRPC monorepo.

## Prerequisites

- [Bun](https://bun.sh) `1.3+`
- [Docker Desktop / Docker Engine + Compose](https://docs.docker.com/compose/)
- [Resend](https://resend.com) account (required even in local dev for magic-link auth)

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
| `PORT` | Recommended | API process port inside container/runtime (`3002`) |
| `PORT_API` | Recommended | API port used by local dev scripts (`3002`) |
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
4. Seed skills catalog:
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
bun run smoke            # unit + integration tests
bun test --coverage      # with coverage report
cd apps/web && bunx playwright test  # E2E
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
- SQLite persists via bind mount at `./data/rpg-life.db` (`./data:/data`).
- Stop containers with `docker compose down` (data kept).
- Stop and remove named volumes: `docker compose down -v` (bind-mount data in `./data/` is **not** removed).
- To fully wipe local DB data: `docker compose down && rm -f ./data/rpg-life.db`

## Smoke Verification

Automated docker smoke:

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

docs/ai-integration-log.md  AI-assisted decision log
docs/success_criteria.md    MVP ship criteria
```

## Architecture Decisions

Planning and architecture artifacts live in `_bmad-output/planning-artifacts/`.
