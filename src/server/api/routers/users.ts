import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

interface IFormattedStats {
  [category: string]: IFormattedStat[];
}

interface IFormattedStat {
  username: string;
  color: string;
  avatarPath: string;
  value: number;
}

export const usersRouter = createTRPCRouter({
  isUserRegistered: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: userId }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          userId,
        },
        select: {
          userId: true, // prisma throws runtime error if select is empty
        },
      });

      return Boolean(user);
    }),

  getUserByID: publicProcedure // maybe go protected if it still will return null on "" input
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const user = await ctx.prisma.user.findUnique({
          where: {
            userId: input,
          },
        });
        return user;
      } catch (error) {
        console.log(error);
      }

      return null;
    }),

  getUsersFromIDList: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      if (input.length === 0) return [];

      try {
        const users = ctx.prisma.user.findMany({
          where: {
            userId: { in: input },
          },
        });

        return users;
      } catch (error) {
        console.log(error);
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        imageUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.user
        .create({
          data: {
            userId: input.userId,
            imageUrl: input.imageUrl,
          },
        })
        .catch((err) => {
          console.log(err);
          return false;
        });

      return true;
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        username: z.string(),
        avatarPath: z.string(),
        color: z.string(),
        deckHueRotation: z.number(),
        deckVariantIndex: z.number(),
        squeakPileOnLeft: z.boolean(),
        desktopNotifications: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.user.update({
          where: {
            userId: input.userId, // TODO: gotta update all of these occurances...
          },
          data: {
            username: input.username,
            avatarPath: input.avatarPath,
            color: input.color,
            deckHueRotation: input.deckHueRotation,
            deckVariantIndex: input.deckVariantIndex,
            squeakPileOnLeft: input.squeakPileOnLeft,
            desktopNotifications: input.desktopNotifications,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),

  // TODO: you should probably just update the main leaderboard ranking arrays
  // for each category instead of recalculating them every time
  getLeaderboardStats: publicProcedure.query(async ({ ctx }) => {
    try {
      const allUsers = await ctx.prisma.user.findMany({
        select: {
          username: true,
          color: true,
          avatarPath: true,
          stats: true,
        },
      });

      const leaderboardStats: IFormattedStats = {
        "Total Squeaks": [],
        "Average rank per round": [],
        "Average left in Squeak": [],
        "Highest score per round": [],
        "Total games played": [],
      };

      // plugging in all the stats from each user into the leaderboardStats object
      allUsers.forEach((user) => {
        const baseUserMetadata = {
          username: user.username,
          color: user.color,
          avatarPath: user.avatarPath,
        };

        leaderboardStats["Total Squeaks"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.squeaks || 0,
        });
        leaderboardStats["Average rank per round"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.averageFinishingPlace || 0,
        });
        leaderboardStats["Average left in Squeak"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.averageLeftInSqueak || 0,
        });
        leaderboardStats["Highest score per round"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.highestScore || 0,
        });
        leaderboardStats["Total games played"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.totalGamesPlayed || 0,
        });
      });

      // sorting each stat category by value appropriately
      Object.keys(leaderboardStats).forEach((category) => {
        // not sure if best way to verify that that key exists
        // in the object
        let currentCategory = leaderboardStats[category];

        if (currentCategory === undefined) return;

        if (category === "Total Squeaks") {
          currentCategory = currentCategory
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        } else if (category === "Average rank per round") {
          // removing all "0" values from the array
          currentCategory = currentCategory.filter((stat) => stat.value !== 0);

          currentCategory = currentCategory
            .sort((a, b) => a.value - b.value)
            .slice(0, 10);
        } else if (category === "Average left in Squeak") {
          // removing all "0" values from the array
          currentCategory = currentCategory.filter((stat) => stat.value !== 0);

          currentCategory = currentCategory
            .sort((a, b) => a.value - b.value)
            .slice(0, 10);
        } else if (category === "Highest score per round") {
          currentCategory = currentCategory
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        } else if (category === "Total games played") {
          currentCategory = currentCategory
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        }

        leaderboardStats[category] = currentCategory;
      });

      return leaderboardStats;
    } catch (error) {
      console.log(error);
    }
  }),
});
