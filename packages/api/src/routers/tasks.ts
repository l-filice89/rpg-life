import {
  createTaskForOwner,
  listOpenTasksByOwner,
  softDeleteTaskForOwner,
  TaskMutationError,
  updateTaskForOwner,
} from '@rpg-life/db';
import {
  CompleteTaskSchema,
  TaskCreateSchema,
  TaskDeleteSchema,
  TaskUpdateSchema,
} from '@rpg-life/validators';
import { TRPCError } from '@trpc/server';
import { CompleteTaskError, completeTaskForOwner } from '../services/complete-task';
import { protectedProcedure, router } from '../trpc';

function mapTaskMutationError(error: unknown): never {
  if (error instanceof TaskMutationError) {
    throw new TRPCError({ code: error.code, message: error.message });
  }
  throw error;
}

function mapCompleteTaskError(error: unknown): never {
  if (error instanceof CompleteTaskError) {
    throw new TRPCError({ code: error.code, message: error.message });
  }
  throw error;
}

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOpenTasksByOwner(ctx.db, ctx.user.id);
  }),

  create: protectedProcedure.input(TaskCreateSchema).mutation(async ({ ctx, input }) => {
    return createTaskForOwner(ctx.db, ctx.user.id, input);
  }),

  update: protectedProcedure.input(TaskUpdateSchema).mutation(async ({ ctx, input }) => {
    try {
      return await updateTaskForOwner(ctx.db, ctx.user.id, input);
    } catch (error) {
      mapTaskMutationError(error);
    }
  }),

  delete: protectedProcedure.input(TaskDeleteSchema).mutation(async ({ ctx, input }) => {
    try {
      return await softDeleteTaskForOwner(ctx.db, ctx.user.id, input.id);
    } catch (error) {
      mapTaskMutationError(error);
    }
  }),

  complete: protectedProcedure.input(CompleteTaskSchema).mutation(async ({ ctx, input }) => {
    try {
      return await completeTaskForOwner(ctx.db, ctx.user.id, input);
    } catch (error) {
      mapCompleteTaskError(error);
    }
  }),
});
