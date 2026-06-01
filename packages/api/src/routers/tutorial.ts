import { eq, userProgress } from '@rpg-life/db';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';

async function getProgressRow(db: Context['db'], userId: string) {
  const rows = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export const tutorialRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const row = await getProgressRow(ctx.db, ctx.user.id);
    return { seen: row?.tutorialSeenAt != null };
  }),

  markSeen: protectedProcedure.mutation(async ({ ctx }) => {
    const row = await getProgressRow(ctx.db, ctx.user.id);
    const now = new Date().toISOString();

    if (row?.tutorialSeenAt != null) {
      return { seen: true as const };
    }

    if (row) {
      await ctx.db
        .update(userProgress)
        .set({ tutorialSeenAt: now, modifiedAt: now })
        .where(eq(userProgress.userId, ctx.user.id));
    } else {
      await ctx.db.insert(userProgress).values({
        userId: ctx.user.id,
        focusBalance: 0,
        tutorialSeenAt: now,
        modifiedAt: now,
      });
    }

    return { seen: true as const };
  }),
});
