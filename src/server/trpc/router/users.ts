import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

interface IFormattedStats {
  [category: string]: IFormattedStat[];
}

interface IFormattedStat {
  username: string;
  color: string;
  avatarPath: string;
  value: number;
}

export const usersRouter = router({
  getUserByID: publicProcedure // maybe go protected if it still will return null on "" input
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === "") return null;

      try {
        const user = await ctx.prisma.user.findUnique({
          where: {
            id: input,
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
            id: { in: input },
          },
        });

        return users;
      } catch (error) {
        console.log(error);
      }
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        username: z.string(),
        avatarPath: z.string(),
        color: z.string(),
        deckHueRotation: z.number(),
        squeakPileOnLeft: z.boolean(),
        desktopNotifications: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.user.update({
          where: {
            id: input.id,
          },
          data: {
            username: input.username,
            avatarPath: input.avatarPath,
            color: input.color,
            deckHueRotation: input.deckHueRotation,
            squeakPileOnLeft: input.squeakPileOnLeft,
            desktopNotifications: input.desktopNotifications,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),

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
        "Average rank": [],
        "Average left in Squeak": [],
        "Highest score": [],
        "Lowest score": [],
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
        leaderboardStats["Average rank"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.averageFinishingPlace || 0,
        });
        leaderboardStats["Average left in Squeak"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.averageLeftInSqueak || 0,
        });
        leaderboardStats["Highest score"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.highestScore || 0,
        });
        leaderboardStats["Lowest score"]?.push({
          ...baseUserMetadata,
          value: user?.stats?.lowestScore || 0,
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
        let currentlyCategory = leaderboardStats[category];

        if (currentlyCategory === undefined) return;

        if (category === "Total Squeaks") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => b.value + a.value)
            .slice(0, 10);
        } else if (category === "Average rank") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => a.value - b.value)
            .slice(0, 10);
        } else if (category === "Average left in Squeak") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        } else if (category === "Highest score") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => b.value + a.value)
            .slice(0, 10);
        } else if (category === "Lowest score") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => a.value - b.value)
            .slice(0, 10);
        } else if (category === "Total games played") {
          currentlyCategory = currentlyCategory
            .sort((a, b) => b.value + a.value)
            .slice(0, 10);
        }

        leaderboardStats[category] = currentlyCategory;
      });

      return leaderboardStats;
    } catch (error) {
      console.log(error);
    }
  }),
});
