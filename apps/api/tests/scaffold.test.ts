import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(import.meta.dir, '../../..');

describe('Story 1.1 scaffold smoke', () => {
  test('docker compose defines web and api services', () => {
    const compose = readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf8');
    expect(compose).toContain('web:');
    expect(compose).toContain('api:');
    expect(compose).toContain("'3000:3000'");
    expect(compose).toContain("'3002:3002'");
    expect(compose).toContain('./data:/data');
  });

  test('.env.example documents required variables', () => {
    const envExample = readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    for (const key of [
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'RESEND_API_KEY',
      'EMAIL_FROM',
      'API_URL',
    ]) {
      expect(envExample).toContain(key);
    }
  });

  test('Next.js rewrites proxy auth and trpc routes', () => {
    const nextConfig = readFileSync(path.join(repoRoot, 'apps/web/next.config.ts'), 'utf8');
    expect(nextConfig).toContain('/api/auth/:path*');
    expect(nextConfig).toContain('/api/trpc/:path*');
  });

  test('initial migration creates user_progress table', () => {
    const migration = readFileSync(
      path.join(repoRoot, 'packages/db/migrations/0000_init.sql'),
      'utf8',
    );
    expect(migration).toContain('CREATE TABLE `user_progress`');
    expect(migration).toContain('focus_balance');
    expect(migration).toContain('tutorial_seen_at');
  });
});
