import { getProfileSummary } from '@rpg-life/db';
import { protectedProcedure, router } from '../trpc';

export const profileRouter = router({
  ping: protectedProcedure.query(({ ctx }) => ({ userId: ctx.user.id })),
  get: protectedProcedure.query(async ({ ctx }) => {
    return getProfileSummary(ctx.db, ctx.user.id);
  }),
});
