import type { Context } from 'hono';
import {
  createTaskForOwner,
  db,
  eq,
  listOpenTasksByOwner,
  session as sessionTable,
  softDeleteTaskForOwner,
  tasks,
  userProgress,
  users,
} from '@rpg-life/db';
import { logger } from '../lib/logger';

/**
 * Signs a cookie value using HMAC-SHA256, producing the same format as
 * Hono's serializeSigned: encodeURIComponent(`${value}.${base64Signature}`).
 * better-auth uses Hono's signed-cookie helpers, so we must match exactly.
 */
async function signCookieValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return encodeURIComponent(`${value}.${base64Sig}`);
}

/**
 * Extracts the raw session token from a signed cookie value. better-auth stores
 * the cookie as encodeURIComponent(`${token}.${signature}`); the raw token (a
 * UUID with no dots) is everything before the final dot once URL-decoded. Falls
 * back to the input unchanged for unsigned values.
 */
function extractRawSessionToken(cookieValue: string): string {
  const decoded = decodeURIComponent(cookieValue);
  const sigIdx = decoded.lastIndexOf('.');
  return sigIdx > 0 ? decoded.slice(0, sigIdx) : decoded;
}

type TestSessionBody = {
  email?: string;
  focusBalance?: number;
};

type SessionUser = {
  id: string;
  email: string;
};

function getCookieValue(header: string | undefined, key: string): string | undefined {
  if (!header) {
    return undefined;
  }

  const target = `${key}=`;
  for (const segment of header.split(';')) {
    const trimmed = segment.trim();
    if (trimmed.startsWith(target)) {
      return trimmed.slice(target.length);
    }
  }
  return undefined;
}

async function resolveSessionUser(c: Context): Promise<SessionUser | null> {
  const cookieHeader = c.req.header('cookie') ?? c.req.header('Cookie');
  const rawCookieValue = getCookieValue(cookieHeader, 'better-auth.session_token');
  if (!rawCookieValue) {
    return null;
  }
  const token = extractRawSessionToken(rawCookieValue);

  const [sessionRow] = await db
    .select({ userId: sessionTable.userId, expiresAt: sessionTable.expiresAt })
    .from(sessionTable)
    .where(eq(sessionTable.token, token))
    .limit(1);

  if (!sessionRow) {
    return null;
  }

  const expiresAtMs =
    sessionRow.expiresAt instanceof Date
      ? sessionRow.expiresAt.getTime()
      : Number(sessionRow.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null;
  }

  const [userRow] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, sessionRow.userId))
    .limit(1);

  return userRow ?? null;
}

/**
 * POST /api/auth/test-session
 *
 * Test-only endpoint: upserts a user + user_progress row, creates a
 * better-auth session, and returns the session cookie via Set-Cookie.
 *
 * STRICTLY gated to NODE_ENV=test — returns 403 in all other environments.
 */
export async function testSessionHandler(c: Context): Promise<Response> {
  if (process.env.NODE_ENV !== 'test') {
    logger.warn({ path: c.req.path }, 'test-session: rejected — not in test environment');
    return c.json({ error: 'forbidden' }, 403);
  }

  let body: TestSessionBody;
  try {
    body = await c.req.json<TestSessionBody>();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }

  const { email, focusBalance } = body;

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'email is required' }, 400);
  }

  const now = new Date();

  // --- Upsert user atomically (idempotent by unique email) ---
  await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: 'E2E Test User',
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  const [resolvedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!resolvedUser) {
    logger.error({ path: c.req.path }, 'test-session: user upsert failed unexpectedly');
    return c.json({ error: 'failed to provision test user' }, 500);
  }
  const userId = resolvedUser.id;
  logger.info({ userId }, 'test-session: user ensured');

  // --- Upsert user_progress (idempotent) ---
  // tutorialSeenAt is set so the tutorial overlay does not interfere with specs.
  await db
    .insert(userProgress)
    .values({
      userId,
      focusBalance: focusBalance ?? 0,
      tutorialSeenAt: now.toISOString(),
      modifiedAt: now.toISOString(),
    })
    .onConflictDoNothing();

  // If the caller requests a specific focus balance, overwrite regardless of
  // whether the row was just inserted or already existed.
  if (focusBalance !== undefined) {
    await db
      .update(userProgress)
      .set({ focusBalance, modifiedAt: now.toISOString() })
      .where(eq(userProgress.userId, userId));
    logger.info({ userId, focusBalance }, 'test-session: focus balance updated');
  }

  // --- Create a better-auth compatible session ---
  // The token is stored raw in the session table; better-auth reads it by
  // matching the cookie value to session.token on every request.
  const token = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 24 * 7 * 1_000); // 7 days

  await db.insert(sessionTable).values({
    id: sessionId,
    token,
    userId,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  logger.info({ userId, sessionId }, 'test-session: session created');

  const maxAge = 60 * 60 * 24 * 7;
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  const signedToken = await signCookieValue(token, secret);
  c.header(
    'Set-Cookie',
    `better-auth.session_token=${signedToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
  );

  return c.json({ userId });
}

// ---------------------------------------------------------------------------
// Test-seed endpoint
// ---------------------------------------------------------------------------

type SkillCode = 'concentration' | 'vitality' | 'lore' | 'presence' | 'order' | 'resolve' | 'craft';

type TestSeedBody = {
  email?: string;
  action: 'create-quest' | 'delete-quest' | 'delete-all-quests';
  quest?: {
    title: string;
    difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
    skillCodes: SkillCode[];
    dueDate?: string | null;
  };
  taskId?: string;
};

/**
 * POST /api/auth/test-seed
 *
 * Test-only endpoint: creates or deletes quests for a given user.
 * STRICTLY gated to NODE_ENV=test.
 */
export async function testSeedHandler(c: Context): Promise<Response> {
  if (process.env.NODE_ENV !== 'test') {
    logger.warn({ path: c.req.path }, 'test-seed: rejected — not in test environment');
    return c.json({ error: 'forbidden' }, 403);
  }

  let body: TestSeedBody;
  try {
    body = await c.req.json<TestSeedBody>();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }

  const { email, action } = body;
  const sessionUser = await resolveSessionUser(c);
  if (!sessionUser) {
    return c.json({ error: 'unauthorized — valid test session required' }, 401);
  }

  if (email !== undefined && (typeof email !== 'string' || email !== sessionUser.email)) {
    return c.json({ error: 'email must match authenticated session user' }, 403);
  }

  const userId = sessionUser.id;

  if (action === 'create-quest') {
    const quest = body.quest;
    if (!quest) {
      return c.json({ error: 'quest payload required for create-quest action' }, 400);
    }
    const task = await createTaskForOwner(db, userId, {
      title: quest.title,
      difficulty: quest.difficulty,
      skillCodes: quest.skillCodes,
      dueDate: quest.dueDate ?? null,
    });
    logger.info({ userId, taskId: task.id }, 'test-seed: quest created');
    return c.json({ taskId: task.id });
  }

  if (action === 'delete-quest') {
    const taskId = body.taskId;
    if (!taskId) {
      return c.json({ error: 'taskId required for delete-quest action' }, 400);
    }
    await softDeleteTaskForOwner(db, userId, taskId);
    logger.info({ userId, taskId }, 'test-seed: quest deleted');
    return c.json({ ok: true });
  }

  if (action === 'delete-all-quests') {
    const openTasks = await listOpenTasksByOwner(db, userId);
    await db.transaction(async (tx) => {
      for (const task of openTasks) {
        const nowIso = new Date().toISOString();
        await tx
          .update(tasks)
          .set({ deletedAt: nowIso, modifiedAt: nowIso })
          .where(eq(tasks.id, task.id));
      }
    });
    logger.info({ userId, count: openTasks.length }, 'test-seed: all open quests deleted');
    return c.json({ deleted: openTasks.length });
  }

  return c.json({ error: `unknown action: ${String(action)}` }, 400);
}
