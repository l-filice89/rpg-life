import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT_WEB ?? '3000';

const proc = Bun.spawn(['bunx', 'next', 'dev', '--port', port], {
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
