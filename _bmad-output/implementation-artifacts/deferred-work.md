# Deferred Work

## Deferred from: code review of 1-1-scaffold-monorepo-and-development-infrastructure (2026-05-29)

- Playwright `webServer` filter uses `@rpg-life/api` but the API package is `@rpg-life/server`, and `@playwright/test` is pinned at `1.58.2` vs architecture pin `1.60.0`. Deferred — e2e harness is Epic 4 scope.
- CORS origin (`env.WEB_URL`) and better-auth `trustedOrigins` (`BETTER_AUTH_URL`) are separate env vars that can diverge. Deferred — both default to `http://localhost:3000`.
- `packages/api/src/context.ts` types `user.email` / `user.name` as required `string` though session fields may be nullable. Deferred — minor type tightening.
- `docker-compose.yml` `web.depends_on: api` has no healthcheck/readiness wait. Deferred — web client retries.
- `.env.example` ships a placeholder `BETTER_AUTH_SECRET` that already meets the 32-char minimum (copy-pasteable known secret). Deferred — document only.
- Windows portability: root `clean` script uses Unix-only `rm -rf`; `scripts/dev.ts` spawns extensionless `node_modules/.bin/turbo`. Deferred — dev-convenience scripts.
