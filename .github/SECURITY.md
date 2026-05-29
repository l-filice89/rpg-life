# Security Policy

## Supported Versions

| Version          | Supported |
| ---------------- | --------- |
| Latest on `main` | Yes       |
| Older versions   | No        |

This is a boilerplate/template repository. Security patches are applied to the latest version on `main` only.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: security@px4.dev
2. Include a description of the vulnerability, steps to reproduce, and potential impact
3. Allow reasonable time for a fix before public disclosure

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Fix timeline depends on severity

### Scope

The following are in scope for security reports:

- Authentication and authorization bypasses (`packages/auth`)
- SQL injection or ORM query manipulation (`packages/database`)
- API server vulnerabilities (`apps/api`)
- Cross-site scripting (XSS) in web/marketing apps
- Exposed secrets or credentials in the codebase
- Dependency vulnerabilities with a known exploit

### Out of Scope

- Vulnerabilities in upstream dependencies with no known exploit (report these upstream)
- Issues that require physical access to the developer machine
- Social engineering
- Denial of service (unless trivially exploitable)

## Security Practices

This project follows these security practices:

- **Environment variables**: All secrets stored in `.env.local`, never committed
- **Input validation**: Zod schemas validate all API inputs at the tRPC layer
- **Authentication**: Better Auth with secure session management
- **Dependency updates**: Dependabot monitors for vulnerable dependencies weekly
- **Type safety**: Strict TypeScript eliminates a class of runtime errors
