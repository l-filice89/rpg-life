/**
 * Dev server launcher with automatic port conflict resolution.
 */
import net from 'net';

const SERVICES = [
  { key: 'PORT_WEB', default: 3000, label: 'Web         ' },
  { key: 'PORT_API', default: 3002, label: 'API         ' },
] as const;

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findFreePort(start: number, taken: Set<number>): Promise<number> {
  let port = start;
  while (taken.has(port) || !(await isPortFree(port))) {
    port++;
  }
  return port;
}

const taken = new Set<number>();
const resolved: Record<string, string> = {};
const lines: string[] = [];

for (const { key, default: defaultPort, label } of SERVICES) {
  const requested = process.env[key] ? Number(process.env[key]) : defaultPort;
  const port = await findFreePort(requested, taken);
  taken.add(port);
  resolved[key] = String(port);
  const note = port !== defaultPort ? `  ← was :${defaultPort}` : '';
  lines.push(`  ${label} :${port}${note}`);
}

console.log('\n📡 Dev ports:\n' + lines.join('\n') + '\n');

const proc = Bun.spawn(['node_modules/.bin/turbo', 'dev', '--filter=@rpg-life/web', '--filter=@rpg-life/server', '--concurrency', '5'], {
  env: { ...process.env, ...resolved, API_URL: `http://localhost:${resolved.PORT_API}` },
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});

process.on('SIGINT', () => proc.kill());
process.on('SIGTERM', () => proc.kill());

await proc.exited;
