import { useClerk, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "~/utils/api";

function usePostSignUpRegistration() {
  const { user } = useClerk();
  const { isSignedIn } = useAuth();
  const ctx = api.useUtils();

  const { data: isUserRegistered, isLoading: isLoadingQuery } =
    api.users.isUserRegistered.useQuery(user?.id ?? "", {
      enabled: Boolean(user?.id && isSignedIn),
    });

  const { mutate: addNewUser } = api.users.create.useMutation({
    onSuccess: () => {
      ctx.users.getUserByID.invalidate();
    },
  });

  useEffect(() => {
    if (isLoadingQuery || !isSignedIn || isUserRegistered || !user) return;
    addNewUser({
      userId: user.id,
      username: user.username ?? "New user",
      imageUrl: user.imageUrl,
    });
  }, [isLoadingQuery, isSignedIn, isUserRegistered, user, addNewUser]);

  return null;
}

export default usePostSignUpRegistration;
