# Security Policy

## Supported Versions

| Version          | Supported |
| ---------------- | --------- |
| Latest on `main` | Yes       |
| Older versions   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Use [GitHub private vulnerability reporting](https://github.com/l-filice89/rpg-life/security/advisories/new) if available, or contact the repository owner directly
2. Include a description of the vulnerability, steps to reproduce, and potential impact
3. Allow reasonable time for a fix before public disclosure

### Scope

In scope:

- Authentication and authorization bypasses (`packages/auth`)
- SQL injection or unsafe database access (`packages/db`)
- API server vulnerabilities (`apps/api`)
- Cross-site scripting (XSS) in the web app (`apps/web`)
- Exposed secrets or credentials in the codebase

Out of scope:

- Issues requiring physical access to a developer machine
- Social engineering
- Denial of service (unless trivially exploitable)

## Security Practices

- Secrets live in `.env.local` and hosting provider env vars — never committed
- Zod validates API inputs at the tRPC layer
- Better Auth handles session management
- Dependabot monitors dependencies weekly
