---
baseline_commit: c664fe0
---

# Story 4.2: CI Pipeline with Coverage Gate

Status: ready-for-dev

## Story

As a **builder**,
I want CI to enforce lint, typecheck, tests, and coverage thresholds,
So that code quality stays consistent throughout the build.

## Acceptance Criteria

1. **Given** GitHub Actions workflow **When** a PR or push to main runs CI **Then** pipeline executes lint, typecheck, domain unit tests, build, and Playwright E2E (NFR11).

2. **And** coverage report enforces **≥70% meaningful code coverage** — build fails below threshold (SC2, NFR9).

3. **And** domain unit tests from Story 3.1 are included in CI.

4. **And** E2E job runs the Playwright suite from Story 4.1 and fails CI if < 5 specs pass.

5. **And** `bun run type-check` remains green after all changes.

## Tasks / Subtasks

- [ ] **Task 1: Add coverage gate to `test` job** (AC: #2, #3)
  - [ ] In `.github/workflows/ci.yml`, replace `bun run smoke` with a two-step approach:
    1. `bun run smoke` — existing unit/integration fast tests (keep)
    2. Add new step: `bun test --coverage --coverage-reporter=text packages/domain/src packages/api/src packages/db/src apps/web/src/lib`
  - [ ] Add coverage threshold step: use `bun test --coverage --coverage-threshold=70` OR parse coverage JSON and fail if below 70%
  - [ ] `bunfig.toml` — add `[test.coverage]` section with `threshold = 70` and `exclude = ["**/node_modules/**", "**/*.config.*", "**/__mocks__/**"]`
  - [ ] Coverage must include: `packages/domain/src`, `packages/api/src/__tests__`, `packages/db/src`, `apps/web/src/lib` — exclude generated/boilerplate
  - [ ] CI fails if coverage drops below 70%; passes if ≥70%

- [ ] **Task 2: Add E2E job to CI workflow** (AC: #1, #4)
  - [ ] Add new `e2e` job to `.github/workflows/ci.yml` that runs after `test` job passes
  - [ ] Job uses `ubuntu-latest`, sets up Bun 1.3.8, installs dependencies
  - [ ] Install Playwright browsers: `bunx playwright install --with-deps chromium`
  - [ ] Start services: use `docker compose up -d --build` then `sleep 30` or health-check polling to wait for readiness
  - [ ] Run: `cd apps/web && bunx playwright test --reporter=github`
  - [ ] Upload Playwright trace on failure: `uses: actions/upload-artifact@v4` with `apps/web/playwright-report/`
  - [ ] Job fails if any E2E spec fails (Playwright exits non-zero)

- [ ] **Task 3: Add build job** (AC: #1)
  - [ ] Add `build` job that runs `bun turbo build` to confirm production build succeeds
  - [ ] Should run after `quality` and `test` jobs pass
  - [ ] Caches Bun install like other jobs

- [ ] **Task 4: Update `ci-passed` gate** (AC: #1)
  - [ ] Update `ci-passed` job `needs` array to include `[quality, test, e2e, build]`
  - [ ] Ensures all gates required before merge

- [ ] **Task 5: Coverage config in `bunfig.toml`** (AC: #2)
  - [ ] Read `bunfig.toml` at repo root; add or update `[test]` and `[test.coverage]` sections
  - [ ] Set `coverageThreshold = 70` (line coverage)
  - [ ] Set appropriate exclude patterns for boilerplate
  - [ ] Verify `bun test --coverage` works locally with this config

- [ ] **Task 6: `package.json` scripts** (AC: #1–#2)
  - [ ] Root `package.json`: add `"test:coverage": "turbo test --coverage"` script
  - [ ] `apps/web/package.json`: add `"e2e": "playwright test"` if not already present
  - [ ] Verify existing `smoke` script still works unchanged

## Dev Notes

### Brownfield Starting Point

| Exists today | Action |
|---|---|
| `.github/workflows/ci.yml` | **Update** — add coverage + E2E + build jobs |
| `quality` job (typecheck + lint) | **Keep** — no changes |
| `test` job (smoke + migration check) | **Update** — add coverage threshold step |
| `ci-passed` gate job | **Update** — add e2e + build to needs |
| `bunfig.toml` at root | **Update** — add `[test.coverage]` section |
| `bun run smoke` script | **Keep** — still fast smoke; coverage is additive |

[Source: `.github/workflows/ci.yml`, `bunfig.toml`, root `package.json`]

### Current CI Structure (Before)

```yaml
jobs:
  quality:   # typecheck + lint + audit
  test:      # smoke + migration check
  ci-passed: # gate: needs [quality, test]
```

### Target CI Structure (After)

```yaml
jobs:
  quality:   # typecheck + lint + audit (unchanged)
  test:      # smoke + coverage gate ≥70% + migration check
  build:     # bun turbo build (NEW)
  e2e:       # playwright test against docker-compose (NEW)
  ci-passed: # gate: needs [quality, test, build, e2e]
```

### Coverage Gate Implementation

Bun's `--coverage` flag and `coverageThreshold` in `bunfig.toml`:

```toml
# bunfig.toml addition
[test]
coverageThreshold = 70

[test.coverage]
include = [
  "packages/domain/src/**/*.ts",
  "packages/api/src/**/*.ts",
  "packages/db/src/**/*.ts",
  "apps/web/src/lib/**/*.ts",
]
exclude = [
  "**/*.config.*",
  "**/*.d.ts",
  "**/node_modules/**",
  "**/__mocks__/**",
  "**/migrations/**",
]
```

CI test step addition:
```yaml
- name: Run tests with coverage
  run: bun test --coverage
  env:
    DATABASE_URL: file:./data/ci-test.db
    # ... existing env vars
```

Bun exits non-zero if threshold not met.

[Source: `bunfig.toml`, Bun docs on coverage thresholds]

### E2E Job Configuration

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [test]
  env:
    DATABASE_URL: file:/data/rpg-life.db
    BETTER_AUTH_SECRET: ci-e2e-secret-must-be-at-least-32-chars
    BETTER_AUTH_URL: http://localhost:3000
    RESEND_API_KEY: re_ci_placeholder
    EMAIL_FROM: onboarding@resend.dev
    API_URL: http://localhost:3002
    WEB_URL: http://localhost:3000
    NODE_ENV: test    # enables test-session endpoint (Story 4.1)
  steps:
    - uses: actions/checkout@v6
    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: '1.3.8'
    - uses: actions/cache@v5
      with:
        path: ~/.bun/install/cache
        key: bun-${{ runner.os }}-${{ hashFiles('bun.lock') }}
    - name: Install dependencies
      run: bun install --frozen-lockfile
    - name: Install Playwright browsers
      run: bunx playwright install --with-deps chromium
      working-directory: apps/web
    - name: Start services via Docker Compose
      run: |
        mkdir -p data
        docker compose up -d --build
    - name: Wait for services to be healthy
      run: |
        for i in $(seq 1 30); do
          if curl -sf http://localhost:3002/health && curl -sf http://localhost:3000/api/trpc/health; then
            echo "Services ready"
            break
          fi
          echo "Waiting... ($i/30)"
          sleep 3
        done
    - name: Run Playwright E2E
      run: bunx playwright test --reporter=github
      working-directory: apps/web
      env:
        BASE_URL: http://localhost:3000
    - name: Upload Playwright report on failure
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: apps/web/playwright-report/
        retention-days: 7
```

Note: `NODE_ENV=test` in E2E job is required to enable the test-session endpoint from Story 4.1.

### Health Check Endpoints

CI needs health endpoints to wait for readiness. Verify/add:
- `GET /health` on api (port 3002) — check `apps/api/src/app.ts`
- `GET /api/trpc/health` on web (port 3000) — Next.js proxy passes to api

If health endpoints don't exist, add a simple `GET /health` returning `{ status: 'ok' }` to `apps/api/src/app.ts`.

[Source: `apps/api/src/app.ts`]

### Coverage Scope Rationale

Included packages (toward 70%):
- `packages/domain/src` — pure functions, fully testable, likely 90%+
- `packages/api/src` — tRPC procedures, integration tests cover them
- `packages/db/src` — schema + migration tests
- `apps/web/src/lib` — pure utilities (filters, empty-variant logic)

Excluded (boilerplate/generated):
- `apps/web/src/app/**` — RSC pages (Next.js framework code, hard to unit test)
- `apps/web/src/components/**` — UI components (E2E covers them)
- `**/migrations/**` — auto-generated

[Source: `_bmad-output/planning-artifacts/epics.md` NFR9, SC2]

### Anti-Patterns (Do Not)

- ❌ Do NOT run `bun run smoke` with `--coverage` — smoke uses explicit file list; use `bun test --coverage` across packages instead
- ❌ Do NOT set coverage threshold > 70% initially (may fail on untested RSC boundary code)
- ❌ Do NOT use the dev `webServer` playwright config for CI — use docker-compose stack
- ❌ Do NOT `needs: [e2e]` in `ci-passed` without `if: always()` — will always fail on skipped jobs

### Project Structure

```
.github/workflows/ci.yml    # UPDATE — add e2e + build jobs, coverage step
bunfig.toml                 # UPDATE — add [test.coverage] section
package.json                # UPDATE — add test:coverage script
apps/web/package.json       # UPDATE — add e2e script
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.2, SC2, NFR9, NFR11]
- [Source: `.github/workflows/ci.yml`]
- [Source: `bunfig.toml`]
- [Source: `_bmad-output/implementation-artifacts/4-1-playwright-e2e-test-suite.md`]
- [Source: `apps/web/playwright.config.ts`]
- [Source: `docker-compose.yml`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-06-04: Story 4.2 — CI pipeline with coverage gate context created

## Story Completion Status

- Status: **ready-for-dev**
- Depends on: Story 4.1 (E2E specs must exist for E2E job to run)
- Next: Story 4.3 (accessibility audit gate adds axe-core to E2E specs)
