import path from 'node:path';
import { mkdirSync } from 'node:fs';

/**
 * Test setup — sets required environment variables before any test imports.
 * Runs via Bun's preload mechanism before test files are loaded.
 */
const testDbDir = path.join(import.meta.dir, '../../../.tmp');
mkdirSync(testDbDir, { recursive: true });

process.env.DATABASE_URL = `file:${path.join(testDbDir, 'auth-test.db')}`;
process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret-at-least-32-chars';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 're_test_key';
process.env.EMAIL_FROM = 'onboarding@resend.dev';
process.env.NODE_ENV = 'test';
