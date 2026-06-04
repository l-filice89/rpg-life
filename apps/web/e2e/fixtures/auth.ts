import { test as base, request } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

type SessionOptions = {
  email?: string;
  /** Set the user's Focus balance before the spec runs (optional). */
  focusBalance?: number;
};

function createScopedTestEmail(scope: string): string {
  const sanitized = scope
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `e2e-${sanitized || 'spec'}@rpg-life.test`;
}

export function createTestEmail(scope: string): string {
  return createScopedTestEmail(scope);
}

/**
 * Calls POST /api/auth/test-session (proxied through Next.js → Hono API).
 * Returns the `BrowserContext` with the session cookie injected.
 */
async function createAuthenticatedContext(
  ctx: BrowserContext,
  opts: SessionOptions = {},
): Promise<void> {
  const req = await request.newContext({ baseURL: BASE_URL });

  try {
    const resolvedEmail = opts.email ?? createScopedTestEmail(crypto.randomUUID());
    const res = await req.post('/api/auth/test-session', {
      data: {
        email: resolvedEmail,
        ...(opts.focusBalance !== undefined ? { focusBalance: opts.focusBalance } : {}),
      },
    });

    if (!res.ok()) {
      throw new Error(
        `test-session failed: HTTP ${res.status()} — ${await res.text()}`,
      );
    }

    // Parse the Set-Cookie header and inject cookies into the browser context.
    // The Next.js rewrite proxies /api/auth/* → port 3002, so the cookie is
    // scoped to localhost:3000. We add it manually so the browser sends it on
    // every subsequent navigation.
    const setCookieHeader = res.headers()['set-cookie'];
    if (!setCookieHeader) {
      throw new Error('test-session failed: missing Set-Cookie header');
    }

    const cookies = parseCookieHeader(setCookieHeader);
    if (cookies.length === 0) {
      throw new Error('test-session failed: could not parse Set-Cookie header');
    }

    await ctx.addCookies(cookies);
  } finally {
    await req.dispose();
  }
}

/** Minimal Set-Cookie parser that handles the single-value case returned by our endpoint. */
function parseCookieHeader(
  header: string,
): { name: string; value: string; domain: string; path: string; httpOnly: boolean; sameSite: 'Lax' | 'Strict' | 'None' }[] {
  return header.split(/\n|,(?=[^;]+=)/).flatMap((segment) => {
    const parts = segment.trim().split(';');
    if (!parts[0]) return [];
    const nameValue = parts[0].trim();
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx === -1) return [];
    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();
    return [
      {
        name,
        value,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax' as const,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export const test = base.extend<{
  testEmail: string;
  authenticatedPage: import('@playwright/test').Page;
}>({
  testEmail: async ({}, use, testInfo) => {
    await use(createScopedTestEmail(`${testInfo.testId}-${testInfo.workerIndex}`));
  },
  authenticatedPage: async ({ browser, testEmail }, use) => {
    const ctx = await browser.newContext();
    await createAuthenticatedContext(ctx, { email: testEmail });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

/**
 * Creates an authenticated context with custom session options (e.g. focusBalance).
 * Use this when you need more control than the default `authenticatedPage` fixture.
 */
export async function createAuthPage(
  browser: import('@playwright/test').Browser,
  opts: SessionOptions = {},
): Promise<{ page: import('@playwright/test').Page; context: BrowserContext }> {
  const ctx = await browser.newContext();
  await createAuthenticatedContext(ctx, opts);
  const page = await ctx.newPage();
  return { page, context: ctx };
}

export { expect } from '@playwright/test';
