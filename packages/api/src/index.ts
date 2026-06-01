import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from './root';

export {
  appRouter,
  type AppRouter,
  publicProcedure,
  protectedProcedure,
  router,
} from './root';
export { createContext, type Context } from './context';

export type TaskListItem = inferRouterOutputs<AppRouter>['tasks']['list'][number];
export type ProfileSummary = inferRouterOutputs<AppRouter>['profile']['get'];
export type { TaskCreateInput, TaskUpdateInput } from '@rpg-life/validators';
