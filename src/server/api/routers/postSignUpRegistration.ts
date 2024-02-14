import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const postSignUpRegistrationRouter = createTRPCRouter({
  // doesn't feel fantastic putting this in it's own file, not sure of another
  // organized option though...

  initializeNewUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        username: z.string(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.user
        .create({
          data: {
            userId: input.userId,
            username: input.username,
            imageUrl: input.imageUrl,
          },
        })
        .catch((err) => {
          console.log(err);
          return false;
        });

      return true;
    }),
});
