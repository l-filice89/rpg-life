import { listOpenTasksByOwner } from '@rpg-life/db';
import { protectedProcedure, router } from '../trpc';

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOpenTasksByOwner(ctx.db, ctx.user.id);
  }),
});
