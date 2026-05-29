import { describe, expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const readmePath = join(process.cwd(), 'README.md');
const aiLogPath = join(process.cwd(), 'docs', 'ai-integration-log.md');
const envExamplePath = join(process.cwd(), '.env.example');

describe('Documentation gate (ATDD — SC6)', () => {
  test.skip('[P0] README includes setup instructions for local development', () => {
    expect(existsSync(readmePath)).toBe(true);
    const readme = readFileSync(readmePath, 'utf8').toLowerCase();
    expect(readme).toContain('docker');
    expect(readme).toContain('env');
    expect(readme).toMatch(/bun|install|setup/);
  });

  test.skip('[P1] AI integration log exists', () => {
    expect(existsSync(aiLogPath)).toBe(true);
  });

  test.skip('[P1] .env.example documents required variables', () => {
    expect(existsSync(envExamplePath)).toBe(true);
    const envExample = readFileSync(envExamplePath, 'utf8');
    expect(envExample).toContain('DATABASE_URL');
    expect(envExample).toContain('BETTER_AUTH_SECRET');
    expect(envExample).toContain('RESEND_API_KEY');
  });
});
