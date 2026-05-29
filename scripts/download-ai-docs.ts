#!/usr/bin/env bun
/**
 * Download llms.txt reference docs for AI-assisted development.
 * Fetches documentation from all major dependencies into .claude/docs/.
 *
 * Usage: bun scripts/download-ai-docs.ts
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS_DIR = join(import.meta.dir, '..', '.claude', 'docs');

const SOURCES: { name: string; url: string; filename: string }[] = [
  { name: 'Hono', url: 'https://hono.dev/llms-full.txt', filename: 'hono.txt' },
  { name: 'Drizzle', url: 'https://orm.drizzle.team/llms-full.txt', filename: 'drizzle.txt' },
  { name: 'tRPC', url: 'https://trpc.io/llms-full.txt', filename: 'trpc.txt' },
  { name: 'Better Auth', url: 'https://www.better-auth.com/llms.txt', filename: 'better-auth.txt' },
  { name: 'Bun', url: 'https://bun.sh/llms-full.txt', filename: 'bun.txt' },
  { name: 'Turborepo', url: 'https://turborepo.dev/llms-full.txt', filename: 'turborepo.txt' },
  { name: 'Zod', url: 'https://zod.dev/llms-full.txt', filename: 'zod.txt' },
  { name: 'Next.js', url: 'https://nextjs.org/docs/llms-full.txt', filename: 'nextjs.txt' },
  { name: 'Expo', url: 'https://docs.expo.dev/llms-full.txt', filename: 'expo.txt' },
  { name: 'React', url: 'https://react.dev/llms.txt', filename: 'react.txt' },
  { name: 'Neon', url: 'https://neon.com/llms.txt', filename: 'neon.txt' },
  { name: 'Vercel', url: 'https://vercel.com/llms.txt', filename: 'vercel.txt' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  mkdirSync(DOCS_DIR, { recursive: true });

  console.log(`Downloading ${SOURCES.length} llms.txt files to .claude/docs/\n`);

  let succeeded = 0;
  let failed = 0;

  for (const source of SOURCES) {
    const filepath = join(DOCS_DIR, source.filename);
    try {
      const res = await fetch(source.url);
      if (!res.ok) {
        console.log(`  SKIP  ${source.name} — HTTP ${res.status}`);
        failed++;
        continue;
      }
      const text = await res.text();
      // Verify we got text content, not an HTML error page
      if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        console.log(`  SKIP  ${source.name} — received HTML instead of text`);
        failed++;
        continue;
      }
      await Bun.write(filepath, text);
      console.log(`  OK    ${source.name.padEnd(12)} ${formatSize(text.length)}`);
      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL  ${source.name} — ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone: ${succeeded} downloaded, ${failed} skipped.`);
}

main();
