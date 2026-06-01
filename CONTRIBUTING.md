# Contributing

Thanks for your interest in contributing to rpg-life.

## How to Contribute

- **Bug reports** — [Open an issue](https://github.com/l-filice89/rpg-life/issues/new?template=bug-report.yml) with steps to reproduce
- **Feature requests** — [Open an issue](https://github.com/l-filice89/rpg-life/issues/new?template=feature-request.yml) describing the feature and why it would be useful
- **Pull requests** — Fork the repo, create a branch from `main`, and submit a PR
- **Security issues** — See [SECURITY.md](.github/SECURITY.md) — do not open a public issue

## Development Setup

```bash
bun install
cp .env.example .env.local   # set BETTER_AUTH_SECRET + Resend keys
bun db:migrate
bun db:seed                  # optional; api also seeds skills on startup
bun dev
```

See [README.md](README.md) for Docker and smoke verification.

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Resend](https://resend.com) account for magic-link email (required even in local dev)
- Git

## Branch Strategy

- `main` — production-ready, always deployable
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — tooling, config, dependencies
- `docs/<name>` — documentation-only changes

## Commit Messages

Use conventional commits:

```
type(scope): description
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`

**Scopes**: workspace name (`api`, `web`, `db`, `auth`, `ui`) or feature area (`quest-board`, `e2e`, `deps`)

## Pull Requests

- One feature or fix per PR
- Include a summary and test plan
- All CI checks must pass before merge

## Code Conventions

- Zod schemas in `packages/validators/` are the source of truth for shared types
- Use `@rpg-life/*` workspace imports across package boundaries
- Use Pino loggers in server code; avoid `console.log` in production paths
- SQLite via Drizzle in `packages/db`; run migrations with `bun db:migrate`

## Testing

```bash
bun run smoke              # primary verification suite
bun turbo type-check
bun turbo lint
cd apps/web && bun run test:e2e   # Playwright (auth flows)
```

## PR Checklist

- [ ] `bun turbo type-check` passes
- [ ] `bun turbo lint` passes
- [ ] `bun run smoke` passes
- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] Documentation updated if needed

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
