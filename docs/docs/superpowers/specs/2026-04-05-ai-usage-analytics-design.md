# AI Usage Analytics Design

**Date:** 2026-04-05  
**Status:** Approved

---

## Goal

Add a per-user AI usage analytics dashboard to the web app. Each authenticated user can view their own token consumption, cost, and request history — filterable by date range. No admin-only gate for v1.

---

## Architecture

### Data layer — new `ai.usage` tRPC router

The existing `ai_usage_log` table has all columns needed for v1 (`userId`, `model`, `tokensUsed`, `estimatedCost`, `endpoint`, `createdAt`). No schema migration required.

The existing `apps/api/src/routers/ai.ts` is split into a directory:

```
apps/api/src/routers/ai/
  generate.ts     — existing generate logic (moved verbatim)
  usage.ts        — new analytics queries
  index.ts        — merges both routers, re-exports aiRouter
```

`apps/api/src/routers/index.ts` import path changes from `./ai` to `./ai/index` (external API unchanged — `ai.*` still works).

### tRPC procedures

Both are `protectedProcedure`, scoped to `ctx.user.userId`.

**`ai.usage.summary`**

Input (all optional):

```ts
{ from?: Date; to?: Date }
```

Output:

```ts
{
  totalRequests: number;
  totalTokens: number;
  totalCost: number; // sum of estimatedCost, parsed from Drizzle string
  avgCostPerRequest: number;
  byModel: Array<{
    model: string;
    count: number;
    tokens: number;
    cost: number;
    pct: number; // percentage of totalCost
  }>;
}
```

Single DB query using Drizzle `groupBy` on `model` with `sum`/`count` aggregates. Derive `totalRequests`, `totalTokens`, and `totalCost` by reducing over the `byModel` array after the query returns — no second DB call needed.

**Important — Drizzle NUMERIC type:** Postgres `NUMERIC` columns are returned by Drizzle as `string | null`, not `number`. All `estimatedCost` and aggregate sum values must be passed through `parseFloat(value ?? '0')` before arithmetic or returning. Failure to do this produces `NaN` silently.

**Important — divide-by-zero guards:**

- `avgCostPerRequest = totalRequests === 0 ? 0 : totalCost / totalRequests`
- `pct = totalCost === 0 ? 0 : (modelCost / totalCost) * 100`

**`ai.usage.history`**

Input (all optional):

```ts
{ from?: Date; to?: Date }
```

Output:

```ts
Array<{
  date: string; // "YYYY-MM-DD"
  tokens: number;
  cost: number;
  count: number;
}>;
```

Uses `DATE_TRUNC('day', created_at)` group-by via Drizzle `sql` template, ordered ascending by date.

**Important — date serialization:** The Neon serverless driver returns `DATE_TRUNC` results as strings over HTTP (not `Date` objects — Neon uses JSON over HTTP, not the binary wire protocol). Pass the value through `new Date(row.date).toISOString().slice(0, 10)` regardless — this handles both string and Date inputs safely. In tests, mock the DB to return an ISO string (e.g. `'2026-01-15T00:00:00.000Z'`) and assert the output is `'2026-01-15'`.

### Date filter input validation

Both procedures share a single Zod schema:

```ts
export const DateRangeInput = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
```

Use `z.coerce.date()` (not `z.date()`) — the tRPC setup does not use SuperJSON, so dates arrive over HTTP as ISO strings and must be coerced.

Defined in `packages/shared/types/` and imported by both procedures.

---

## UI

### Page: `apps/web/src/app/(dashboard)/ai/usage/page.tsx`

Client component. Fetches both `ai.usage.summary` and `ai.usage.history` via tRPC.

**Layout (top to bottom):**

1. **Header** — "AI Usage" title + subtitle + "Refresh" button (calls `refetch()` on both queries)
2. **Date range filter bar** — preset buttons: `7d | 30d | 90d | All time` (default: All time). Sets `from`/`to` state passed to both queries as `Date | undefined`.
3. **Stat cards row** (4 cards, responsive grid):
   - Total Requests
   - Total Tokens
   - Total Cost (formatted as `$0.0000`)
   - Avg Cost / Request
4. **Charts row** (2-column grid on lg+):
   - Left: `LineChart` — tokens per day over time
   - Right: `BarChart` — cost per day over time
5. **Model breakdown table** — columns: Model, Requests, Tokens, Cost, % of Total

### Chart component: `apps/web/src/components/ai-usage-charts.tsx`

Exports `TokensOverTimeChart` and `CostOverTimeChart`. Both accept `data: Array<{ date: string, tokens: number, cost: number, count: number }>`. Uses recharts `ResponsiveContainer`.

### Sidebar update: `apps/web/src/components/app-sidebar.tsx`

Add `{ title: 'AI Usage', href: '/ai/usage', icon: BarChart2 }` immediately after the existing `AI Playground` entry.

**Required import addition:** Add `BarChart2` to the existing `lucide-react` import line.

**Sidebar active state:** The existing `isActive` JSX expression is:

```ts
pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
```

Since `/ai/usage`.startsWith(`/ai`) is true, `AI Playground` would incorrectly highlight on the usage page. Fix by adding `/ai` to the exclusion list — change to:

```ts
pathname === item.href ||
  (item.href !== '/dashboard' && item.href !== '/ai' && pathname.startsWith(item.href));
```

---

## Error handling

- Both tRPC procedures: Drizzle errors caught, re-thrown as `Errors.internal(...)`.
- Empty result sets: `summary` returns zero-valued object (`totalRequests: 0`, `totalTokens: 0`, `totalCost: 0`, `avgCostPerRequest: 0`, `byModel: []`). Not a 404.
- UI: tRPC query errors surfaced via `toast.error`. Loading states shown with skeleton cards.

---

## Testing

**`apps/api/src/__tests__/ai-usage.test.ts`** — tRPC caller tests (follows existing test location pattern alongside `ai.test.ts`, `projects.test.ts` etc.):

- `summary` with no rows returns zero-valued summary object
- `summary` aggregates tokens and cost correctly across multiple rows
- `summary` respects `from`/`to` date filters (rows outside range excluded)
- `summary` handles null `estimatedCost` rows without NaN
- `history` returns one entry per day, ordered ascending
- `history` serializes dates as `"YYYY-MM-DD"` strings
- `history` respects `from`/`to` date filters
- Both procedures require auth (unauthenticated caller throws UNAUTHORIZED)

Tests use `createTestContext` + `createCaller` pattern from existing test infrastructure.

---

## File checklist

| Action | Path                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| Create | `apps/api/src/routers/ai/generate.ts`                                                      |
| Create | `apps/api/src/routers/ai/usage.ts`                                                         |
| Create | `apps/api/src/routers/ai/index.ts`                                                         |
| Delete | `apps/api/src/routers/ai.ts`                                                               |
| Modify | `apps/api/src/routers/index.ts`                                                            |
| Create | `apps/api/src/__tests__/ai-usage.test.ts`                                                  |
| Create | `apps/web/src/app/(dashboard)/ai/usage/page.tsx`                                           |
| Create | `apps/web/src/components/ai-usage-charts.tsx`                                              |
| Modify | `apps/web/src/components/app-sidebar.tsx` (add nav item + BarChart2 import + isActive fix) |
| Modify | `packages/shared/types/` (add `DateRangeInput` schema with `z.coerce.date()`)              |
