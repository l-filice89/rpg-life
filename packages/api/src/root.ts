import { tutorialRouter } from './routers/tutorial';
import { tasksRouter } from './routers/tasks';
import { profileRouter } from './routers/profile';
import { protectedProcedure, publicProcedure, router } from './trpc';

export { protectedProcedure, publicProcedure, router } from './trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' as const })),
  profile: profileRouter,
  tutorial: tutorialRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;
