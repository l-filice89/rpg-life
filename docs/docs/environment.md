# Environment Variables

Every environment variable used in rpg-life, with descriptions and where to get them.

## Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. Never commit `.env.local` — only `.env.example` is tracked.

## Required Variables

| Variable             | Description                               | Where to Get It                                                                                                                              |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon Postgres connection string           | [Neon Dashboard](https://console.neon.tech) > Project > Connection Details. Format: `postgresql://user:password@host/dbname?sslmode=require` |
| `JWT_SECRET`         | Secret for token signing (min 32 chars)   | Generate with `openssl rand -base64 32`                                                                                                      |
| `BETTER_AUTH_SECRET` | Better Auth session secret (min 32 chars) | Generate with `openssl rand -base64 32`                                                                                                      |
| `ANTHROPIC_API_KEY`  | Claude API key for AI features            | [Anthropic Console](https://console.anthropic.com) > API Keys. Starts with `sk-`                                                             |

## Optional Variables

| Variable          | Description                        | Default                 | Where to Get It                        |
| ----------------- | ---------------------------------- | ----------------------- | -------------------------------------- |
| `PORT`            | API server port                    | `3002`                  | Set if port 3002 is in use             |
| `BETTER_AUTH_URL` | Better Auth base URL               | `http://localhost:3002` | Change for production                  |
| `WEB_URL`         | Web app URL (used for CORS)        | `http://localhost:3000` | Production web URL                     |
| `MARKETING_URL`   | Marketing site URL (used for CORS) | `http://localhost:3001` | Production marketing URL               |
| `NODE_ENV`        | Environment mode                   | `development`           | `development`, `production`, or `test` |
| `APP_VERSION`     | App version string                 | None                    | Set in CI/deploy pipeline              |

## AI & External Services (Optional)

| Variable                   | Description                                   | Where to Get It                                                   |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `OPENAI_API_KEY`           | OpenAI API key (alternative AI provider)      | [OpenAI Platform](https://platform.openai.com) > API Keys         |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis URL for rate limiting + caching | [Upstash Console](https://console.upstash.com) > Redis > REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token                      | Same as above                                                     |

**Note**: Rate limiting and caching work without Redis — they fail open (all requests pass through). Add Redis for production use.

## OAuth Providers (Optional)

| Variable               | Description                | Where to Get It                                                                          |
| ---------------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app client ID | [GitHub Developer Settings](https://github.com/settings/developers) > OAuth Apps         |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret    | Same as above                                                                            |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same as above                                                                            |

## Validation

Environment variables are validated at startup by `apps/api/src/lib/env.ts` using Zod. If a required variable is missing or invalid, the server will exit with an error message listing the specific issue.

## Per-App Environment

Some apps have their own `.env.example`:

| App              | File           | Key Variables         |
| ---------------- | -------------- | --------------------- |
| `apps/api`       | `.env.example` | All API variables     |
| `apps/web`       | `.env.example` | `NEXT_PUBLIC_API_URL` |
| `apps/mobile`    | `.env.example` | `EXPO_PUBLIC_API_URL` |
| `apps/desktop`   | `.env.example` | API URL config        |
| `apps/marketing` | `.env.example` | Public site config    |
