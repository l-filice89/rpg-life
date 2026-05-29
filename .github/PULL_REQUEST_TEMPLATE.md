## Summary

<!-- What does this PR do? Keep it brief — 1-3 sentences. -->

## Related PRD

<!-- Link the PRD if applicable. Format: PRD-NNN Task #N -->

## Type of Change

- [ ] New feature (PRD implementation)
- [ ] Bug fix
- [ ] Refactoring (no behavior change)
- [ ] Documentation
- [ ] CI/CD / DevOps
- [ ] Dependencies

## Checklist

- [ ] `bun turbo type-check` passes (zero type errors)
- [ ] `bun turbo lint` passes (zero lint errors)
- [ ] `bun turbo test` passes (all tests green)
- [ ] No `any` types introduced
- [ ] No `console.log` in production code (use Pino logger)
- [ ] Zod schemas used as source of truth for new types (not manual `interface`/`type`)
- [ ] Dependency boundaries respected (packages don't import from apps)
- [ ] New environment variables added to `.env.example` and documented
- [ ] PRD success criteria verified (if PRD task)

## Test Plan

<!-- How did you verify this works? What should reviewers test? -->

## Screenshots

<!-- If applicable, add screenshots or screen recordings. -->
