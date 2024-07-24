import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "~/utils/api";
import useGetUserID from "~/hooks/useGetUserID";

function useInitializeUserStats() {
  const { isSignedIn } = useAuth();

  const userID = useGetUserID();

  // also hook to query to see if user exists in db already
  const { data: currentUserStats } = api.stats.getStatsByID.useQuery(userID);
  const initializeUser = api.stats.initializeUser.useMutation();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentUserStats === null && !initialized && isSignedIn) {
      initializeUser.mutate(userID);

      setInitialized(true);
    }
  }, [userID, initialized, isSignedIn, initializeUser, currentUserStats]);
}

export default useInitializeUserStats;
