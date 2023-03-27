import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserIDContext } from "../context/UserIDContext";
import { trpc } from "../utils/trpc";

function useInitializeUserStats() {
  const userID = useUserIDContext();
  const { status } = useSession();

  // also hook to query to see if user exists in db already
  const { data: currentUserStats } = trpc.stats.getStatsByID.useQuery(userID);
  const initializeUser = trpc.stats.initializeUser.useMutation();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (
      currentUserStats === null &&
      !initialized &&
      status === "authenticated"
    ) {
      initializeUser.mutate(userID);

      setInitialized(true);
    }
  }, [userID, initialized, status, initializeUser, currentUserStats]);
}

export default useInitializeUserStats;
