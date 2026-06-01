# Deferred Work

## Deferred from: code review of 1-1-scaffold-monorepo-and-development-infrastructure (2026-05-29)

- Playwright `webServer` filter uses `@rpg-life/api` but the API package is `@rpg-life/server`, and `@playwright/test` is pinned at `1.58.2` vs architecture pin `1.60.0`. Deferred — e2e harness is Epic 4 scope.
- CORS origin (`env.WEB_URL`) and better-auth `trustedOrigins` (`BETTER_AUTH_URL`) are separate env vars that can diverge. Deferred — both default to `http://localhost:3000`.
- `packages/api/src/context.ts` types `user.email` / `user.name` as required `string` though session fields may be nullable. Deferred — minor type tightening.
- `docker-compose.yml` `web.depends_on: api` has no healthcheck/readiness wait. Deferred — web client retries.
- `.env.example` ships a placeholder `BETTER_AUTH_SECRET` that already meets the 32-char minimum (copy-pasteable known secret). Deferred — document only.
- Windows portability: root `clean` script uses Unix-only `rm -rf`; `scripts/dev.ts` spawns extensionless `node_modules/.bin/turbo`. Deferred — dev-convenience scripts.

## Deferred from: code review of 1-2-crystal-path-design-tokens-and-shadcn-foundation (2026-05-29)

- `apps/web/tsconfig.json` remaps `@/lib/utils` and `@/components/ui/*` into `packages/ui` — fragile for a second consumer app; acceptable for single-app MVP until Story 1.4+.
- `tailwindcss` / `tw-animate-css` live in `@rpg-life/ui` devDependencies; Docker works with full `bun install` but would break under production-only dependency pruning.
- CI runs type-check/lint only, not `next build` — CSS/Tailwind regressions may slip until Epic 4 CI hardening.
- `/` renders token showcase until Story 1.4 app shell replaces it — intentional per Task 5.
- No automated OS theme-switch test — manual verification only; Epic 4 E2E scope.

## Deferred from: code review of 1-3-magic-link-sign-in (2026-05-29)

- Full magic-link E2E (inbox + click-through) — Epic 4; smoke covers redirect + validation only.
- `user` + `session` databaseHooks both call `provisionUserProgress` — redundant but idempotent via `onConflictDoNothing`.

## Deferred from: code review of 1-4-app-shell-and-sidebar-navigation (2026-05-29)

- No authenticated sidebar E2E (open hamburger → nav items visible) — story marked optional; Epic 4 session-fixture scope.
- `apps/web` unit tests (`bun test src/`) not wired into root `smoke` or CI — new in 1.4; Epic 4 CI hardening.

## Deferred from: code review of 1-5-first-run-tutorial (2026-05-29)

- `(app)/layout.tsx` has no error handling when api/tRPC unreachable — authenticated shell throws instead of retry UI; NFR online-only retry deferred to Epic 4/error boundary.
- No authenticated first-run Tutorial E2E — story defers to Epic 4 session fixture; smoke covers API unit tests only.
- `apps/web` unit tests still not wired into root `smoke` or CI — carried from Story 1.4.

## Deferred from: code review of 2-1-tasks-schema-and-skill-catalog-seed (2026-06-01)

- `tasks.owner_id ON DELETE CASCADE` hard-deletes all tasks if user row is removed — MVP soft-delete is `deleted_at` only; user-delete cascade acceptable until account deletion is modeled.
- Docker/README changes exceed pure schema scope but satisfy Task 6 verification — intentional supporting work for compose smoke.

## Deferred from: code review of 2-2-list-open-quests-on-quest-board (2026-06-01)

- No secondary sort key for tasks sharing same `due_date` — MVP scale; order stable enough for Ben-scale lists.
- `error.tsx` accepts `error` prop but never surfaces digest/message — debug polish.
- Repository casts `difficulty`/`skillCode` without runtime validation — validators deferred to Story 2.4+.
- Layout-level fetch failure bypasses quest-board error boundary — pre-existing from Story 1.5 deferred-work.
- Shared in-memory test DB accumulates rows across tests — matches tutorial.test.ts pattern; per-test userIds isolate assertions.
- Expired session on `tasks.list` shows retry loop instead of sign-in redirect — auth UX hardening.
- `<h2>` per quest row may clutter heading outline — deferred to Story 2.3 QuestRow a11y pass.

## Deferred from: code review of 2-3-quest-board-header-and-brand-components (2026-06-01)

- `dev.ts` / `next.config.ts` dev startup changes exceed story file list — beneficial DX fix discovered during manual QA.
- Quest Board page fails entirely if either `tasks.list` or `profile.get` throws — matches Story 2.2 RSC fetch pattern; partial failure is Epic 4/error-boundary hardening.

## Deferred from: code review of 2-4-create-quest-via-fab (2026-06-01)

- Invalid `skill_code` FK errors surface as raw DB errors, not `TRPCError` — Zod enum blocks normal clients; same class as Story 2.2 repository cast deferral.
- Shared in-memory test DB accumulates rows across tests — matches `tasks-list.test.ts` pattern; per-test userIds isolate assertions.
