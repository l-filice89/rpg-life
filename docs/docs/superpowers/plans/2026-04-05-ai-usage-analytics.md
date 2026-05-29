# AI Usage Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-user AI usage analytics dashboard showing token consumption, cost, and request history with date-range filtering.

**Architecture:** New `ai.usage.*` tRPC procedures query `ai_usage_log` scoped to the authenticated user. The existing `ai.ts` router is split into a directory (`ai/generate.ts` + `ai/usage.ts` + `ai/index.ts`). A new Next.js page at `/ai/usage` renders stat cards, recharts line/bar charts, and a model breakdown table.

**Tech Stack:** Bun, tRPC v11, Drizzle ORM (Neon Postgres), Next.js 15 App Router, recharts 2.15.4, Zod 3, `@rpg-life/shared/types`, `lucide-react`

---

## File Map

| Action | Path                                             | Responsibility                              |
| ------ | ------------------------------------------------ | ------------------------------------------- |
| Modify | `packages/shared/types/domain.ts`                | Add `DateRangeInput` Zod schema             |
| Create | `apps/api/src/routers/ai/generate.ts`            | Existing generate logic (moved verbatim)    |
| Create | `apps/api/src/routers/ai/usage.ts`               | `summary` + `history` procedures            |
| Create | `apps/api/src/routers/ai/index.ts`               | Merges generate + usage routers             |
| Delete | `apps/api/src/routers/ai.ts`                     | Replaced by directory                       |
| Modify | `apps/api/src/routers/index.ts`                  | Update import path                          |
| Create | `apps/api/src/__tests__/ai-usage.test.ts`        | Unit tests for usage procedures             |
| Create | `apps/web/src/components/ai-usage-charts.tsx`    | `TokensOverTimeChart` + `CostOverTimeChart` |
| Create | `apps/web/src/app/(dashboard)/ai/usage/page.tsx` | Full analytics page                         |
| Modify | `apps/web/src/components/app-sidebar.tsx`        | Add nav item + isActive fix                 |

---

## Task 1: Add `DateRangeInput` schema to shared types

**Files:**

- Modify: `packages/shared/types/domain.ts`

Context: `packages/shared/types/domain.ts` exports domain types. Add a Zod schema here for the shared date range input used by both tRPC procedures. Use `z.coerce.date()` — the tRPC setup has no SuperJSON transformer, so dates arrive over HTTP as ISO strings and must be coerced.

- [ ] **Step 1: Add the schema to `packages/shared/types/domain.ts`**

Add `import { z } from 'zod';` at the **top** of the file (with the other imports, not at the bottom). Then append to the bottom of the file:

```ts
export const DateRangeInput = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type DateRange = z.infer<typeof DateRangeInput>;
```

- [ ] **Step 2: Verify the types package compiles**

```bash
cd /path/to/repo && bun turbo type-check --filter=@rpg-life/shared
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/types/domain.ts
git commit -m "feat(shared): add DateRangeInput Zod schema"
```

---

## Task 2: Split `ai.ts` router into `ai/` directory

**Files:**

- Create: `apps/api/src/routers/ai/generate.ts`
- Create: `apps/api/src/routers/ai/index.ts`
- Delete: `apps/api/src/routers/ai.ts`
- Modify: `apps/api/src/routers/index.ts`

Context: The existing `apps/api/src/routers/ai.ts` exports `aiRouter` with a single `generate` procedure. We split it into a directory so `usage.ts` can be added alongside it cleanly. The external `appRouter.ai.*` namespace stays unchanged.

- [ ] **Step 1: Create `apps/api/src/routers/ai/generate.ts`**

Copy the full content of the existing `apps/api/src/routers/ai.ts` verbatim into this new file. No changes — just a move.

```ts
// apps/api/src/routers/ai/generate.ts
import { aiUsageLog } from '@rpg-life/db';
import { AIGenerateInputSchema, AIGenerateOutputSchema } from '@rpg-life/shared/ai';
import { generateAIResponse, calculatePreciseCost } from '@rpg-life/ai-integrations';
import { protectedProcedure } from '../../trpc';
import { Errors } from '../../lib/errors';
import { aiLogger } from '../../lib/logger';

// Export the procedure directly (not wrapped in a router) so ai/index.ts
// can compose it cleanly alongside the usageRouter without touching _def.
export const generateProcedure = protectedProcedure
  .meta({
    openapi: { method: 'POST', path: '/ai/generate', tags: ['AI'], protect: true },
  })
  .input(AIGenerateInputSchema)
  .output(AIGenerateOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const start = performance.now();

    let result;
    try {
      result = await generateAIResponse(input.prompt, {
        systemPrompt: input.systemPrompt,
        maxTokens: input.maxTokens,
      });
    } catch (err) {
      aiLogger.error({ err, userId: ctx.user.userId }, 'AI generation failed');
      throw Errors.internal('AI generation failed').toTRPCError();
    }

    const duration = Math.round(performance.now() - start);
    const totalTokens = result.usage.totalTokens;
    const estimatedCost = calculatePreciseCost(
      result.usage.promptTokens,
      result.usage.completionTokens,
      'claude-sonnet-4-20250514',
    );

    try {
      await ctx.db.insert(aiUsageLog).values({
        userId: ctx.user.userId,
        model: 'claude-sonnet-4-20250514',
        tokensUsed: totalTokens,
        estimatedCost: String(estimatedCost),
        endpoint: 'ai.generate',
      });
    } catch (err) {
      aiLogger.warn({ err }, 'Failed to log AI usage to database');
    }

    aiLogger.info(
      {
        userId: ctx.user.userId,
        model: 'claude-sonnet-4-20250514',
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens,
        estimatedCost,
        duration: `${duration}ms`,
      },
      'AI generation completed',
    );

    return {
      text: result.text,
      tokensUsed: totalTokens,
      estimatedCost,
    };
  });
```

- [ ] **Step 2: Create `apps/api/src/routers/ai/index.ts`** (placeholder — usage router added in Task 3)

```ts
// apps/api/src/routers/ai/index.ts
import { router } from '../../trpc';
import { generateProcedure } from './generate';

// usageRouter will be added in Task 3
export const aiRouter = router({
  generate: generateProcedure,
});
```

- [ ] **Step 3: Update `apps/api/src/routers/index.ts`** to import from `./ai/index`

Change:

```ts
import { aiRouter } from './ai';
```

To:

```ts
import { aiRouter } from './ai/index';
```

- [ ] **Step 4: Delete `apps/api/src/routers/ai.ts`**

```bash
rm apps/api/src/routers/ai.ts
```

- [ ] **Step 5: Run existing AI tests to verify nothing broke**

```bash
bun test apps/api/src/__tests__/ai.test.ts
```

Expected: all tests pass (same count as before).

- [ ] **Step 6: Run full type-check**

```bash
bun turbo type-check --filter=@rpg-life/api
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routers/ai/ apps/api/src/routers/index.ts
git rm apps/api/src/routers/ai.ts
git commit -m "refactor(api): split ai.ts router into ai/ directory"
```

---

## Task 3: Implement `ai.usage` tRPC procedures (TDD)

**Files:**

- Create: `apps/api/src/__tests__/ai-usage.test.ts`
- Create: `apps/api/src/routers/ai/usage.ts`
- Modify: `apps/api/src/routers/ai/index.ts`

Context: Two `protectedProcedure` queries, both scoped to `ctx.user.userId`:

- `ai.usage.summary` — groups by model, returns totals + per-model breakdown
- `ai.usage.history` — groups by day using DATE_TRUNC, returns time series

**Critical implementation notes:**

- Drizzle returns `NUMERIC` columns as `string | null` — use `parseFloat(value ?? '0')` on all `estimatedCost` aggregates
- `DATE_TRUNC` returns a string from Neon's HTTP driver — serialize with `new Date(row.date).toISOString().slice(0, 10)`
- Divide-by-zero guards: `avgCostPerRequest = totalRequests === 0 ? 0 : totalCost / totalRequests`; `pct = totalCost === 0 ? 0 : (cost / totalCost) * 100`
- Derive `totalRequests`/`totalTokens`/`totalCost` by reducing over `byModel` (no second DB call)

- [ ] **Step 1: Write failing tests in `apps/api/src/__tests__/ai-usage.test.ts`**

```ts
import { describe, test, expect } from 'bun:test';
import { createCaller, createTestContext, createMockDb, createTestUser } from './helpers';

const now = new Date('2026-01-15T10:00:00Z');
const yesterday = new Date('2026-01-14T10:00:00Z');

// Mock DB rows for ai_usage_log
const row1 = {
  model: 'claude-sonnet-4-20250514',
  tokensUsed: 1000,
  estimatedCost: '0.003000',
  createdAt: now,
};
const row2 = {
  model: 'claude-sonnet-4-20250514',
  tokensUsed: 500,
  estimatedCost: '0.001500',
  createdAt: yesterday,
};
const rowNullCost = {
  model: 'claude-haiku',
  tokensUsed: 200,
  estimatedCost: null,
  createdAt: now,
};

// --- ai.usage.summary ---

describe('ai.usage.summary', () => {
  test('returns zero-valued summary when no rows', async () => {
    const db = createMockDb({ select: [[]] });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const result = await caller.ai.usage.summary({});

    expect(result.totalRequests).toBe(0);
    expect(result.totalTokens).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.avgCostPerRequest).toBe(0);
    expect(result.byModel).toEqual([]);
  });

  test('aggregates tokens and cost across models', async () => {
    // groupBy returns one row per model
    const db = createMockDb({
      select: [
        [
          {
            model: 'claude-sonnet-4-20250514',
            count: '2',
            totalTokens: '1500',
            totalCost: '0.004500',
          },
          { model: 'claude-haiku', count: '1', totalTokens: '200', totalCost: '0.000100' },
        ],
      ],
    });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const result = await caller.ai.usage.summary({});

    expect(result.totalRequests).toBe(3);
    expect(result.totalTokens).toBe(1700);
    expect(result.totalCost).toBeCloseTo(0.0046, 6);
    expect(result.byModel).toHaveLength(2);
    expect(result.byModel[0].model).toBe('claude-sonnet-4-20250514');
    expect(result.byModel[0].count).toBe(2);
  });

  test('handles null estimatedCost without NaN', async () => {
    const db = createMockDb({
      select: [[{ model: 'claude-haiku', count: '1', totalTokens: '200', totalCost: null }]],
    });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const result = await caller.ai.usage.summary({});

    expect(result.totalCost).toBe(0);
    expect(result.avgCostPerRequest).toBe(0);
    expect(Number.isNaN(result.totalCost)).toBe(false);
  });

  test('respects from/to date filters', async () => {
    // Procedure should pass date conditions to the query; mock returns empty
    // (the filter exclusion logic is in SQL — we verify the procedure
    // accepts date inputs and returns valid output shape)
    const db = createMockDb({ select: [[]] });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-31T23:59:59Z');
    const result = await caller.ai.usage.summary({ from, to });

    expect(result.totalRequests).toBe(0);
    expect(result.byModel).toEqual([]);
  });

  test('requires authentication', async () => {
    const caller = createCaller(createTestContext({ user: null }));
    await expect(caller.ai.usage.summary({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

// --- ai.usage.history ---

describe('ai.usage.history', () => {
  test('returns one entry per day ordered ascending', async () => {
    const db = createMockDb({
      select: [
        [
          {
            date: '2026-01-14T00:00:00.000Z',
            totalTokens: '500',
            totalCost: '0.001500',
            count: '1',
          },
          {
            date: '2026-01-15T00:00:00.000Z',
            totalTokens: '1200',
            totalCost: '0.003100',
            count: '2',
          },
        ],
      ],
    });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const result = await caller.ai.usage.history({});

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01-14');
    expect(result[1].date).toBe('2026-01-15');
    expect(result[0].tokens).toBe(500);
    expect(result[0].cost).toBeCloseTo(0.0015, 6);
  });

  test('serializes dates as YYYY-MM-DD strings', async () => {
    const db = createMockDb({
      select: [
        [
          {
            date: '2026-03-01T00:00:00.000Z',
            totalTokens: '100',
            totalCost: '0.000300',
            count: '1',
          },
        ],
      ],
    });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const result = await caller.ai.usage.history({});

    expect(result[0].date).toBe('2026-03-01');
    expect(typeof result[0].date).toBe('string');
  });

  test('respects from/to date filters', async () => {
    const db = createMockDb({ select: [[]] });
    const caller = createCaller(createTestContext({ db, user: createTestUser() }));
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-31T23:59:59Z');
    const result = await caller.ai.usage.history({ from, to });

    expect(result).toEqual([]);
  });

  test('requires authentication', async () => {
    const caller = createCaller(createTestContext({ user: null }));
    await expect(caller.ai.usage.history({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test apps/api/src/__tests__/ai-usage.test.ts
```

Expected: FAIL — `ai.usage.summary is not a function` (procedure doesn't exist yet).

- [ ] **Step 3: Create `apps/api/src/routers/ai/usage.ts`**

```ts
import { aiUsageLog } from '@rpg-life/db';
import { DateRangeInput } from '@rpg-life/shared/types';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { router, protectedProcedure } from '../../trpc';
import { Errors } from '../../lib/errors';

export const usageRouter = router({
  summary: protectedProcedure.input(DateRangeInput).query(async ({ ctx, input }) => {
    try {
      const conditions = [eq(aiUsageLog.userId, ctx.user.userId)];
      if (input.from) conditions.push(gte(aiUsageLog.createdAt, input.from));
      if (input.to) conditions.push(lte(aiUsageLog.createdAt, input.to));

      const rows = await ctx.db
        .select({
          model: aiUsageLog.model,
          count: sql<string | null>`cast(count(*) as text)`,
          totalTokens: sql<string | null>`cast(sum(${aiUsageLog.tokensUsed}) as text)`,
          totalCost: sql<string | null>`cast(sum(${aiUsageLog.estimatedCost}) as text)`,
        })
        .from(aiUsageLog)
        .where(and(...conditions))
        .groupBy(aiUsageLog.model);

      const byModel = rows.map((row) => ({
        model: row.model,
        count: parseInt(row.count ?? '0', 10),
        tokens: parseInt(row.totalTokens ?? '0', 10),
        cost: parseFloat(row.totalCost ?? '0'),
      }));

      const totalRequests = byModel.reduce((sum, r) => sum + r.count, 0);
      const totalTokens = byModel.reduce((sum, r) => sum + r.tokens, 0);
      const totalCost = byModel.reduce((sum, r) => sum + r.cost, 0);

      return {
        totalRequests,
        totalTokens,
        totalCost,
        avgCostPerRequest: totalRequests === 0 ? 0 : totalCost / totalRequests,
        byModel: byModel.map((r) => ({
          ...r,
          pct: totalCost === 0 ? 0 : (r.cost / totalCost) * 100,
        })),
      };
    } catch (err) {
      throw Errors.internal('Failed to fetch AI usage summary').toTRPCError();
    }
  }),

  history: protectedProcedure.input(DateRangeInput).query(async ({ ctx, input }) => {
    try {
      const conditions = [eq(aiUsageLog.userId, ctx.user.userId)];
      if (input.from) conditions.push(gte(aiUsageLog.createdAt, input.from));
      if (input.to) conditions.push(lte(aiUsageLog.createdAt, input.to));

      const rows = await ctx.db
        .select({
          date: sql<string | null>`date_trunc('day', ${aiUsageLog.createdAt})`,
          totalTokens: sql<string | null>`cast(sum(${aiUsageLog.tokensUsed}) as text)`,
          totalCost: sql<string | null>`cast(sum(${aiUsageLog.estimatedCost}) as text)`,
          count: sql<string | null>`cast(count(*) as text)`,
        })
        .from(aiUsageLog)
        .where(and(...conditions))
        .groupBy(sql`date_trunc('day', ${aiUsageLog.createdAt})`)
        .orderBy(sql`date_trunc('day', ${aiUsageLog.createdAt})`);

      return rows.map((row) => ({
        date: new Date(row.date).toISOString().slice(0, 10),
        tokens: parseInt(row.totalTokens ?? '0', 10),
        cost: parseFloat(row.totalCost ?? '0'),
        count: parseInt(row.count ?? '0', 10),
      }));
    } catch (err) {
      throw Errors.internal('Failed to fetch AI usage history').toTRPCError();
    }
  }),
});
```

- [ ] **Step 4: Update `apps/api/src/routers/ai/index.ts`** to merge both routers

`generate.ts` now exports `generateProcedure` (a procedure, not a router). Compose it with `usageRouter` cleanly:

```ts
// apps/api/src/routers/ai/index.ts
import { router } from '../../trpc';
import { generateProcedure } from './generate';
import { usageRouter } from './usage';

export const aiRouter = router({
  generate: generateProcedure,
  usage: usageRouter,
});
```

This exposes `ai.generate`, `ai.usage.summary`, and `ai.usage.history` on the merged router without touching any `_def` internals.

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun test apps/api/src/__tests__/ai-usage.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 6: Run the full API test suite to confirm no regressions**

```bash
bun test apps/api/src/__tests__/
```

Expected: all tests pass.

- [ ] **Step 7: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/api
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/routers/ai/ apps/api/src/__tests__/ai-usage.test.ts
git commit -m "feat(api): add ai.usage.summary and ai.usage.history tRPC procedures"
```

---

## Task 4: Build chart components

**Files:**

- Create: `apps/web/src/components/ai-usage-charts.tsx`

Context: Two isolated recharts components used by the usage page. Both are client components. `ResponsiveContainer` makes charts fill their parent. recharts 2.15.4 is already installed in `apps/web`.

- [ ] **Step 1: Create `apps/web/src/components/ai-usage-charts.tsx`**

```tsx
'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export type UsageHistoryPoint = {
  date: string;
  tokens: number;
  cost: number;
  count: number;
};

export function TokensOverTimeChart({ data }: { data: UsageHistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data for selected range
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Tokens']} />
        <Line
          type="monotone"
          dataKey="tokens"
          stroke="hsl(var(--primary))"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CostOverTimeChart({ data }: { data: UsageHistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data for selected range
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(4)}`} />
        <Tooltip formatter={(value: number) => [`$${value.toFixed(6)}`, 'Cost']} />
        <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ai-usage-charts.tsx
git commit -m "feat(web): add TokensOverTimeChart and CostOverTimeChart components"
```

---

## Task 5: Build the AI Usage page

**Files:**

- Create: `apps/web/src/app/(dashboard)/ai/usage/page.tsx`

Context: Client component. Fetches `ai.usage.summary` and `ai.usage.history` via tRPC. Date range filter drives both queries. Manual refresh via `refetch()`.

- [ ] **Step 1: Create `apps/web/src/app/(dashboard)/ai/usage/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@rpg-life/shared/api-client';
import { toast } from 'sonner';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TokensOverTimeChart, CostOverTimeChart } from '@/components/ai-usage-charts';

type Preset = '7d' | '30d' | '90d' | 'all';

function presetToDates(preset: Preset): { from?: Date; to?: Date } {
  if (preset === 'all') return {};
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from };
}

const PRESETS: { label: string; value: Preset }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All time', value: 'all' },
];

export default function AIUsagePage() {
  const [preset, setPreset] = useState<Preset>('all');
  const dateRange = presetToDates(preset);

  const summary = trpc.ai.usage.summary.useQuery(dateRange, {
    onError: (err) => toast.error(err.message),
  });
  const history = trpc.ai.usage.history.useQuery(dateRange, {
    onError: (err) => toast.error(err.message),
  });

  function handleRefresh() {
    summary.refetch();
    history.refetch();
  }

  const s = summary.data;
  const h = history.data ?? [];
  const isLoading = summary.isLoading || history.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart2 className="h-6 w-6" />
            AI Usage
          </h1>
          <p className="text-muted-foreground">Your token consumption and cost over time</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date range filter */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={preset === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={s?.totalRequests ?? 0}
          loading={isLoading}
          format="number"
        />
        <StatCard
          title="Total Tokens"
          value={s?.totalTokens ?? 0}
          loading={isLoading}
          format="number"
        />
        <StatCard title="Total Cost" value={s?.totalCost ?? 0} loading={isLoading} format="cost" />
        <StatCard
          title="Avg Cost / Request"
          value={s?.avgCostPerRequest ?? 0}
          loading={isLoading}
          format="cost"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tokens Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : <TokensOverTimeChart data={h} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cost Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : <CostOverTimeChart data={h} />}
          </CardContent>
        </Card>
      </div>

      {/* Model breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">By Model</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !s || s.byModel.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No usage data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Model</th>
                  <th className="pb-2 text-right font-medium">Requests</th>
                  <th className="pb-2 text-right font-medium">Tokens</th>
                  <th className="pb-2 text-right font-medium">Cost</th>
                  <th className="pb-2 text-right font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {s.byModel.map((row) => (
                  <tr key={row.model} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{row.model}</td>
                    <td className="py-2 text-right">{row.count.toLocaleString()}</td>
                    <td className="py-2 text-right">{row.tokens.toLocaleString()}</td>
                    <td className="py-2 text-right">${row.cost.toFixed(6)}</td>
                    <td className="py-2 text-right">{row.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  format,
}: {
  title: string;
  value: number;
  loading: boolean;
  format: 'number' | 'cost';
}) {
  const display = format === 'cost' ? `$${value.toFixed(4)}` : value.toLocaleString();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold">{display}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/ai/usage/page.tsx
git commit -m "feat(web): add AI usage analytics dashboard page"
```

---

## Task 6: Update sidebar nav

**Files:**

- Modify: `apps/web/src/components/app-sidebar.tsx`

Three changes needed:

1. Add `BarChart2` to lucide-react imports
2. Add `AI Usage` nav item after `AI Playground`
3. Fix `isActive` to exclude `/ai` from prefix matching (prevents `/ai` highlighting when on `/ai/usage`)

- [ ] **Step 1: Update the sidebar**

In `apps/web/src/components/app-sidebar.tsx`:

**Change the lucide-react import** (add `BarChart2`):

```ts
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  BarChart2,
  Settings,
  LogOut,
  ChevronsUpDown,
  Zap,
} from 'lucide-react';
```

**Change `navItems`** (add AI Usage entry):

```ts
const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', href: '/projects', icon: FolderKanban },
  { title: 'AI Playground', href: '/ai', icon: Sparkles },
  { title: 'AI Usage', href: '/ai/usage', icon: BarChart2 },
  { title: 'Settings', href: '/settings', icon: Settings },
];
```

**Change the `isActive` expression** (add `/ai` to exclusion list):

```tsx
isActive={
  pathname === item.href ||
  (item.href !== '/dashboard' && item.href !== '/ai' && pathname.startsWith(item.href))
}
```

- [ ] **Step 2: Type-check**

```bash
bun turbo type-check --filter=@rpg-life/web
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
bun turbo test
```

Expected: all tests pass, 0 failures.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/app-sidebar.tsx
git commit -m "feat(web): add AI Usage nav link and fix sidebar isActive for /ai"
```
