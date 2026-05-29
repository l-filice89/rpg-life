import { describe, test, expect } from 'bun:test';
import { auth } from '../server';

describe('auth server instance', () => {
  test('auth is exported and is an object', () => {
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('object');
  });

  test('auth.api has getSession method', () => {
    expect(auth.api).toBeDefined();
    expect(typeof auth.api.getSession).toBe('function');
  });

  test('auth.handler is a function', () => {
    expect(typeof auth.handler).toBe('function');
  });
});

describe('auth server config', () => {
  const options = (auth as unknown as { options: Record<string, unknown> }).options;

  test('emailAndPassword is disabled (magic link only)', () => {
    expect((options.emailAndPassword as { enabled: boolean }).enabled).toBe(false);
  });

  test('session config has 7-day expiry', () => {
    const session = options.session as { expiresIn: number; updateAge: number };
    expect(session.expiresIn).toBe(60 * 60 * 24 * 7);
    expect(session.updateAge).toBe(60 * 60 * 24);
  });

  test('magic link plugin is configured', () => {
    const plugins = options.plugins as { id: string }[];
    expect(plugins).toBeArray();
    const magicLinkPlugin = plugins.find((p) => p.id === 'magic-link');
    expect(magicLinkPlugin).toBeDefined();
  });

  test('databaseHooks provision user_progress on user and session create', () => {
    const hooks = options.databaseHooks as {
      user?: { create?: { after?: unknown } };
      session?: { create?: { after?: unknown } };
    };
    expect(typeof hooks.user?.create?.after).toBe('function');
    expect(typeof hooks.session?.create?.after).toBe('function');
  });

  test('baseURL uses BETTER_AUTH_URL', () => {
    expect(options.baseURL).toBe(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000');
  });

  test('trustedOrigins includes BETTER_AUTH_URL', () => {
    const trustedOrigins = options.trustedOrigins as string[];
    expect(trustedOrigins).toContain(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000');
  });

  test('advanced.database.generateId is a function', () => {
    const advanced = options.advanced as {
      database: { generateId: () => string };
    };
    expect(typeof advanced.database.generateId).toBe('function');
    expect(advanced.database.generateId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
