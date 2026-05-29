/**
 * Test setup — sets required environment variables before any test imports.
 * Runs via Bun's preload mechanism before test files are loaded.
 */
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret-at-least-32-chars';
process.env.BETTER_AUTH_URL = 'http://localhost:3002';
process.env.NODE_ENV = 'test';
