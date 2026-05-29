# rpg-life

Browser-first habit RPG built on a Bun + Next.js + tRPC monorepo.

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Resend](https://resend.com) account for magic-link email (required even in local dev)

## Setup

```bash
cp .env.example .env.local
# Edit .env.local — set BETTER_AUTH_SECRET (32+ chars) and Resend keys
bun install
bun db:migrate
```

## Local development

```bash
bun dev
```

- Web: http://localhost:3000
- API: http://localhost:3002

Next.js rewrites proxy `/api/auth/*` and `/api/trpc/*` to the API service for same-origin cookies.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

SQLite persists in `./data/rpg-life.db`.

## Smoke verification

```bash
bun run smoke
curl http://localhost:3000/api/trpc/health
curl http://localhost:3002/health
```

## Project structure

```
apps/web     Next.js 15 App Router
apps/api     Bun + Hono + tRPC + better-auth
packages/db  Drizzle + SQLite migrations
packages/api tRPC router definitions
packages/auth better-auth + Resend magic link
packages/domain | validators | ui  scaffold shells for later stories
```

Planning artifacts live in `_bmad-output/`.
