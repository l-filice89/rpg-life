import { TRPCError } from '@trpc/server';
import { FocusSpendSchema } from '@rpg-life/validators';
import { FocusSpendError, spendFocusForOwner } from '../services/focus-spend';
import { protectedProcedure, router } from '../trpc';

export const focusRouter = router({
  spend: protectedProcedure.input(FocusSpendSchema).mutation(async ({ ctx, input }) => {
    try {
      return await spendFocusForOwner(ctx.db, ctx.user.id, input);
    } catch (error) {
      if (error instanceof FocusSpendError) {
        throw new TRPCError({ code: error.code, message: error.message });
      }
      throw error;
    }
  }),
});
