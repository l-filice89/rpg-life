import { tutorialRouter } from './routers/tutorial';
import { tasksRouter } from './routers/tasks';
import { profileRouter } from './routers/profile';
import { focusRouter } from './routers/focus';
import { protectedProcedure, publicProcedure, router } from './trpc';

export { protectedProcedure, publicProcedure, router } from './trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' as const })),
  profile: profileRouter,
  tutorial: tutorialRouter,
  tasks: tasksRouter,
  focus: focusRouter,
});

export type AppRouter = typeof appRouter;
