## Project Summary (read first)
This is a **React app using RSC (React Server Components)** with a **Bun backend** and **SQLite** as the primary database.
Agents must optimize for **correctness, maintainability, security, and performance**, and must keep changes **small, testable, and consistent with existing patterns** in the repo.

## Stack (authoritative)
- **Frontend**: React with **RSC** with Next.js App Router conventions
- **Backend**: **Bun** runtime (HTTP API/service layer)
- **Database**: **SQLite**
- **State**: Zustand (client-side only; do not use for server state)
- **Styling/UI**: Tailwind + shadcn/ui (follow existing component patterns)
- **Testing**: `bun test`, MSW (API mocking), Playwright (E2E)

## Non‑Negotiable Engineering Rules
### TypeScript & Code Quality
- **Strict TypeScript** only. Avoid `any`; if unavoidable, isolate and justify with narrow types and runtime validation.
- Prefer **total functions**: validate external inputs (request bodies, query params, env) at boundaries.
- No dead code, no unused exports, no silent error swallowing.
- Keep functions small, cohesive, and named for intent.

### RSC / Client Boundary (critical)
- Default to **Server Components**. Use `"use client"` only when necessary (hooks, event handlers, browser-only APIs).
- Never import server-only modules (DB, filesystem, secrets, Node/Bun-only APIs) into client components.
- Keep data fetching on the server where possible; pass **serializable** props to client components.
- Avoid creating “god components”: split into server data loaders + presentational components.

### Backend Architecture & API Contracts
- Backend endpoints must be **versionable and typed**. Define a single source of truth for request/response shapes (shared types or schema).
- Prefer **explicit DTOs** over leaking DB row shapes directly to the frontend.
- Use **structured errors** (consistent status codes + machine-readable error codes).
- All side effects must be **idempotent where appropriate** and safe on retries.

### SQLite Rules (correctness first)
- Use **migrations** for every schema change (no ad-hoc schema edits). Migrations must be reversible.
- Use **transactions** for multi-statement writes.
- Use **prepared statements / parameter binding** always; never string-concatenate SQL.
- Enable and rely on **foreign keys**; do not bypass referential integrity.
- Add indices intentionally, based on query patterns; keep them minimal and justified.

### Security & Privacy
- Never log secrets, tokens, credentials, or PII. Redact where needed.
- Validate authorization on every sensitive backend operation; never trust the client.
- Use secure defaults for cookies/headers/sessions if present (HttpOnly/SameSite/Secure as appropriate).
- Treat file uploads, redirects, and HTML rendering as high-risk surfaces (sanitize/validate).

### Logging & Observability (backend required)
- Backend code must use **Pino** for logging (structured JSON logs). Do not use `console.log`/`console.error` in backend code except as a last-resort temporary debug aid.
- Backend code should log **meaningful events** for all requests and important state transitions (CRUD writes, auth decisions, background jobs, external calls).
- Logs must be **structured** (key/value fields), include **request correlation** (request id / trace id), and be consistent across endpoints.
- Log **inputs and outputs at boundaries** (request metadata + response status), but **never** include secrets or PII; **redact** sensitive fields (tokens, passwords, emails, ids when required by policy).
- Prefer logs that support debugging: include stable identifiers, error codes, timing, and the operation name.

### Performance & Reliability
- Avoid N+1 queries; batch or join as appropriate.
- Prefer streaming/server rendering patterns that fit RSC.
- Add caching only with clear invalidation rules (and document them in code).
- Make error handling observable: meaningful error messages, stable error codes, and predictable failure modes.

### UI/UX: Responsive & Mobile‑First (required)
- Build **mobile-first** by default: design and implement for small screens first, then enhance for larger breakpoints.
- Ensure layouts are responsive (Tailwind breakpoints used intentionally), with readable typography and no horizontal scrolling at common mobile widths.
- Use accessible touch targets and spacing; avoid hover-only interactions on mobile.
- Verify key flows at mobile widths during development (e.g., ~360–430px) before considering desktop “done”.
- Accessibility is **required**:
  - Use semantic HTML first (proper headings/landmarks/buttons/labels).
  - All functionality must be keyboard-accessible with visible focus states; no focus traps.
  - Use ARIA only when necessary and ensure labels/roles/states are correct.
  - Meet reasonable color contrast and support reduced motion when applicable.

## Repo Conventions (follow existing structure)
If the repo already defines these, **do not invent new paths**—follow what exists.
- **Components**: `src/components/` (co-locate tests when present)
- **Shared utilities**: `src/lib/` for pure, reusable logic
- **Routes**: `src/app/` for file-based routing (RSC-first)
- **API client**: use the existing `apiClient` (never scatter `fetch` usage) if it exists in the repo

## Testing Standards
- **Unit tests**: business logic and pure functions (fast, deterministic)
- **Integration tests**: backend handlers and DB logic (use SQLite test DB; do not hit prod/dev DB)
- **MSW**: for frontend integration tests that depend on API calls
- **Playwright**: only for critical user journeys and regressions
- Tests must be **reliable** (no timing sleeps, no random failures, no order dependence).

### TDD Preference (as much as practical)
- Prefer **TDD**: write the failing test first, implement the smallest change to pass, then refactor.
- Use TDD most strongly for **pure logic**, **backend handlers**, and **DB access** where fast tests are easy.
- For UI/RSC changes, still write tests early (component/integration/e2e as appropriate) and avoid shipping behavior without coverage unless the change is truly trivial.

## Change Hygiene
- Make the **smallest correct change** that solves the problem.
- Keep PRs focused: no drive-by refactors unless required.
- Update docs/config only when it materially affects how the system is built or run.
- When you add a new dependency, prefer the package manager and keep the footprint minimal.
- For substantive work, ensure a clean “definition of done”: **typecheck/lint + relevant tests** (unit/integration/e2e as appropriate) and no new warnings.
