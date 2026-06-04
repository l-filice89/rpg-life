---
baseline_commit: c664fe0
---

# Story 4.4: Docker Deployment Verification

Status: ready-for-dev

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

- [ ] **Task 1: Audit and verify `docker-compose.yml`** (AC: #1)
  - [ ] Read current `docker-compose.yml` — verify `api` and `web` services, `./data:/data` volume mount, port bindings (3000/3002), env var pass-through
  - [ ] Run `docker compose build` (or `docker compose up --build`) locally and confirm both images build without errors
  - [ ] Verify api starts: `curl http://localhost:3002/health` returns `{ status: 'ok' }`
  - [ ] Verify web starts: `curl http://localhost:3000` returns HTML (200)
  - [ ] Verify SQLite persists: restart compose (`docker compose down && docker compose up`) and confirm `./data/rpg-life.db` survives
  - [ ] Verify schema migrations run on api startup (check api logs for migration output)

- [ ] **Task 2: Verify api health endpoint exists** (AC: #1, #3)
  - [ ] Read `apps/api/src/app.ts` — confirm `GET /health` returns `{ status: 'ok' }`
  - [ ] If missing: add `app.get('/health', (c) => c.json({ status: 'ok' }))` before tRPC mount
  - [ ] Also verify Next.js rewrite proxy passes `GET /api/trpc/health` through to api

- [ ] **Task 3: Verify `.env.example` completeness** (AC: #2)
  - [ ] Read `.env.example` at repo root
  - [ ] Required vars per architecture (confirm all present):
    - `DATABASE_URL` (e.g., `file:/data/rpg-life.db`)
    - `BETTER_AUTH_SECRET` (32+ char string)
    - `BETTER_AUTH_URL` (e.g., `http://localhost:3000`)
    - `RESEND_API_KEY` (Resend API key)
    - `EMAIL_FROM` (e.g., `onboarding@resend.dev`)
    - `API_URL` (e.g., `http://localhost:3002` — used by web for SSR)
    - `WEB_URL` (e.g., `http://localhost:3000` — used by api for CORS/cookie scope)
  - [ ] Add any missing vars with comments explaining their purpose
  - [ ] Ensure `.env.example` has no real secrets (all placeholder values)

- [ ] **Task 4: Smoke verification script** (AC: #3)
  - [ ] Create `scripts/smoke-docker.sh` — simple bash script that:
    1. `docker compose up -d --build`
    2. Waits for services (poll health endpoints with retry)
    3. Runs `curl` checks for key endpoints
    4. Reports pass/fail
    5. `docker compose down` cleanup
  - [ ] Script: verify `/health` (api), `/` → sign-in redirect (web), `/api/trpc/health` (proxy)
  - [ ] Make executable: `chmod +x scripts/smoke-docker.sh`
  - [ ] Document in README how to run: `bash scripts/smoke-docker.sh`

- [ ] **Task 5: Verify API Dockerfile correctness** (AC: #1)
  - [ ] Read `apps/api/Dockerfile` — multi-stage build already exists
  - [ ] Verify `ENTRYPOINT` or `CMD` correctly starts `apps/api/src/start.ts` via Bun
  - [ ] Confirm migration runs on startup (check `apps/api/src/start.ts` for migration call)
  - [ ] Verify no hard-coded paths that break in container context

- [ ] **Task 6: Verify web Dockerfile correctness** (AC: #1)
  - [ ] Read `apps/web/Dockerfile` — multi-stage Next.js build exists
  - [ ] Verify `API_URL` build arg is correctly baked in for SSR rewrites
  - [ ] Confirm Next.js standalone output is used (if applicable) or standard `next start`
  - [ ] Verify `PORT` env var is respected

- [ ] **Task 7: Update README docker section** (AC: #2, #3)
  - [ ] README `apps/web/README.md` already has partial Docker section — enhance with:
    - Prerequisites (Docker Desktop or Docker Engine + Compose plugin)
    - Full env setup command sequence
    - `docker compose up --build` command
    - Service URLs (web :3000, api :3002)
    - Smoke verification commands
    - Stopping: `docker compose down` (data persists), `docker compose down -v` (wipe data)
  - [ ] This README update is minimal; comprehensive README work is Story 4.5

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

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-06-04: Story 4.4 — Docker deployment verification context created

## Story Completion Status

- Status: **ready-for-dev**
- Depends on: Epic 1–3 complete (app must be functionally complete for Docker to be meaningful)
- Next: Story 4.5 (README + AI integration log is the final documentation deliverable)
