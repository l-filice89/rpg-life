import { describe, test, expect } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf-8'));
}

describe('workspace configuration', () => {
  test('turbo dev concurrency exceeds persistent task count', () => {
    const rootPkg = readJson('package.json');
    const devScript: string = rootPkg.scripts?.dev ?? '';
    const turboJson = readJson('turbo.json');

    // Count persistent tasks
    const persistentTasks = Object.entries(turboJson.tasks ?? {}).filter(
      ([_, config]: [string, any]) => (config as any).persistent === true,
    );

    // Extract --concurrency value from dev script, default to 10 if not set
    const concurrencyMatch = devScript.match(/--concurrency\s+(\d+)/);
    const concurrency = concurrencyMatch ? parseInt(concurrencyMatch[1], 10) : 10;

    expect(concurrency).toBeGreaterThan(persistentTasks.length);
  });

  test('desktop app main field matches electron-vite output directory', () => {
    const desktopPkg = readJson('apps/desktop/package.json');
    const mainField: string = desktopPkg.main;
    // electron-vite outputs to out/ by default
    expect(mainField).toStartWith('out/');
  });

  test('api dev script loads root env file', () => {
    const apiPkg = readJson('apps/api/package.json');
    const devScript: string = apiPkg.scripts?.dev ?? '';
    expect(devScript).toContain('--env-file');
  });

  test('all workspace packages have a dev script', () => {
    const rootPkg = readJson('package.json');
    const workspacePatterns: string[] = rootPkg.workspaces;

    for (const pattern of workspacePatterns) {
      const baseDir = pattern.replace('/*', '');
      const entries = Bun.spawnSync(['ls', join(ROOT, baseDir)])
        .stdout.toString()
        .trim()
        .split('\n');

      for (const entry of entries) {
        const pkgPath = join(ROOT, baseDir, entry, 'package.json');
        if (!existsSync(pkgPath)) continue;

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        expect(pkg.scripts?.dev).toBeDefined();
      }
    }
  });

  test('no port conflicts in dev scripts', () => {
    const rootPkg = readJson('package.json');
    const workspacePatterns: string[] = rootPkg.workspaces;
    const ports: Map<number, string> = new Map();

    for (const pattern of workspacePatterns) {
      const baseDir = pattern.replace('/*', '');
      const entries = Bun.spawnSync(['ls', join(ROOT, baseDir)])
        .stdout.toString()
        .trim()
        .split('\n');

      for (const entry of entries) {
        const pkgPath = join(ROOT, baseDir, entry, 'package.json');
        if (!existsSync(pkgPath)) continue;

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const devScript: string = pkg.scripts?.dev ?? '';

        // Match --port NNNN patterns
        const portMatch = devScript.match(/--port\s+(\d+)/);
        if (portMatch) {
          const port = parseInt(portMatch[1], 10);
          const existingPkg = ports.get(port);
          expect(existingPkg).toBeUndefined();
          ports.set(port, pkg.name);
        }
      }
    }
  });

  test('mobile-main has expo-asset dependency', () => {
    const mobilePkg = readJson('apps/mobile-main/package.json');
    const allDeps = {
      ...mobilePkg.dependencies,
      ...mobilePkg.devDependencies,
    };
    expect(allDeps['expo-asset']).toBeDefined();
  });
});
