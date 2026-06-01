import { createTaskForOwner, listOpenTasksByOwner } from '@rpg-life/db';
import { TaskCreateSchema } from '@rpg-life/validators';
import { protectedProcedure, router } from '../trpc';

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOpenTasksByOwner(ctx.db, ctx.user.id);
  }),

  create: protectedProcedure.input(TaskCreateSchema).mutation(async ({ ctx, input }) => {
    return createTaskForOwner(ctx.db, ctx.user.id, input);
  }),
});
