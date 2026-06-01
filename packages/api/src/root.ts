import { tutorialRouter } from './routers/tutorial';
import { protectedProcedure, publicProcedure, router } from './trpc';

export { protectedProcedure, publicProcedure, router } from './trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' as const })),
  profile: router({
    ping: protectedProcedure.query(({ ctx }) => ({ userId: ctx.user.id })),
  }),
  tutorial: tutorialRouter,
});

export type AppRouter = typeof appRouter;
