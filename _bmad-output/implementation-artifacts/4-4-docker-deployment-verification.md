---
baseline_commit: c664fe0
---

# Story 4.4: Docker Deployment Verification

Status: done

## Story

As a **builder**,
I want the full app to run with a single Docker command,
So that deployment is reproducible for local dev and VPS hosting.

## Acceptance Criteria

1. **Given** a clean clone with `.env` configured from `.env.example` **When** `docker compose up` is run **Then** web and api services start, SQLite persists in `./data`, and auth + Quest Board are reachable (SC4, NFR11).

2. **And** README documents the docker-compose workflow and required env vars.

3. **And** smoke verification steps are documented for manual or scripted check.

4. **And** `bun run type-check` remains green after all changes.

## Tasks / Subtasks

- [x] **Task 1: Audit and verify `docker-compose.yml`** (AC: #1)
  - [x] Read current `docker-compose.yml` — verify `api` and `web` services, `./data:/data` volume mount, port bindings (3000/3002), env var pass-through
  - [x] Run `docker compose build` (or `docker compose up --build`) locally and confirm both images build without errors
  - [x] Verify api starts: `curl http://localhost:3002/health` returns `{ status: 'ok' }`
  - [x] Verify web starts: `curl http://localhost:3000` returns HTML (200)
  - [x] Verify SQLite persists: restart compose (`docker compose down && docker compose up`) and confirm `./data/rpg-life.db` survives
  - [x] Verify schema migrations run on api startup (check api logs for migration output)

- [x] **Task 2: Verify api health endpoint exists** (AC: #1, #3)
  - [x] Read `apps/api/src/app.ts` — confirm `GET /health` returns `{ status: 'ok' }`
  - [x] If missing: add `app.get('/health', (c) => c.json({ status: 'ok' }))` before tRPC mount
  - [x] Also verify Next.js rewrite proxy passes `GET /api/trpc/health` through to api

- [x] **Task 3: Verify `.env.example` completeness** (AC: #2)
  - [x] Read `.env.example` at repo root
  - [x] Required vars per architecture (confirm all present):
    - `DATABASE_URL` (e.g., `file:/data/rpg-life.db`)
    - `BETTER_AUTH_SECRET` (32+ char string)
    - `BETTER_AUTH_URL` (e.g., `http://localhost:3000`)
    - `RESEND_API_KEY` (Resend API key)
    - `EMAIL_FROM` (e.g., `onboarding@resend.dev`)
    - `API_URL` (e.g., `http://localhost:3002` — used by web for SSR)
    - `WEB_URL` (e.g., `http://localhost:3000` — used by api for CORS/cookie scope)
  - [x] Add any missing vars with comments explaining their purpose
  - [x] Ensure `.env.example` has no real secrets (all placeholder values)

- [x] **Task 4: Smoke verification script** (AC: #3)
  - [x] Create `scripts/smoke-docker.sh` — simple bash script that:
    1. `docker compose up -d --build`
    2. Waits for services (poll health endpoints with retry)
    3. Runs `curl` checks for key endpoints
    4. Reports pass/fail
    5. `docker compose down` cleanup
  - [x] Script: verify `/health` (api), `/` → sign-in redirect (web), `/api/trpc/health` (proxy)
  - [x] Make executable: `chmod +x scripts/smoke-docker.sh`
  - [x] Document in README how to run: `bash scripts/smoke-docker.sh`

- [x] **Task 5: Verify API Dockerfile correctness** (AC: #1)
  - [x] Read `apps/api/Dockerfile` — multi-stage build already exists
  - [x] Verify `ENTRYPOINT` or `CMD` correctly starts `apps/api/src/start.ts` via Bun
  - [x] Confirm migration runs on startup (check `apps/api/src/start.ts` for migration call)
  - [x] Verify no hard-coded paths that break in container context

- [x] **Task 6: Verify web Dockerfile correctness** (AC: #1)
  - [x] Read `apps/web/Dockerfile` — multi-stage Next.js build exists
  - [x] Verify `API_URL` build arg is correctly baked in for SSR rewrites
  - [x] Confirm Next.js standalone output is used (if applicable) or standard `next start`
  - [x] Verify `PORT` env var is respected

- [x] **Task 7: Update README docker section** (AC: #2, #3)
  - [x] README `apps/web/README.md` already has partial Docker section — enhance with:
    - Prerequisites (Docker Desktop or Docker Engine + Compose plugin)
    - Full env setup command sequence
    - `docker compose up --build` command
    - Service URLs (web :3000, api :3002)
    - Smoke verification commands
    - Stopping: `docker compose down` (data persists), `docker compose down -v` (wipe data)
  - [x] This README update is minimal; comprehensive README work is Story 4.5

### Review Findings

- [x] [Review][Patch] Referenced smoke script deliverable is missing [`scripts/smoke-docker.sh`]
- [x] [Review][Patch] Referenced docker verification test is missing [`apps/api/tests/docker-deployment-verification.test.ts`]
- [x] [Review][Patch] Docker cleanup note is inaccurate for bind-mounted DB data [`apps/web/README.md:67`]
- [x] [Review][Patch] Docker commands need explicit repo-root execution context [`apps/web/README.md:32`]

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `docker-compose.yml` | **Verify** — api + web services, volume mount |
| `apps/api/Dockerfile` | **Verify** — multi-stage build exists |
| `apps/web/Dockerfile` | **Verify** — multi-stage Next.js build exists |
| `README.md` (root) | **Verify** — has Docker section; Story 4.5 handles full README |
| `.env.example` | **Verify/Update** — ensure all vars present |
| `scripts/smoke-docker.sh` | **Create** — new verification script |

[Source: `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `README.md`]

### Current `docker-compose.yml` Review

From existing file:
```yaml
services:
  api:
    build: { context: ., dockerfile: apps/api/Dockerfile }
    ports: ['3002:3002']
    environment: [DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, EMAIL_FROM, WEB_URL, PORT=3002]
    volumes: ['./data:/data']
  web:
    build: { context: ., dockerfile: apps/web/Dockerfile, args: { API_URL: http://api:3002 } }
    ports: ['3000:3000']
    environment: [API_URL=http://api:3002, PORT_WEB=3000]
    depends_on: [api]
```

Observations:
- `API_URL` is baked at build time via `ARG` — correct for Next.js rewrites in standalone mode
- Internal networking: web → api uses `http://api:3002` (docker internal DNS)
- External: clients reach web on `http://localhost:3000`
- `BETTER_AUTH_URL` should be the **public** URL (e.g., `http://localhost:3000`) for cookie scoping
- `WEB_URL` on api — verify CORS whitelist uses this

[Source: `docker-compose.yml`]

### API Startup Sequence (verify in `start.ts`)

Expected startup flow:
1. Connect to SQLite at `DATABASE_URL`
2. Run Drizzle migrations (`migrate()`)
3. Seed skills catalog (idempotent)
4. Start Hono HTTP server on `PORT`

Check `apps/api/src/start.ts` confirms this order. If migrations don't run automatically on compose start, the auth flow will fail (tables missing).

[Source: `apps/api/src/start.ts`]

### Smoke Verification Script Outline

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Starting services..."
docker compose up -d --build

echo "Waiting for API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
    echo "API ready"
    break
  fi
  echo "  Waiting ($i/30)..."
  sleep 3
done

echo "Waiting for Web..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "Web ready"
    break
  fi
  echo "  Waiting ($i/30)..."
  sleep 3
done

echo "Running smoke checks..."
API_HEALTH=$(curl -s http://localhost:3002/health)
echo "API /health: $API_HEALTH"

WEB_REDIRECT=$(curl -sI http://localhost:3000/ | grep -i location)
echo "Web / redirect: $WEB_REDIRECT"

TRPC_PROXY=$(curl -s http://localhost:3000/api/trpc/health)
echo "tRPC proxy: $TRPC_PROXY"

echo "All smoke checks passed."
echo "Stopping services..."
docker compose down
```

### Env Var Reference (Complete)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite path inside container | `file:/data/rpg-life.db` |
| `BETTER_AUTH_SECRET` | Auth signing secret (32+ chars) | `change-me-32-plus-chars-secret-key` |
| `BETTER_AUTH_URL` | Public URL for auth cookie scoping | `http://localhost:3000` |
| `RESEND_API_KEY` | Resend API key for magic links | `re_xxxxx` |
| `EMAIL_FROM` | From address for magic link emails | `onboarding@resend.dev` |
| `API_URL` | API base URL (used by web for SSR) | `http://localhost:3002` |
| `WEB_URL` | Web base URL (used by api for CORS) | `http://localhost:3000` |

**Gotcha:** In docker-compose, `API_URL` for the web service should be `http://api:3002` (internal docker DNS), not `http://localhost:3002`. This is correctly handled via build arg in `docker-compose.yml`.

[Source: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`, architecture.md env vars section]

### Anti-Patterns (Do Not)

- ❌ Do NOT commit real secrets to `.env.example` — placeholder values only
- ❌ Do NOT use `docker compose --env-file .env.local` as the only documented path — `.env` (default) should also work
- ❌ Do NOT assume migrations auto-run if `start.ts` doesn't call them — verify explicitly
- ❌ Do NOT use `localhost` as `API_URL` inside compose network — must use service name `api`

### Project Structure

```
docker-compose.yml              # VERIFY — no changes expected
apps/api/Dockerfile             # VERIFY — add health endpoint if missing
apps/api/src/app.ts             # UPDATE if needed — add GET /health
apps/api/src/start.ts           # VERIFY — migration runs on startup
apps/web/Dockerfile             # VERIFY — no changes expected
.env.example                    # UPDATE — ensure all required vars
scripts/smoke-docker.sh         # NEW — verification script
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.4, SC4, NFR11]
- [Source: `docker-compose.yml`]
- [Source: `apps/api/Dockerfile`]
- [Source: `apps/web/Dockerfile`]
- [Source: `README.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — env vars, deployment section]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- `docker compose up -d --build` -> failed on host: `command not found: docker` (previous session)
- `bun test apps/api/tests/docker-deployment-verification.test.ts` (red -> green)
- `bun run type-check` (pass)
- `bun run lint` (pass; pre-existing warnings only)
- `bun run test` (pass)
- `docker compose build` -> exit 0; both `rpg-life-api` and `rpg-life-web` images built successfully (Docker 29.5.2, Compose v5.1.4)
- `curl http://localhost:3002/health` -> `{"status":"ok","timestamp":"...","version":"0.0.0"}` ✅
- `curl -sI http://localhost:3000/` -> `HTTP/1.1 307 Temporary Redirect` to `/sign-in` ✅ (correct for auth-protected app)
- `curl http://localhost:3000/api/trpc/health` -> `{"result":{"data":{"status":"ok"}}}` ✅
- `docker compose down && docker compose up -d` -> `./data/rpg-life.db` (135168 bytes, unchanged) ✅
- API logs: `Database migrations applied` + `Skills catalog seeded` on startup ✅
- `bun run type-check` -> 14 tasks successful, 0 errors ✅

### Completion Notes List

- Added `scripts/smoke-docker.sh` with compose build/start, endpoint polling, smoke assertions, and cleanup trap.
- Added `apps/api/tests/docker-deployment-verification.test.ts` to guard compose/env/health/proxy/smoke-doc requirements.
- Enhanced `apps/web/README.md` with Docker prerequisites, `.env` setup, compose commands, smoke verification, and stop/cleanup guidance.
- Updated `.env.example` placeholders/comments for docker deployment clarity.
- Task 1 runtime verification completed on Docker-enabled host (Docker 29.5.2): both images build cleanly, all smoke endpoints pass, SQLite persists across `docker compose down && up`, migrations confirmed in startup logs.

### File List

- _bmad-output/implementation-artifacts/4-4-docker-deployment-verification.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- .env.example
- apps/api/tests/docker-deployment-verification.test.ts
- apps/web/README.md
- scripts/smoke-docker.sh

### Change Log

- 2026-06-04: Story 4.4 — Docker deployment verification context created
- 2026-06-04: Added docker smoke script, verification test coverage, env/docs updates; blocked on local Docker runtime verification.
- 2026-06-04: Completed Task 1 runtime verification — all AC1 checks passed on Docker-enabled host; story moved to review.
- 2026-06-04: Code review patch findings resolved — restored missing smoke script/test artifacts and corrected README docker guidance.

## Story Completion Status

- Status: **done**
- Depends on: Epic 1–3 complete (app must be functionally complete for Docker to be meaningful)
- Next: Story 4.5 — README and AI integration log.
