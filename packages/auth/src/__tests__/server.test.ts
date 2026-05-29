import { describe, test, expect } from 'bun:test';
import { auth } from '../server';
import type { Auth } from '../server';

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

  test('Auth type is re-exported from index', async () => {
    const indexModule = await import('../index');
    expect(indexModule.auth).toBe(auth);
  });
});

describe('auth server config', () => {
  test('auth.options has emailAndPassword enabled', () => {
    const options = (auth as unknown as { options: Record<string, unknown> }).options;
    expect(options).toBeDefined();
    expect((options.emailAndPassword as { enabled: boolean }).enabled).toBe(true);
  });

  test('auth.options has session config with 7-day expiry', () => {
    const options = (auth as unknown as { options: Record<string, unknown> }).options;
    const session = options.session as { expiresIn: number; updateAge: number };
    expect(session.expiresIn).toBe(60 * 60 * 24 * 7); // 7 days
    expect(session.updateAge).toBe(60 * 60 * 24); // 1 day
  });

  test('auth.options has bearer plugin configured', () => {
    const options = (auth as unknown as { options: Record<string, unknown> }).options;
    const plugins = options.plugins as { id: string }[];
    expect(plugins).toBeArray();
    const bearerPlugin = plugins.find((p) => p.id === 'bearer');
    expect(bearerPlugin).toBeDefined();
  });

  test('auth.options has role in user additionalFields', () => {
    const options = (auth as unknown as { options: Record<string, unknown> }).options;
    const user = options.user as { additionalFields: Record<string, unknown> };
    expect(user.additionalFields.role).toBeDefined();
    const role = user.additionalFields.role as {
      type: string;
      defaultValue: string;
      input: boolean;
    };
    expect(role.type).toBe('string');
    expect(role.defaultValue).toBe('user');
    expect(role.input).toBe(false);
  });
});

describe('auth Drizzle adapter config', () => {
  const options = (auth as unknown as { options: Record<string, unknown> }).options;

  test('database adapter is configured', () => {
    expect(options.database).toBeDefined();
    expect(typeof options.database).toBe('function');
  });

  test('baseURL defaults to localhost:3002', () => {
    const baseURL = options.baseURL as string;
    expect(baseURL).toBe(process.env.BETTER_AUTH_URL ?? 'http://localhost:3002');
  });

  test('trustedOrigins includes web and marketing URLs', () => {
    const trustedOrigins = options.trustedOrigins as string[];
    expect(trustedOrigins).toBeArray();
    expect(trustedOrigins).toContain(process.env.WEB_URL ?? 'http://localhost:3000');
    expect(trustedOrigins).toContain(process.env.MARKETING_URL ?? 'http://localhost:3001');
  });

  test('advanced.database.generateId is set to uuid', () => {
    const advanced = options.advanced as {
      database: { generateId: string };
    };
    expect(advanced.database.generateId).toBe('uuid');
  });

  test('secret is set from BETTER_AUTH_SECRET env var', () => {
    expect(options.secret).toBe(process.env.BETTER_AUTH_SECRET);
  });
});
