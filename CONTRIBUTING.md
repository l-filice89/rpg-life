# Contributing

Thanks for your interest in contributing to rpg-life! This guide covers everything you need to get started.

## How to Contribute

- **Bug reports** — [Open an issue](https://github.com/corbanb/rpg-life/issues/new?template=bug-report.yml) with steps to reproduce
- **Feature requests** — [Open an issue](https://github.com/corbanb/rpg-life/issues/new?template=feature-request.yml) describing the feature and why it would be useful
- **Pull requests** — Fork the repo, create a branch from `main`, and submit a PR
- **Security issues** — See [SECURITY.md](.github/SECURITY.md) — do NOT open a public issue

## Development Setup

```bash
bun install                 # Install all dependencies
cp .env.example .env.local  # Configure environment
bun db:push                 # Push schema to dev DB
bun db:seed                 # Seed test data
bun dev                     # Start all workspaces
bun run setup:ai-docs       # Download AI reference docs (optional)
```

See [docs/getting-started.md](docs/getting-started.md) for the detailed setup checklist.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- [Node.js](https://nodejs.org) >= 20 (for Expo/Electron compatibility)
- Git

## Branch Strategy

- `main` — production-ready, always deployable
- `feat/<name>` — new features or PRD implementations
- `fix/<name>` — bug fixes
- `chore/<name>` — tooling, config, dependencies
- `docs/<name>` — documentation-only changes

## Commit Messages

Use conventional commits:

```
type(scope): description

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`

**Scopes**: workspace name (`api`, `web`, `shared`, `database`, `auth`) or feature area (`testing`, `e2e`, `deps`)

**Examples**:

- `feat(api): add user preferences router`
- `fix(auth): handle expired session redirect`
- `chore(deps): bump @trpc/server to 11.1`

## Pull Requests

- One feature or fix per PR
- Keep PRs under 400 lines when possible
- Include a summary, related PRD reference, and test plan
- All CI checks must pass before merge
- Squash merge to keep `main` history clean

## Code Conventions

### Naming

| Thing               | Convention           | Example           |
| ------------------- | -------------------- | ----------------- |
| Files               | kebab-case           | `user-profile.ts` |
| Components          | PascalCase           | `UserProfile`     |
| Functions/variables | camelCase            | `getUserById`     |
| Constants           | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Database tables     | snake_case           | `user_profiles`   |
| tRPC routers        | camelCase            | `projects.create` |

### Types

- Zod schemas are the source of truth for all types
- Define schemas in `packages/shared/` and infer with `z.infer<typeof Schema>`
- Never duplicate types manually

### Imports

- `@packages/*` for cross-package imports
- `@/*` for intra-workspace imports
- Always use path aliases, never relative paths across package boundaries

### Errors

- Use `Errors.*` constructors from `apps/api/src/lib/errors.ts`
- Include `cause` for error chaining
- Map to tRPC error codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`

### Logging

- Use Pino child loggers: `apiLogger`, `dbLogger`, `authLogger`, `aiLogger`
- Never use `console.log` in production code

## Testing

- Run `bun test` before submitting a PR
- See [docs/testing-conventions.md](docs/testing-conventions.md) for patterns
- Unit tests for pure functions, integration tests for routers, E2E for critical flows

## PR Checklist

Before submitting, verify:

- [ ] `bun type-check` passes
- [ ] `bun lint` passes
- [ ] `bun test` passes
- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] No dependency boundary violations
- [ ] Documentation updated if needed

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
