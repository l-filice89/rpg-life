# ADR Template

Use this template to document significant architectural decisions. Create a new file in `docs/adr/` for each decision.

## Format

```markdown
# ADR-NNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNN
**Deciders**: [Names or roles]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- ...

### Negative

- ...

### Neutral

- ...
```

## Guidelines

- One decision per ADR
- Keep it concise (1-2 pages max)
- Focus on "why" over "what"
- Link to relevant PRDs, issues, or discussions
- Update status when decisions change
- Number sequentially: ADR-001, ADR-002, etc.

## Example

```markdown
# ADR-001: Use Bun as Primary Runtime

**Date**: 2026-02-07
**Status**: Accepted
**Deciders**: Architecture team

## Context

We need a JavaScript runtime for our monorepo. Options: Node.js, Deno, Bun.

## Decision

Use Bun as the primary runtime for development, testing, and the API server.
Use Node.js where required (Expo, Electron).

## Consequences

### Positive

- Faster installs, builds, and test runs
- Built-in TypeScript support (no transpilation)
- Built-in test runner (no Jest/Vitest dependency)

### Negative

- Smaller ecosystem than Node.js
- Some npm packages may have compatibility issues
- Team needs to learn Bun-specific APIs

### Neutral

- Still need Node.js for Expo and Electron
```
