import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(import.meta.dir, '../../..');

describe('Story 4.4 docker deployment verification', () => {
  test('smoke script exists and validates key docker endpoints', () => {
    const script = readFileSync(path.join(repoRoot, 'scripts/smoke-docker.sh'), 'utf8');
    expect(script).toContain('docker compose up -d --build');
    expect(script).toContain('http://localhost:3002/health');
    expect(script).toContain('http://localhost:3000/');
    expect(script).toContain('/api/trpc/health');
    expect(script).toContain('docker compose down');
  });

  test('compose file persists sqlite with repo bind mount', () => {
    const compose = readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf8');
    expect(compose).toContain('./data:/data');
  });

  test('web README documents docker workflow and safe cleanup guidance', () => {
    const readme = readFileSync(path.join(repoRoot, 'apps/web/README.md'), 'utf8');
    expect(readme).toContain('Run these Docker commands from the monorepo root');
    expect(readme).toContain('bash scripts/smoke-docker.sh');
    expect(readme).toContain('docker compose down');
    expect(readme).toContain('rm -f ./data/rpg-life.db');
  });
});
