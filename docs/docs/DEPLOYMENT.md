# Deployment Guide

This guide covers deploying all rpg-life applications to production using Vercel (web), Railway (API, marketing, docs), EAS (mobile), and electron-builder (desktop).

**Total cost: $5/month** — Railway Trial plan for API/marketing/docs, Vercel free tier for web.

## Prerequisites

- A [Railway](https://railway.app) account (Trial plan: $5/mo with $5 credit)
- A [Vercel](https://vercel.com) account (free Hobby plan — web app only)
- A [Neon](https://neon.tech) account (free tier: 0.5 GB storage)
- A [GitHub](https://github.com) repository with this codebase
- (Optional) [Expo](https://expo.dev) account for mobile builds
- (Optional) [Upstash](https://upstash.com) account for Redis rate limiting

## 1. Neon Database Setup

1. Create a new Neon project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string (it looks like `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`)
3. Run migrations against production:

```bash
DATABASE_URL="your-production-connection-string" bun db:migrate
```

4. (Optional) Seed initial data:

```bash
DATABASE_URL="your-production-connection-string" bun db:seed
```

## 2. Railway Setup (API, Marketing, Docs)

Railway hosts the API (persistent Bun process), marketing site, and docs site. Railpack auto-detects Bun and Next.js — no Dockerfiles needed.

### Install Railway CLI

```bash
# macOS
brew install railway

# Or via npm
npm install -g @railway/cli

# Log in
railway login
```

### Create Project and Services

```bash
# Create a new Railway project
railway init

# Create three services
railway service create api
railway service create marketing
railway service create docs
```

### Configure Each Service

**API service** — set build and start commands, plus environment variables:

| Setting       | Value                                 |
| ------------- | ------------------------------------- |
| Build command | `bun install`                         |
| Start command | `cd apps/api && bun run src/index.ts` |
| Watch paths   | `apps/api/**`, `packages/**`          |

| Variable             | Value                                                             |
| -------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`       | Your Neon connection string                                       |
| `JWT_SECRET`         | `openssl rand -base64 48`                                         |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 48`                                         |
| `BETTER_AUTH_URL`    | Your production API URL (e.g., `https://api.yourdomain.com`)      |
| `ANTHROPIC_API_KEY`  | Your Claude API key                                               |
| `WEB_URL`            | Your production web URL (e.g., `https://app.yourdomain.com`)      |
| `MARKETING_URL`      | Your production marketing URL (e.g., `https://yourdomain.com`)    |
| `DOCS_URL`           | Your production docs URL (e.g., `https://docs.yourdomain.com`)    |
| `NODE_ENV`           | `production`                                                      |
| `PORT`               | `3002` (Railway sets `PORT` automatically, but explicit is safer) |

**Marketing service:**

| Setting       | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Build command | `bun install && cd apps/marketing && bun run build`        |
| Start command | `cd apps/marketing && npx next start --port ${PORT:-3001}` |
| Watch paths   | `apps/marketing/**`, `packages/**`                         |

**Docs service:**

| Setting       | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Build command | `bun install && cd apps/docs && bun run build`        |
| Start command | `cd apps/docs && npx next start --port ${PORT:-3003}` |
| Watch paths   | `apps/docs/**`, `packages/**`                         |

### Connect GitHub Repo

In the Railway dashboard, connect your GitHub repository to each service. Railway will auto-deploy on push to `main`.

## 3. Vercel Setup (Web Only)

Only the web app (`apps/web`) is deployed to Vercel.

### Link the Web App

```bash
# Install Vercel CLI (macOS)
brew install vercel-cli

# Link the web app
cd apps/web && vercel link
```

### Collect IDs

| Value                   | Where to find it                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`          | [vercel.com/account/tokens](https://vercel.com/account/tokens) — create a new token |
| `VERCEL_ORG_ID`         | Vercel dashboard > Settings > General > "Your ID"                                   |
| `VERCEL_PROJECT_ID_WEB` | `apps/web/.vercel/project.json` → `projectId`                                       |

### Set Environment Variables in Vercel

In the Vercel project, go to **Settings > Environment Variables** and add:

| Variable              | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Your production API URL (e.g., `https://api.yourdomain.com`) |

## 4. GitHub Actions Secrets

Go to your GitHub repo > **Settings > Secrets and variables > Actions** and add:

| Secret                  | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `VERCEL_TOKEN`          | Vercel personal access token (web deploys only) |
| `VERCEL_ORG_ID`         | Vercel team/org ID                              |
| `VERCEL_PROJECT_ID_WEB` | Vercel project ID for `apps/web`                |

Railway deploys are triggered automatically via GitHub integration — no Railway secrets needed in GitHub Actions.

### Optional Secrets

| Secret            | Description                            |
| ----------------- | -------------------------------------- |
| `EXPO_TOKEN`      | EAS token for mobile builds            |
| `NEON_API_KEY`    | Neon API key for CI branch previews    |
| `NEON_PROJECT_ID` | Neon project ID for CI branch previews |

## 5. Domain Configuration

### Recommended Domain Setup

| App       | Subdomain             | Platform |
| --------- | --------------------- | -------- |
| Marketing | `yourdomain.com`      | Railway  |
| Web       | `app.yourdomain.com`  | Vercel   |
| API       | `api.yourdomain.com`  | Railway  |
| Docs      | `docs.yourdomain.com` | Railway  |

**Vercel domains:** In the Vercel project for web, go to **Settings > Domains** and add your custom domain. Vercel handles SSL automatically.

**Railway domains:** In each Railway service, go to **Settings > Networking > Custom Domain** and add your domain. Railway provides SSL via Let's Encrypt. You can also generate a `*.up.railway.app` subdomain for testing.

## 6. How Deployments Work

### Production Deploys

Pushing to `main` triggers deployments across both platforms:

- `apps/web/**` changed → Vercel deploys Web to production
- `apps/api/**` changed → Railway deploys API to production
- `apps/marketing/**` changed → Railway deploys Marketing to production
- `apps/docs/**` changed → Railway deploys Docs to production
- `packages/**` changed → deploys all apps (shared code changed)

### Railway Deployments

Railway auto-deploys when it detects changes in the connected GitHub repo. If auto-deploy doesn't trigger (stale webhook), use the CLI:

```bash
# Redeploy a service (uses cached image)
railway redeploy --service api

# Fresh deploy from local code (bypasses cache)
railway up --service api
```

> **Note:** `railway redeploy` reuses the old build image. Use `railway up --service <name>` when you need a fresh build from local code.

### Preview Deploys

Vercel automatically creates preview deployments for the web app on pull requests. Railway does not create preview environments on the free/trial plan.

## 7. Mobile (Expo / EAS)

The mobile app uses [EAS Build](https://docs.expo.dev/build/introduction/) for building and [EAS Submit](https://docs.expo.dev/submit/introduction/) for app store submission.

### Setup

1. Install EAS CLI: `bun add -g eas-cli`
2. Log in: `eas login`
3. Configure in `apps/mobile-main/eas.json` (already done)

### Build

```bash
cd apps/mobile-main

# Development build (includes dev tools)
eas build --profile development --platform all

# Preview build (for TestFlight / internal testing)
eas build --profile preview --platform all

# Production build (for App Store / Play Store)
eas build --profile production --platform all
```

### CI Builds

The `deploy-mobile.yml` workflow triggers on push to `main` when `apps/mobile-main/**` changes. It requires the `EXPO_TOKEN` GitHub secret.

## 8. Desktop (Electron)

Desktop builds use `electron-builder` configured in `apps/desktop/electron-builder.yml`.

### Build Locally

```bash
cd apps/desktop

# Build for current platform
bun run build

# Build for specific platforms
bun run build:mac
bun run build:win
bun run build:linux
```

### CI Builds

The `deploy-desktop.yml` workflow creates GitHub Releases with platform-specific installers when `apps/desktop/**` changes on `main`.

## 9. Verification Checklist

After deploying, verify everything works:

```bash
# API health check
curl https://api.yourdomain.com/health

# OpenAPI spec
curl https://api.yourdomain.com/openapi.json

# API docs
open https://api.yourdomain.com/docs

# Web app
open https://app.yourdomain.com

# Marketing site
open https://yourdomain.com

# Developer docs
open https://docs.yourdomain.com
```

## 10. Scaling

| Service       | Current Tier                | Scaling Option                         |
| ------------- | --------------------------- | -------------------------------------- |
| Railway       | Trial ($5/mo)               | Pro ($20/mo) — more RAM, CPU, replicas |
| Vercel        | Hobby (100 GB bandwidth)    | Pro ($20/mo) for team features         |
| Neon          | 0.5 GB storage, autosuspend | Launch ($19/mo) for always-on compute  |
| EAS Build     | 30 builds/month             | Production plan ($99/mo)               |
| Upstash Redis | 10K commands/day            | Pay-as-you-go ($0.2/100K commands)     |

The API runs as a persistent Bun process on Railway. To scale, adjust Railway service replicas in the dashboard or CLI. No code changes needed.
