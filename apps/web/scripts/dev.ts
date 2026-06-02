import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(appRoot, '../..');
const port = process.env.PORT_WEB ?? '3000';

// Resolve the Next.js JS entrypoint directly from the package — avoids
// platform-specific .bin wrappers (.exe on Windows, symlinks on Unix).
const nextCandidates = [
  path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
  path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
];
const nextBin = nextCandidates.find((c) => existsSync(c));

if (!nextBin) {
  console.error('Could not find next binary. Run `bun install` from the repo root.');
  process.exit(1);
}

const envFiles = ['.env', '.env.local']
  .map((name) => path.join(repoRoot, name))
  .filter((filePath) => existsSync(filePath));

const command = [
  'bun',
  ...envFiles.flatMap((file) => ['--env-file', file]),
  nextBin,
  'dev',
  '--turbopack',
  '--port',
  port,
];

console.log('\n⏳ Next.js dev server starting (first compile may take 1–3 minutes)…\n');

const proc = Bun.spawn(command, {
  cwd: appRoot,
  env: process.env,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});

process.on('SIGINT', () => proc.kill());
process.on('SIGTERM', () => proc.kill());

const code = await proc.exited;
process.exit(code ?? 1);
